import { db, type Db } from "@/lib/db"
import type { Booking } from "@/app/api/bookings/route"
import type { GuideAccessEntry } from "@/app/api/guide-access/route"
import type { Expense } from "@/lib/expenses"

// All reads and writes of app data. Every function takes an optional `tx` so
// it can join a transaction (see `transaction` in lib/db.ts).

// ── Bookings ──────────────────────────────────────────────────

const BOOKING_COLUMNS = `
    id, house, house_name AS "houseName", guest_name AS "guestName",
    guest_email AS "guestEmail", guest_phone AS "guestPhone",
    check_in AS "checkIn", check_out AS "checkOut", nights, guests,
    price_per_night AS "pricePerNight", cleaning_fee AS "cleaningFee",
    service_fee AS "serviceFee", total, total_rwf AS "totalRwf",
    momo_transaction_id AS "momoTransactionId", special_requests AS "specialRequests",
    status, source, created_at AS "createdAt"`

function toBooking(row: any): Booking {
    const { source, createdAt, ...rest } = row
    return {
        ...rest,
        createdAt: createdAt.toISOString(),
        // absent on website bookings
        ...(source ? { source } : {}),
    }
}

/** Bookings, newest first. */
export async function listBookings(
    filter: { house?: string | null; status?: string | null } = {},
    tx: Db = db
): Promise<Booking[]> {
    const { rows } = await tx.query(
        `SELECT ${BOOKING_COLUMNS} FROM bookings
         WHERE ($1::text IS NULL OR house = $1) AND ($2::text IS NULL OR status = $2)
         ORDER BY created_at DESC`,
        [filter.house || null, filter.status || null]
    )
    return rows.map(toBooking)
}

/** Insert a booking; its id ("BK-023") and createdAt are assigned here. */
export async function insertBooking(data: Omit<Booking, "id" | "createdAt">, tx: Db = db): Promise<Booking> {
    const seq = await tx.query(`SELECT nextval('booking_number_seq') AS n`)
    const id = `BK-${String(seq.rows[0].n).padStart(3, "0")}`
    const { rows } = await tx.query(
        `INSERT INTO bookings (
            id, house, house_name, guest_name, guest_email, guest_phone, check_in, check_out,
            nights, guests, price_per_night, cleaning_fee, service_fee, total, total_rwf,
            momo_transaction_id, special_requests, status, source
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING ${BOOKING_COLUMNS}`,
        [
            id, data.house, data.houseName, data.guestName, data.guestEmail, data.guestPhone,
            data.checkIn, data.checkOut, data.nights, data.guests, data.pricePerNight,
            data.cleaningFee, data.serviceFee, data.total, data.totalRwf,
            data.momoTransactionId, data.specialRequests, data.status, data.source ?? null,
        ]
    )
    return toBooking(rows[0])
}

/** Change a booking's status. Returns null when the booking does not exist. */
export async function setBookingStatus(
    id: string,
    status: Booking["status"],
    tx: Db = db
): Promise<{ booking: Booking; previousStatus: Booking["status"] } | null> {
    const current = await tx.query(`SELECT status FROM bookings WHERE id = $1 FOR UPDATE`, [id])
    if (current.rows.length === 0) return null
    const { rows } = await tx.query(
        `UPDATE bookings SET status = $2 WHERE id = $1 RETURNING ${BOOKING_COLUMNS}`,
        [id, status]
    )
    return { booking: toBooking(rows[0]), previousStatus: current.rows[0].status }
}

/** Remove a booking. Returns it, or null when it does not exist. */
export async function deleteBooking(id: string, tx: Db = db): Promise<Booking | null> {
    const { rows } = await tx.query(`DELETE FROM bookings WHERE id = $1 RETURNING ${BOOKING_COLUMNS}`, [id])
    return rows.length > 0 ? toBooking(rows[0]) : null
}

// ── Blocked dates ─────────────────────────────────────────────

const isDate = (d: unknown): d is string => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)

/** Blocked "yyyy-MM-dd" dates of one house, sorted. */
export async function getBlockedDates(house: string, tx: Db = db): Promise<string[]> {
    const { rows } = await tx.query(`SELECT date FROM blocked_dates WHERE house = $1 ORDER BY date`, [house])
    return rows.map((r) => r.date)
}

/** Blocked dates of every house: { "house-23": ["2026-10-05", ...] } */
export async function getAllBlockedDates(tx: Db = db): Promise<Record<string, string[]>> {
    const { rows } = await tx.query(`SELECT house, date FROM blocked_dates ORDER BY house, date`)
    const result: Record<string, string[]> = {}
    for (const row of rows) {
        (result[row.house] ||= []).push(row.date)
    }
    return result
}

export async function blockDates(house: string, dates: string[], tx: Db = db): Promise<void> {
    await tx.query(
        `INSERT INTO blocked_dates (house, date) SELECT $1, unnest($2::date[]) ON CONFLICT DO NOTHING`,
        [house, dates.filter(isDate)]
    )
}

export async function unblockDates(house: string, dates: string[], tx: Db = db): Promise<void> {
    await tx.query(`DELETE FROM blocked_dates WHERE house = $1 AND date = ANY($2::date[])`, [
        house,
        dates.filter(isDate),
    ])
}

// ── House guide access ────────────────────────────────────────

const GUIDE_COLUMNS = `code, label, source, booking_id AS "bookingId", created_at AS "createdAt"`

function toGuideAccess(row: any): GuideAccessEntry {
    return {
        code: row.code,
        label: row.label,
        source: row.source,
        ...(row.bookingId ? { bookingId: row.bookingId } : {}),
        createdAt: row.createdAt.toISOString(),
    }
}

/** Access codes, oldest first. */
export async function listGuideAccess(tx: Db = db): Promise<GuideAccessEntry[]> {
    const { rows } = await tx.query(`SELECT ${GUIDE_COLUMNS} FROM guide_access ORDER BY created_at, code`)
    return rows.map(toGuideAccess)
}

export async function findGuideAccess(code: string, tx: Db = db): Promise<GuideAccessEntry | null> {
    const { rows } = await tx.query(`SELECT ${GUIDE_COLUMNS} FROM guide_access WHERE code = $1`, [code])
    return rows.length > 0 ? toGuideAccess(rows[0]) : null
}

/** Add an access code. Returns null when the code already exists. */
export async function addGuideAccess(
    entry: Omit<GuideAccessEntry, "createdAt">,
    tx: Db = db
): Promise<GuideAccessEntry | null> {
    const { rows } = await tx.query(
        `INSERT INTO guide_access (code, label, source, booking_id) VALUES ($1, $2, $3, $4)
         ON CONFLICT (code) DO NOTHING RETURNING ${GUIDE_COLUMNS}`,
        [entry.code, entry.label, entry.source, entry.bookingId ?? null]
    )
    return rows.length > 0 ? toGuideAccess(rows[0]) : null
}

/** Rename an access code. Returns null when the code does not exist. */
export async function setGuideAccessLabel(code: string, label: string, tx: Db = db): Promise<GuideAccessEntry | null> {
    const { rows } = await tx.query(
        `UPDATE guide_access SET label = $2 WHERE code = $1 RETURNING ${GUIDE_COLUMNS}`,
        [code, label]
    )
    return rows.length > 0 ? toGuideAccess(rows[0]) : null
}

/** Delete the given codes, or every code when `codes` is "all". Returns how many were deleted. */
export async function deleteGuideAccess(codes: string[] | "all", tx: Db = db): Promise<number> {
    const result =
        codes === "all"
            ? await tx.query(`DELETE FROM guide_access`)
            : await tx.query(`DELETE FROM guide_access WHERE code = ANY($1::text[])`, [codes])
    return result.rowCount ?? 0
}

/** Remove a code only if it was added by this booking. */
export async function deleteGuideAccessOfBooking(code: string, bookingId: string, tx: Db = db): Promise<void> {
    await tx.query(`DELETE FROM guide_access WHERE code = $1 AND source = 'booking' AND booking_id = $2`, [
        code,
        bookingId,
    ])
}

// ── Expenses ──────────────────────────────────────────────────

const EXPENSE_COLUMNS = `id, house, category, amount_rwf AS "amountRwf", date, note, created_at AS "createdAt"`

function toExpense(row: any): Expense {
    return { ...row, createdAt: row.createdAt.toISOString() }
}

/** Expenses, newest first: by expense date, then by when it was recorded. */
export async function listExpenses(tx: Db = db): Promise<Expense[]> {
    const { rows } = await tx.query(`SELECT ${EXPENSE_COLUMNS} FROM expenses ORDER BY date DESC, created_at DESC`)
    return rows.map(toExpense)
}

export async function insertExpense(expense: Omit<Expense, "createdAt">, tx: Db = db): Promise<Expense> {
    const { rows } = await tx.query(
        `INSERT INTO expenses (id, house, category, amount_rwf, date, note) VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING ${EXPENSE_COLUMNS}`,
        [expense.id, expense.house, expense.category, expense.amountRwf, expense.date, expense.note]
    )
    return toExpense(rows[0])
}

/** Returns false when the expense does not exist. */
export async function deleteExpense(id: string, tx: Db = db): Promise<boolean> {
    const result = await tx.query(`DELETE FROM expenses WHERE id = $1`, [id])
    return (result.rowCount ?? 0) > 0
}

// ── Per-house settings ────────────────────────────────────────

export type HouseSettingKey = "prices" | "photo-order" | "photo-categories" | "calendar-config"

/** One setting for every house that has it: { "house-23": value, ... } */
export async function getHouseSettings<T>(key: HouseSettingKey, tx: Db = db): Promise<Record<string, T>> {
    const { rows } = await tx.query(`SELECT house, value FROM house_settings WHERE key = $1`, [key])
    return Object.fromEntries(rows.map((r) => [r.house, r.value]))
}

export async function getHouseSetting<T>(key: HouseSettingKey, house: string, tx: Db = db): Promise<T | undefined> {
    const { rows } = await tx.query(`SELECT value FROM house_settings WHERE key = $1 AND house = $2`, [key, house])
    return rows[0]?.value
}

export async function setHouseSetting(key: HouseSettingKey, house: string, value: unknown, tx: Db = db): Promise<void> {
    await tx.query(
        `INSERT INTO house_settings (key, house, value) VALUES ($1, $2, $3::jsonb)
         ON CONFLICT (key, house) DO UPDATE SET value = EXCLUDED.value`,
        [key, house, JSON.stringify(value)]
    )
}
