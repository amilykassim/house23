import { NextRequest, NextResponse } from "next/server"
import { expandDateRange, getUnavailableDates } from "@/lib/airbnb-ical"
import { sendBookingAcknowledgment, sendBookingConfirmation, sendBookingCancellation, sendAdminNewBookingNotification } from "@/lib/email"
import { transaction, type Db } from "@/lib/db"
import {
    addGuideAccess,
    blockDates,
    deleteBooking,
    deleteGuideAccessOfBooking,
    getBlockedDates,
    insertBooking,
    listBookings,
    setBookingStatus,
    unblockDates,
} from "@/lib/store"
import { USD_TO_RWF } from "@/lib/currency"

export const dynamic = "force-dynamic"

export interface Booking {
    id: string
    house: string
    houseName: string
    guestName: string
    guestEmail: string
    guestPhone: string
    checkIn: string
    checkOut: string
    nights: number
    guests: number
    pricePerNight: number
    cleaningFee: number
    serviceFee: number
    total: number
    totalRwf: number
    momoTransactionId: string
    specialRequests: string
    status: "pending" | "confirmed" | "cancelled"
    createdAt: string
    // "manual" = recorded by hand in the admin panel; absent on website bookings
    source?: "website" | "manual"
}

function extractLast4(phone: string): string {
    return phone.replace(/\D/g, "").slice(-4)
}

async function addGuideAccessForBooking(booking: Booking, tx: Db): Promise<void> {
    const code = extractLast4(booking.guestPhone)
    if (code.length !== 4) return

    // Does nothing when the code already exists
    await addGuideAccess({ code, label: booking.guestName, source: "booking", bookingId: booking.id }, tx)
}

async function removeGuideAccessForBooking(booking: Booking, tx: Db): Promise<void> {
    const code = extractLast4(booking.guestPhone)
    if (code.length !== 4) return

    // Only remove if this was the booking that added it
    await deleteGuideAccessOfBooking(code, booking.id, tx)
}

const isDate = (d: unknown): d is string => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const house = searchParams.get("house")
    const status = searchParams.get("status")

    console.log(`[bookings GET] Fetching bookings, house=${house}, status=${status}`)

    try {
        // Newest first
        const bookings = await listBookings({ house, status })

        console.log(`[bookings GET] Returning ${bookings.length} bookings`)
        return NextResponse.json({ bookings })
    } catch (error) {
        console.error(`[bookings GET] ERROR:`, error)
        return NextResponse.json({ bookings: [], error: String(error) }, { status: 500 })
    }
}

// [today, tomorrow] as local "yyyy-MM-dd" strings
function todayAndTomorrow(): [string, string] {
    const fmt = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    const now = new Date()
    const next = new Date(now)
    next.setDate(now.getDate() + 1)
    return [fmt(now), fmt(next)]
}

// Record a booking by hand from the admin panel: confirmed straight away,
// dates blocked, no guest emails.
async function createManualBooking(request: NextRequest, body: Record<string, unknown>) {
    if (request.cookies.get("admin_auth")?.value !== "authenticated") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const house = typeof body.house === "string" ? body.house : ""
    const checkIn = typeof body.checkIn === "string" ? body.checkIn : ""
    const checkOut = typeof body.checkOut === "string" ? body.checkOut : ""
    // The admin form records the amount in RWF; USD is derived from it.
    const paidRwf = Number(body.totalRwf)
    const total = paidRwf > 0 ? Math.round((paidRwf / USD_TO_RWF) * 100) / 100 : Number(body.total)

    if (!house || !isDate(checkIn) || !isDate(checkOut) || !(total > 0)) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const stayDates = expandDateRange(checkIn, checkOut)
    if (stayDates.length === 0) {
        return NextResponse.json({ error: "Check-out must be after check-in" }, { status: 400 })
    }

    // Conflicts are other bookings (confirmed, or pending from the website) and,
    // from today on, admin blocks. Airbnb holds don't stand in the way: this is
    // how an Airbnb stay gets recorded. Past nights ignore admin blocks so a
    // stay that already happened can be recorded late.
    const active = (await listBookings({ house })).filter((b) => b.status !== "cancelled")
    const booked = new Set(active.flatMap((b) => expandDateRange(b.checkIn, b.checkOut)))
    const blocked = new Set(await getBlockedDates(house))
    const [today] = todayAndTomorrow()
    const conflicts = stayDates.filter((d) => booked.has(d) || (d >= today && blocked.has(d)))
    if (conflicts.length > 0) {
        return NextResponse.json(
            {
                error: "Some of the selected dates are no longer available",
                unavailableDates: conflicts,
            },
            { status: 409 }
        )
    }

    const newBooking = await transaction(async (tx) => {
        const booking = await insertBooking({
            house,
            houseName: typeof body.houseName === "string" && body.houseName ? body.houseName : house,
            guestName: typeof body.guestName === "string" && body.guestName ? body.guestName : "Added by hand",
            guestEmail: "",
            guestPhone: typeof body.guestPhone === "string" ? body.guestPhone : "",
            checkIn,
            checkOut,
            nights: stayDates.length,
            guests: Math.round(Number(body.guests)) || 1,
            pricePerNight: Number(body.pricePerNight) || 0,
            cleaningFee: Number(body.cleaningFee) || 0,
            serviceFee: 0,
            total,
            totalRwf: paidRwf > 0 ? Math.round(paidRwf) : Math.round(total * USD_TO_RWF),
            momoTransactionId: "",
            specialRequests: "",
            status: "confirmed",
            source: "manual",
        }, tx)
        await blockDates(house, stayDates, tx)
        return booking
    })

    return NextResponse.json({ booking: newBooking }, { status: 201 })
}

export async function POST(request: NextRequest) {
    const body = await request.json()
    if (body.manual === true) {
        return createManualBooking(request, body)
    }
    const {
        house,
        houseName,
        guestName,
        guestEmail,
        guestPhone,
        checkIn,
        checkOut,
        nights,
        guests,
        pricePerNight,
        cleaningFee,
        serviceFee,
        total,
        totalRwf,
        momoTransactionId,
        specialRequests,
    } = body

    if (!house || !guestName || !isDate(checkIn) || !isDate(checkOut)) {
        return NextResponse.json(
            { error: "Missing required fields" },
            { status: 400 }
        )
    }

    // Re-check availability at submission time so a night that was taken
    // (on Airbnb or blocked by the admin) while the guest was booking is refused.
    const unavailable = await getUnavailableDates(house)
    const conflicts = expandDateRange(checkIn, checkOut).filter((d) => unavailable.has(d))
    if (conflicts.length > 0) {
        return NextResponse.json(
            {
                error: "Some of the selected dates are no longer available",
                unavailableDates: conflicts,
            },
            { status: 409 }
        )
    }

    const newBooking = await insertBooking({
        house,
        houseName: houseName || house,
        guestName,
        guestEmail: guestEmail || "",
        guestPhone: guestPhone || "",
        checkIn,
        checkOut,
        nights: Math.round(Number(nights)) || 0,
        guests: Math.round(Number(guests)) || 1,
        pricePerNight: Number(pricePerNight) || 0,
        cleaningFee: Number(cleaningFee) || 0,
        serviceFee: Number(serviceFee) || 0,
        total: Number(total) || 0,
        totalRwf: Number(totalRwf) || 0,
        momoTransactionId: momoTransactionId || "",
        specialRequests: specialRequests || "",
        status: "pending",
    })

    // Send emails (non-blocking)
    const emailData = {
        guestName: newBooking.guestName,
        guestEmail: newBooking.guestEmail,
        guestPhone: newBooking.guestPhone,
        houseName: newBooking.houseName,
        checkIn: newBooking.checkIn,
        checkOut: newBooking.checkOut,
        nights: newBooking.nights,
        guests: newBooking.guests,
        total: newBooking.total,
        totalRwf: newBooking.totalRwf,
        momoTransactionId: newBooking.momoTransactionId,
        specialRequests: newBooking.specialRequests,
        bookingId: newBooking.id,
    }
    if (newBooking.guestEmail) {
        sendBookingAcknowledgment(emailData).catch(() => { })
    }
    sendAdminNewBookingNotification(emailData).catch(() => { })

    return NextResponse.json({ booking: newBooking }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
    const body = await request.json()
    const { id, status, rejectionReason } = body as { id: string; status: Booking["status"]; rejectionReason?: string }

    if (!id || !["pending", "confirmed", "cancelled"].includes(status)) {
        return NextResponse.json(
            { error: "Missing id or status" },
            { status: 400 }
        )
    }

    const booking = await transaction(async (tx) => {
        const updated = await setBookingStatus(id, status, tx)
        if (!updated) return null
        const { booking, previousStatus } = updated

        // Auto-block dates when confirming, unblock when moving away from confirmed
        const stayDates = expandDateRange(booking.checkIn, booking.checkOut)
        if (status === "confirmed" && previousStatus !== "confirmed") {
            await blockDates(booking.house, stayDates, tx)
            // Auto-add guest phone to house guide access
            await addGuideAccessForBooking(booking, tx)
        } else if (status !== "confirmed" && previousStatus === "confirmed") {
            await unblockDates(booking.house, stayDates, tx)
            // Remove guest phone from house guide access
            await removeGuideAccessForBooking(booking, tx)
        }
        return booking
    })

    if (!booking) {
        return NextResponse.json(
            { error: "Booking not found" },
            { status: 404 }
        )
    }

    // Send email notifications (non-blocking)
    if (booking.guestEmail) {
        const emailData = {
            guestName: booking.guestName,
            guestEmail: booking.guestEmail,
            guestPhone: booking.guestPhone,
            houseName: booking.houseName,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            nights: booking.nights,
            guests: booking.guests,
            total: booking.total,
            totalRwf: booking.totalRwf,
            momoTransactionId: booking.momoTransactionId,
            specialRequests: booking.specialRequests,
            bookingId: booking.id,
        }
        if (status === "confirmed") {
            sendBookingConfirmation(emailData).catch(() => { })
        } else if (status === "cancelled") {
            sendBookingCancellation({ ...emailData, rejectionReason: rejectionReason as any }).catch(() => { })
        }
    }

    return NextResponse.json({ booking })
}

// Permanently remove a booking (admin only). A confirmed booking also gives
// back its dates and its house-guide access; no email is sent to the guest.
export async function DELETE(request: NextRequest) {
    if (request.cookies.get("admin_auth")?.value !== "authenticated") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
        return NextResponse.json(
            { error: "Missing booking id" },
            { status: 400 }
        )
    }

    const removed = await transaction(async (tx) => {
        const removed = await deleteBooking(id, tx)
        if (removed?.status === "confirmed") {
            // Free the nights, except any still covered by another confirmed booking
            const others = await listBookings({ house: removed.house, status: "confirmed" }, tx)
            const stillBooked = new Set(others.flatMap((b) => expandDateRange(b.checkIn, b.checkOut)))
            const freed = expandDateRange(removed.checkIn, removed.checkOut).filter((d) => !stillBooked.has(d))
            if (freed.length > 0) {
                await unblockDates(removed.house, freed, tx)
            }
            await removeGuideAccessForBooking(removed, tx)
        }
        return removed
    })

    if (!removed) {
        return NextResponse.json(
            { error: "Booking not found" },
            { status: 404 }
        )
    }

    return NextResponse.json({ success: true })
}
