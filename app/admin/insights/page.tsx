"use client"

import { Suspense, useEffect, useState } from "react"
import { EarningsInsights } from "@/components/earnings-insights"
import type { EarningsBooking } from "@/lib/earnings"
import type { Expense } from "@/lib/expenses"
import { loadBookings, loadExpenses } from "@/lib/admin-data"

export default function AdminInsightsPage() {
    const [bookings, setBookings] = useState<EarningsBooking[]>([])
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            loadBookings<EarningsBooking>().catch(() => []),
            loadExpenses<Expense>().catch(() => []),
        ])
            .then(([bookings, expenses]) => {
                setBookings(bookings)
                setExpenses(expenses)
            })
            .finally(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
            </div>
        )
    }

    return (
        // zoom scales the whole page down a notch on every screen size
        <div className="[zoom:0.88] px-4 pt-7 sm:pt-10 pb-14 max-w-[1072px] mx-auto">
            {/* EarningsInsights reads its view from the URL */}
            <Suspense>
                <EarningsInsights bookings={bookings} expenses={expenses} />
            </Suspense>
        </div>
    )
}
