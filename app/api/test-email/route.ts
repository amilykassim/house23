// ⚠️ TEMPORARY: Admin-only endpoint for testing Resend delivery.
// Sends the real booking-confirmation template to an arbitrary address.
// Delete this file (and components/test-email-panel.tsx) when done testing.
import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { buildBookingConfirmationEmail, FROM_EMAIL, type BookingEmailData } from "@/lib/email"

export const dynamic = "force-dynamic"

const SAMPLE_BOOKING: BookingEmailData = {
    guestName: "Test Guest",
    guestEmail: "",
    guestPhone: "+250 788 123 4567",
    houseName: "House 23",
    checkIn: "2026-09-12",
    checkOut: "2026-09-15",
    nights: 3,
    guests: 2,
    total: 173,
    totalRwf: 249_120,
    momoTransactionId: "TEST-MOMO-000",
    specialRequests: "This is a test email — no real booking exists.",
    bookingId: "TEST-0000",
}

export async function POST(request: NextRequest) {
    const authCookie = request.cookies.get("admin_auth")
    if (!authCookie || authCookie.value !== "authenticated") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let email: unknown
    try {
        ({ email } = await request.json())
    } catch {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 })
    }

    if (!process.env.RESEND_API_KEY) {
        return NextResponse.json(
            { error: "RESEND_API_KEY is not set on the server" },
            { status: 500 },
        )
    }

    const to = email.trim()
    const { subject, html } = buildBookingConfirmationEmail({ ...SAMPLE_BOOKING, guestEmail: to })

    try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const { data, error } = await resend.emails.send({ from: FROM_EMAIL, to, subject, html })

        if (error) {
            // Resend reports API-level failures here rather than throwing
            return NextResponse.json(
                { error: `${error.name}: ${error.message}` },
                { status: 502 },
            )
        }

        return NextResponse.json({ success: true, id: data?.id, to, from: FROM_EMAIL })
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
