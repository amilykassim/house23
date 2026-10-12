import { NextRequest, NextResponse } from "next/server"
import { addMonths, format, parseISO } from "date-fns"
import { listBookings, sumExpenses } from "@/lib/store"
import { houses } from "@/lib/houses"
import { periodFor, summarizeEarnings, type EarningsBooking } from "@/lib/earnings"
import { hasHookKey, hookNoDatabase, hookNotFound } from "@/lib/hook-auth"

export const dynamic = "force-dynamic"

// The month's figures for Pennywise's Home: revenue and booked nights the way
// the Insights page counts them (a confirmed booking's total spread evenly
// over its nights, so a stay crossing a month boundary is split between the
// months), and every house's expenses dated in the month.

export async function GET(request: NextRequest) {
    if (!hasHookKey(request)) return hookNotFound()
    if (!process.env.DATABASE_URL) return hookNoDatabase()

    const month = new URL(request.url).searchParams.get("month") ?? ""
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
        return NextResponse.json({ ok: false, error: "The month must be given as YYYY-MM" }, { status: 400 })
    }
    const first = parseISO(`${month}-01`)
    const next = format(addMonths(first, 1), "yyyy-MM-dd")

    try {
        const [bookings, expenses] = await Promise.all([
            listBookings({ status: "confirmed" }),
            sumExpenses(`${month}-01`, next),
        ])
        const summary = summarizeEarnings(bookings as EarningsBooking[], periodFor("month", first), houses.map((h) => h.slug))
        return NextResponse.json({
            month,
            revenue: Math.round(summary.total),
            units: summary.nights,
            unitLabel: "nights",
            expenses,
        })
    } catch (error) {
        console.error("[hooks/summary GET]", error)
        return NextResponse.json({ ok: false, error: "The summary could not be read" }, { status: 500 })
    }
}
