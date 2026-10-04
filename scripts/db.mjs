// Database setup and one-off import of the old JSON data.
//
//   pnpm db:setup                          create the tables (safe to repeat)
//   pnpm db:import blob                    import the live production data from Vercel Blob
//   pnpm db:import backups/prod-blob-...   import a folder of *.json files
//   pnpm db:import <source> --replace      empty the tables first, then import
//
// Reads DATABASE_URL (and BLOB_READ_WRITE_TOKEN for "blob") from .env.local.

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import pg from "pg"

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")
const TABLES = ["bookings", "blocked_dates", "guide_access", "expenses", "house_settings"]
const SETTING_KEYS = ["prices", "photo-order", "photo-categories", "calendar-config"]

const [command, source, ...flags] = process.argv.slice(2)
const replace = flags.includes("--replace")

if (!["setup", "import"].includes(command) || (command === "import" && !source)) {
    console.error("Usage: node scripts/db.mjs setup | import <blob|folder> [--replace]")
    process.exit(1)
}
if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Add the Neon connection string to .env.local.")
    process.exit(1)
}

// Read one JSON document from the live Blob store (null when it does not exist)
async function readBlob(filename) {
    const { get } = await import("@vercel/blob")
    const result = await get(filename, {
        access: "private",
        token: process.env.BLOB_READ_WRITE_TOKEN,
        useCache: false,
    })
    if (!result?.stream) return null
    return JSON.parse(await new Response(result.stream).text())
}

function readFile(folder, filename) {
    const file = path.resolve(folder, filename)
    return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf-8")) : null
}

async function load(name, fallback) {
    const filename = `${name}.json`
    const data = source === "blob" ? await readBlob(filename) : readFile(source, filename)
    if (data === null) console.warn(`  (no ${filename} in the source, importing it as empty)`)
    return data ?? fallback
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
await client.connect()

try {
    await client.query(fs.readFileSync(path.join(root, "db", "schema.sql"), "utf-8"))
    console.log("Schema is in place.")

    if (command === "import") {
        console.log(`Reading from ${source === "blob" ? "Vercel Blob (live)" : path.resolve(source)}`)
        const bookings = await load("bookings", [])
        const blockedDates = await load("blocked-dates", {})
        const guideAccess = await load("guide-access", [])
        const expenses = await load("expenses", [])
        const settings = {}
        for (const key of SETTING_KEYS) settings[key] = await load(key, {})

        await client.query("BEGIN")

        if (replace) {
            await client.query(`TRUNCATE ${TABLES.join(", ")}`)
        } else {
            for (const table of TABLES) {
                const { rows } = await client.query(`SELECT count(*)::int AS n FROM ${table}`)
                if (rows[0].n > 0) {
                    throw new Error(
                        `Table "${table}" already has ${rows[0].n} rows. Nothing was imported. ` +
                        `Pass --replace to empty the tables and import again.`
                    )
                }
            }
        }

        for (const b of bookings) {
            await client.query(
                `INSERT INTO bookings (
                    id, house, house_name, guest_name, guest_email, guest_phone, check_in, check_out,
                    nights, guests, price_per_night, cleaning_fee, service_fee, total, total_rwf,
                    momo_transaction_id, special_requests, status, source, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
                [
                    b.id, b.house, b.houseName || b.house, b.guestName || "", b.guestEmail || "", b.guestPhone || "",
                    b.checkIn, b.checkOut, b.nights || 0, b.guests || 1, b.pricePerNight || 0,
                    b.cleaningFee || 0, b.serviceFee || 0, b.total || 0, b.totalRwf || 0,
                    b.momoTransactionId || "", b.specialRequests || "", b.status, b.source ?? null, b.createdAt,
                ]
            )
        }

        // New booking ids continue after the highest imported number
        const highest = Math.max(0, ...bookings.map((b) => parseInt(String(b.id).replace("BK-", ""), 10) || 0))
        await client.query(`SELECT setval('booking_number_seq', $1, $2)`, [Math.max(highest, 1), highest > 0])

        let blockedCount = 0
        for (const [house, dates] of Object.entries(blockedDates)) {
            const unique = [...new Set(dates)]
            blockedCount += unique.length
            await client.query(`INSERT INTO blocked_dates (house, date) SELECT $1, unnest($2::date[])`, [house, unique])
        }

        for (const e of guideAccess) {
            await client.query(
                `INSERT INTO guide_access (code, label, source, booking_id, created_at) VALUES ($1, $2, $3, $4, $5)`,
                [e.code, e.label || "", e.source || "manual", e.bookingId ?? null, e.createdAt]
            )
        }

        for (const e of expenses) {
            await client.query(
                `INSERT INTO expenses (id, house, category, amount_rwf, date, note, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [e.id, e.house, e.category, e.amountRwf, e.date, e.note || "", e.createdAt]
            )
        }

        let settingsCount = 0
        for (const key of SETTING_KEYS) {
            for (const [house, value] of Object.entries(settings[key])) {
                settingsCount++
                await client.query(`INSERT INTO house_settings (key, house, value) VALUES ($1, $2, $3::jsonb)`, [
                    key,
                    house,
                    JSON.stringify(value),
                ])
            }
        }

        // Check what landed against what was read before keeping it
        const expected = {
            bookings: bookings.length,
            blocked_dates: blockedCount,
            guide_access: guideAccess.length,
            expenses: expenses.length,
            house_settings: settingsCount,
        }
        for (const table of TABLES) {
            const { rows } = await client.query(`SELECT count(*)::int AS n FROM ${table}`)
            if (rows[0].n !== expected[table]) {
                throw new Error(`"${table}" has ${rows[0].n} rows, expected ${expected[table]}. Nothing was imported.`)
            }
            console.log(`  ${table.padEnd(15)} ${rows[0].n} rows`)
        }

        await client.query("COMMIT")
        console.log("Import complete.")
    }
} catch (error) {
    await client.query("ROLLBACK").catch(() => { })
    console.error(error.message)
    process.exitCode = 1
} finally {
    await client.end()
}
