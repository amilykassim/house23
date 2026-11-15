"use client"

import { Suspense, useEffect, useState } from "react"
import { EarningsInsights } from "@/components/earnings-insights"
import type { EarningsBooking } from "@/lib/earnings"
import type { Expense } from "@/lib/expenses"
import { loadBookings, loadExpenses } from "@/lib/admin-data"
import { Skeleton } from "@/components/admin-motion"

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
            <div aria-label="Loading the earnings" className="[zoom:0.88] px-4 pt-7 sm:pt-10 pb-14 max-w-[1072px] mx-auto flex flex-col gap-6">
                <Skeleton className="h-10 w-48 rounded-xl" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                    <Skeleton className="h-[118px] rounded-[20px]" />
                    <Skeleton className="h-[118px] rounded-[20px]" />
                    <Skeleton className="col-span-2 sm:col-span-1 h-[118px] rounded-[20px]" />
                </div>
                <Skeleton className="h-[260px] rounded-[20px]" />
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
