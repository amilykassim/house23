import { NextRequest, NextResponse } from "next/server"
import { sendBookingAcknowledgment, sendBookingConfirmation, sendBookingCancellation, sendAdminNewBookingNotification } from "@/lib/email"
import { readData, writeData } from "@/lib/storage"

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
}

async function readBookings(): Promise<Booking[]> {
    return readData<Booking[]>("bookings.json", [])
}

async function writeBookings(data: Booking[]): Promise<void> {
    await writeData("bookings.json", data)
}

async function readBlockedDates(): Promise<Record<string, string[]>> {
    return readData<Record<string, string[]>>("blocked-dates.json", {})
}

async function writeBlockedDates(data: Record<string, string[]>): Promise<void> {
    await writeData("blocked-dates.json", data)
}

function getDatesBetween(checkIn: string, checkOut: string): string[] {
    const dates: string[] = []
    const current = new Date(checkIn + "T00:00:00")
    const end = new Date(checkOut + "T00:00:00")
    while (current < end) {
        const y = current.getFullYear()
        const m = String(current.getMonth() + 1).padStart(2, "0")
        const d = String(current.getDate()).padStart(2, "0")
        dates.push(`${y}-${m}-${d}`)
        current.setDate(current.getDate() + 1)
    }
    return dates
}

async function blockDatesForBooking(house: string, checkIn: string, checkOut: string) {
    const blockedDates = await readBlockedDates()
    const current = new Set(blockedDates[house] || [])
    const dates = getDatesBetween(checkIn, checkOut)
    dates.forEach((d) => current.add(d))
    blockedDates[house] = Array.from(current).sort()
    await writeBlockedDates(blockedDates)
}

async function unblockDatesForBooking(house: string, checkIn: string, checkOut: string) {
    const blockedDates = await readBlockedDates()
    const current = new Set(blockedDates[house] || [])
    const dates = getDatesBetween(checkIn, checkOut)
    dates.forEach((d) => current.delete(d))
    blockedDates[house] = Array.from(current).sort()
    await writeBlockedDates(blockedDates)
}

async function generateId(): Promise<string> {
    const bookings = await readBookings()
    const maxNum = bookings.reduce((max, b) => {
        const num = parseInt(b.id.replace("BK-", ""), 10)
        return num > max ? num : max
    }, 0)
    return `BK-${String(maxNum + 1).padStart(3, "0")}`
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const house = searchParams.get("house")
    const status = searchParams.get("status")

    console.log(`[bookings GET] Fetching bookings, house=${house}, status=${status}`)

    try {
        let bookings = await readBookings()
        console.log(`[bookings GET] Raw bookings count: ${bookings.length}`)

        if (house) {
            bookings = bookings.filter((b) => b.house === house)
        }
        if (status) {
            bookings = bookings.filter((b) => b.status === status)
        }

        // Sort by createdAt descending
        bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

        console.log(`[bookings GET] Returning ${bookings.length} bookings`)
        return NextResponse.json({ bookings })
    } catch (error) {
        console.error(`[bookings GET] ERROR:`, error)
        return NextResponse.json({ bookings: [], error: String(error) }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const body = await request.json()
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

    if (!house || !guestName || !checkIn || !checkOut) {
        return NextResponse.json(
            { error: "Missing required fields" },
            { status: 400 }
        )
    }

    const bookings = await readBookings()
    const newBooking: Booking = {
        id: await generateId(),
        house,
        houseName: houseName || house,
        guestName,
        guestEmail: guestEmail || "",
        guestPhone: guestPhone || "",
        checkIn,
        checkOut,
        nights: nights || 0,
        guests: guests || 1,
        pricePerNight: pricePerNight || 0,
        cleaningFee: cleaningFee || 0,
        serviceFee: serviceFee || 0,
        total: total || 0,
        totalRwf: totalRwf || 0,
        momoTransactionId: momoTransactionId || "",
        specialRequests: specialRequests || "",
        status: "pending",
        createdAt: new Date().toISOString(),
    }

    bookings.push(newBooking)
    await writeBookings(bookings)

    // Send emails (non-blocking)
    const emailData = {
        guestName: newBooking.guestName,
        guestEmail: newBooking.guestEmail,
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

    if (!id || !status) {
        return NextResponse.json(
            { error: "Missing id or status" },
            { status: 400 }
        )
    }

    const bookings = await readBookings()
    const index = bookings.findIndex((b) => b.id === id)

    if (index === -1) {
        return NextResponse.json(
            { error: "Booking not found" },
            { status: 404 }
        )
    }

    const previousStatus = bookings[index].status
    bookings[index].status = status
    await writeBookings(bookings)

    // Auto-block dates when confirming, unblock when moving away from confirmed
    const booking = bookings[index]
    if (status === "confirmed" && previousStatus !== "confirmed") {
        await blockDatesForBooking(booking.house, booking.checkIn, booking.checkOut)
    } else if (status !== "confirmed" && previousStatus === "confirmed") {
        await unblockDatesForBooking(booking.house, booking.checkIn, booking.checkOut)
    }

    // Send email notifications (non-blocking)
    if (booking.guestEmail) {
        const emailData = {
            guestName: booking.guestName,
            guestEmail: booking.guestEmail,
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

    return NextResponse.json({ booking: bookings[index] })
}

export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
        return NextResponse.json(
            { error: "Missing booking id" },
            { status: 400 }
        )
    }

    const bookings = await readBookings()
    const index = bookings.findIndex((b) => b.id === id)

    if (index === -1) {
        return NextResponse.json(
            { error: "Booking not found" },
            { status: 404 }
        )
    }

    if (bookings[index].status !== "pending") {
        return NextResponse.json(
            { error: "Only pending bookings can be deleted" },
            { status: 400 }
        )
    }

    bookings.splice(index, 1)
    await writeBookings(bookings)

    return NextResponse.json({ success: true })
}
