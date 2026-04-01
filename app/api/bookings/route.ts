import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const DATA_FILE = path.join(process.cwd(), "data", "bookings.json")
const BLOCKED_DATES_FILE = path.join(process.cwd(), "data", "blocked-dates.json")

export interface Booking {
    id: string
    house: string
    houseName: string
    guestName: string
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
    status: "pending" | "confirmed" | "completed" | "cancelled"
    createdAt: string
}

function readBookings(): Booking[] {
    try {
        const raw = fs.readFileSync(DATA_FILE, "utf-8")
        return JSON.parse(raw)
    } catch {
        return []
    }
}

function writeBookings(data: Booking[]) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

function readBlockedDates(): Record<string, string[]> {
    try {
        const raw = fs.readFileSync(BLOCKED_DATES_FILE, "utf-8")
        return JSON.parse(raw)
    } catch {
        return {}
    }
}

function writeBlockedDates(data: Record<string, string[]>) {
    fs.writeFileSync(BLOCKED_DATES_FILE, JSON.stringify(data, null, 2))
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

function blockDatesForBooking(house: string, checkIn: string, checkOut: string) {
    const blockedDates = readBlockedDates()
    const current = new Set(blockedDates[house] || [])
    const dates = getDatesBetween(checkIn, checkOut)
    dates.forEach((d) => current.add(d))
    blockedDates[house] = Array.from(current).sort()
    writeBlockedDates(blockedDates)
}

function unblockDatesForBooking(house: string, checkIn: string, checkOut: string) {
    const blockedDates = readBlockedDates()
    const current = new Set(blockedDates[house] || [])
    const dates = getDatesBetween(checkIn, checkOut)
    dates.forEach((d) => current.delete(d))
    blockedDates[house] = Array.from(current).sort()
    writeBlockedDates(blockedDates)
}

function generateId(): string {
    const bookings = readBookings()
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

    let bookings = readBookings()

    if (house) {
        bookings = bookings.filter((b) => b.house === house)
    }
    if (status) {
        bookings = bookings.filter((b) => b.status === status)
    }

    // Sort by createdAt descending
    bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({ bookings })
}

export async function POST(request: NextRequest) {
    const body = await request.json()
    const {
        house,
        houseName,
        guestName,
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

    const bookings = readBookings()
    const newBooking: Booking = {
        id: generateId(),
        house,
        houseName: houseName || house,
        guestName,
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
    writeBookings(bookings)

    return NextResponse.json({ booking: newBooking }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
    const body = await request.json()
    const { id, status } = body as { id: string; status: Booking["status"] }

    if (!id || !status) {
        return NextResponse.json(
            { error: "Missing id or status" },
            { status: 400 }
        )
    }

    const bookings = readBookings()
    const index = bookings.findIndex((b) => b.id === id)

    if (index === -1) {
        return NextResponse.json(
            { error: "Booking not found" },
            { status: 404 }
        )
    }

    const previousStatus = bookings[index].status
    bookings[index].status = status
    writeBookings(bookings)

    // Auto-block dates when confirming, unblock when moving away from confirmed
    const booking = bookings[index]
    if (status === "confirmed" && previousStatus !== "confirmed") {
        blockDatesForBooking(booking.house, booking.checkIn, booking.checkOut)
    } else if (status !== "confirmed" && previousStatus === "confirmed") {
        unblockDatesForBooking(booking.house, booking.checkIn, booking.checkOut)
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

    const bookings = readBookings()
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
    writeBookings(bookings)

    return NextResponse.json({ success: true })
}
