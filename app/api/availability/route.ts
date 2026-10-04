import { NextRequest, NextResponse } from "next/server"
import { getUnavailableDates } from "@/lib/airbnb-ical"

export const dynamic = "force-dynamic"

/**
 * Every night that cannot be booked for a house (admin blocks, confirmed
 * bookings and the Airbnb calendar) in one call, for the guest-facing date
 * pickers.
 *
 * The CDN keeps each house's answer for a minute, so all visitors share one
 * storage read and one Airbnb download instead of triggering their own.
 * Bookings are still checked against live availability when submitted.
 */
export async function GET(request: NextRequest) {
    const house = new URL(request.url).searchParams.get("house")
    if (!house) {
        return NextResponse.json({ error: "Missing 'house' query parameter" }, { status: 400 })
    }

    const dates = Array.from(await getUnavailableDates(house)).sort()
    return NextResponse.json(
        { dates },
        { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
    )
}
