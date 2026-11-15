"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { format, parseISO, isAfter, startOfDay } from "date-fns"
import { ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { houses } from "@/lib/houses"
import { usePrices } from "@/lib/use-prices"
import { type RejectionReason } from "@/lib/rejection-reasons"
import { forgetBookings, loadBookings } from "@/lib/admin-data"
import { houseColor } from "@/components/earnings-insights"
import { BUTTON_DARK, BUTTON_OUTLINE, ConfirmPanel, Fold, RejectPanel, StatusPill } from "@/components/admin-booking-review"

interface Booking {
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

const SECTION_TITLE = "text-[22px] font-bold tracking-[-0.02em] leading-tight text-foreground"
const TILE = "min-w-0 rounded-[20px] p-5 flex flex-col gap-1.5"
const CARD = "rounded-[20px] border border-border bg-card p-5 sm:p-6 flex flex-col gap-4"
const CARD_TITLE = "text-[17px] font-bold tracking-[-0.01em] text-foreground"

export default function AdminDashboardPage() {
    const [bookings, setBookings] = useState<Booking[]>([])
    const prices = usePrices()
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [expandedRecent, setExpandedRecent] = useState<string | null>(null)
    // "pending:<id>" or "recent:<id>": a booking can show in both lists, and
    // only the one whose Reject was pressed opens its panel
    const [rejectingBooking, setRejectingBooking] = useState<string | null>(null)
    const [confirmingBooking, setConfirmingBooking] = useState<string | null>(null)
    const [selectedReason, setSelectedReason] = useState<RejectionReason>("dates_unavailable")

    const today = startOfDay(new Date())

    const fetchBookings = () => {
        loadBookings<Booking>()
            .then(setBookings)
            .catch(() => { })
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        fetchBookings()
    }, [])

    const handleReview = async (id: string, action: "confirmed" | "cancelled", rejectionReason?: RejectionReason) => {
        setActionLoading(id)
        try {
            const res = await fetch("/api/bookings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status: action, ...(rejectionReason ? { rejectionReason } : {}) }),
            })
            if (res.ok) {
                forgetBookings()
                const booking = bookings.find((b) => b.id === id)
                // Clear expanded states before updating bookings to avoid
                // setState-during-render conflicts with toast/Sonner
                setExpandedRecent(null)
                setRejectingBooking(null)
                setBookings((prev) =>
                    prev.map((b) => (b.id === id ? { ...b, status: action } : b))
                )
                setTimeout(() => {
                    if (action === "confirmed") {
                        toast("Booking Confirmed!", {
                            icon: "🎉",
                            description: `${booking?.guestName} \u00b7 ${booking?.checkIn} \u2192 ${booking?.checkOut}\n\ud83d\udcc5 Dates blocked on the calendar`,
                            duration: 5000,
                            unstyled: true,
                            classNames: {
                                toast: "w-full flex items-start gap-3 bg-green-500/10 border border-green-200/60 dark:border-green-500/20 rounded-xl p-4 shadow-lg backdrop-blur-sm",
                                icon: "text-2xl mt-0.5 shrink-0",
                                title: "font-semibold text-green-800 dark:text-green-200 text-sm",
                                description: "text-xs text-green-700/70 dark:text-green-300/70 mt-0.5 whitespace-pre-line",
                            },
                        })
                    } else {
                        toast("Booking Rejected", {
                            icon: "🚫",
                            description: `${booking?.guestName}'s request has been declined`,
                            duration: 4000,
                            unstyled: true,
                            classNames: {
                                toast: "w-full flex items-start gap-3 bg-red-500/10 border border-red-200/60 dark:border-red-500/20 rounded-xl p-4 shadow-lg backdrop-blur-sm",
                                icon: "text-2xl mt-0.5 shrink-0",
                                title: "font-semibold text-red-800 dark:text-red-200 text-sm",
                                description: "text-xs text-red-700/70 dark:text-red-300/70 mt-0.5",
                            },
                        })
                    }
                }, 0)
            }
        } catch {
            setTimeout(() => toast("Something went wrong", {
                icon: "⚠️",
                description: "Failed to update booking",
                duration: 4000,
                unstyled: true,
                classNames: {
                    toast: "w-full flex items-start gap-3 bg-red-500/10 border border-red-200/60 dark:border-red-500/20 rounded-xl p-4 shadow-lg backdrop-blur-sm",
                    icon: "text-2xl mt-0.5 shrink-0",
                    title: "font-semibold text-red-800 dark:text-red-200 text-sm",
                    description: "text-xs text-red-700/70 dark:text-red-300/70 mt-0.5",
                },
            }), 0)
        }
        finally {
            setActionLoading(null)
        }
    }

    // Calculate statistics
    const stats = useMemo(() => {
        const activeBookings = bookings.filter((b) => b.status !== "cancelled")
        const totalRevenue = activeBookings.reduce((sum, b) => sum + b.total, 0)
        const totalRevenueRwf = activeBookings.reduce((sum, b) => sum + b.totalRwf, 0)
        const totalNights = activeBookings.reduce((sum, b) => sum + b.nights, 0)
        const avgStay = activeBookings.length > 0 ? totalNights / activeBookings.length : 0
        const totalGuests = activeBookings.reduce((sum, b) => sum + b.guests, 0)
        const pendingCount = bookings.filter((b) => b.status === "pending").length
        const confirmedCount = bookings.filter((b) => b.status === "confirmed").length
        const cancelledCount = bookings.filter((b) => b.status === "cancelled").length
        const totalBookingsAll = bookings.length

        // Upcoming bookings (check-in is in the future)
        const upcoming = activeBookings.filter((b) =>
            isAfter(parseISO(b.checkIn), today) || format(today, "yyyy-MM-dd") === b.checkIn
        )

        // Currently hosting (check-in <= today <= check-out)
        const currentlyHosting = activeBookings.filter(
            (b) =>
                !isAfter(parseISO(b.checkIn), today) &&
                isAfter(parseISO(b.checkOut), today)
        )

        // Revenue by house
        const revenueByHouse: Record<string, number> = {}
        const bookingsByHouse: Record<string, number> = {}
        activeBookings.forEach((b) => {
            revenueByHouse[b.house] = (revenueByHouse[b.house] || 0) + b.total
            bookingsByHouse[b.house] = (bookingsByHouse[b.house] || 0) + 1
        })

        // Monthly revenue (last 6 months)
        const monthlyRevenue: { month: string; revenue: number; bookings: number }[] = []
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today)
            d.setMonth(d.getMonth() - i)
            const monthKey = format(d, "yyyy-MM")
            const monthLabel = format(d, "MMM")
            const monthBookings = activeBookings.filter(
                (b) => b.createdAt.startsWith(monthKey)
            )
            monthlyRevenue.push({
                month: monthLabel,
                revenue: monthBookings.reduce((sum, b) => sum + b.total, 0),
                bookings: monthBookings.length,
            })
        }

        // Occupancy rate (days booked out of days in current month)
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
        const uniqueBookedDays = new Set<string>()
        activeBookings.forEach((b) => {
            const start = parseISO(b.checkIn)
            const end = parseISO(b.checkOut)
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
            const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)

            let current = new Date(Math.max(start.getTime(), monthStart.getTime()))
            const limit = new Date(Math.min(end.getTime(), monthEnd.getTime()))

            while (current <= limit) {
                uniqueBookedDays.add(format(current, "yyyy-MM-dd"))
                current.setDate(current.getDate() + 1)
            }
        })
        // Occupancy per property (2 houses)
        const occupancyRate = Math.round(
            (uniqueBookedDays.size / (daysInMonth * houses.length)) * 100
        )

        return {
            totalRevenue,
            totalRevenueRwf,
            totalBookings: activeBookings.length,
            avgStay: Math.round(avgStay * 10) / 10,
            totalGuests,
            pendingCount,
            confirmedCount,
            cancelledCount,
            totalBookingsAll,
            upcoming,
            currentlyHosting,
            revenueByHouse,
            bookingsByHouse,
            monthlyRevenue,
            occupancyRate,
        }
    }, [bookings, today])

    const maxRevenue = Math.max(...stats.monthlyRevenue.map((m) => m.revenue), 1)

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
            </div>
        )
    }
    const pending = bookings.filter((b) => b.status === "pending")
    const stay = (b: Booking) => `${format(parseISO(b.checkIn), "MMM d")} → ${format(parseISO(b.checkOut), "MMM d")}`
    const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`

    return (
        // zoom scales the whole page down a notch on every screen size
        <div className="[zoom:0.88] px-4 pt-7 sm:pt-12 pb-14 max-w-[1120px] mx-auto flex flex-col gap-6 sm:gap-7">
            <h1 className="text-[28px] sm:text-[34px] leading-tight font-bold tracking-[-0.02em] text-foreground">Dashboard</h1>

            {/* At a glance */}
            <section aria-label="At a glance" className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className={`${TILE} bg-foreground text-background`}>
                    <span className="text-[13px] font-semibold text-background/75">Revenue, all time</span>
                    <span className="text-[26px] leading-tight font-bold tracking-[-0.02em]">${stats.totalRevenue.toLocaleString("en-US")}</span>
                    <span className="text-[13px] text-background/75">≈ {stats.totalRevenueRwf.toLocaleString("en-US")} RWF</span>
                </div>
                <div className={`${TILE} bg-[#F7F7F7]`}>
                    <span className="text-[13px] font-semibold text-muted-foreground">Bookings</span>
                    <span className="text-[26px] leading-tight font-bold tracking-[-0.02em] text-foreground">{stats.totalBookings}</span>
                    <span className="text-[13px] text-muted-foreground">
                        {stats.pendingCount > 0 ? `${stats.pendingCount} waiting for review` : "none waiting for review"}
                    </span>
                </div>
                <div className={`${TILE} bg-[#F7F7F7]`}>
                    <span className="text-[13px] font-semibold text-muted-foreground">Occupancy</span>
                    <span className="text-[26px] leading-tight font-bold tracking-[-0.02em] text-foreground">{stats.occupancyRate}%</span>
                    <span className="text-[13px] text-muted-foreground">this month</span>
                </div>
                <div className={`${TILE} bg-[#F7F7F7]`}>
                    <span className="text-[13px] font-semibold text-muted-foreground">Average stay</span>
                    <span className="text-[26px] leading-tight font-bold tracking-[-0.02em] text-foreground">{plural(stats.avgStay, "night")}</span>
                    <span className="text-[13px] text-muted-foreground">per booking</span>
                </div>
            </section>

            {/* Pending review: the one thing here that needs a decision */}
            {pending.length > 0 && (
                <section aria-labelledby="pending-review" className="flex flex-col gap-3.5">
                    <div className="flex items-baseline gap-3">
                        <h2 id="pending-review" className={SECTION_TITLE}>
                            Pending review
                        </h2>
                        <span className="text-sm text-muted-foreground">{stats.pendingCount} awaiting</span>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
                        {pending.map((b) => {
                            const key = `pending:${b.id}`
                            const busy = actionLoading === b.id
                            return (
                                <div key={b.id} className="min-w-0 rounded-2xl border border-[#B0B0B0] bg-card p-5 flex flex-col gap-4">
                                    <div className="flex justify-between gap-4">
                                        <div className="min-w-0 flex flex-col gap-0.5">
                                            <span className="text-[17px] font-bold text-foreground [overflow-wrap:anywhere]">{b.guestName}</span>
                                            <span className="text-sm text-muted-foreground">
                                                {b.houseName} · {stay(b)} · {plural(b.nights, "night")}
                                            </span>
                                        </div>
                                        <div className="shrink-0 flex flex-col items-end gap-0.5">
                                            <span className="text-[17px] font-bold text-foreground">${b.total}</span>
                                            <span className="text-[13px] text-muted-foreground whitespace-nowrap">{b.totalRwf.toLocaleString()} RWF</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                                        {b.guestPhone && <span>{b.guestPhone}</span>}
                                        <span>{plural(b.guests, "guest")}</span>
                                        {b.momoTransactionId && <span className="[overflow-wrap:anywhere]">MoMo {b.momoTransactionId}</span>}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleReview(b.id, "confirmed")}
                                            disabled={busy}
                                            className={`${BUTTON_DARK} flex-1`}
                                        >
                                            Accept
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setRejectingBooking(rejectingBooking === key ? null : key)
                                                setSelectedReason("dates_unavailable")
                                            }}
                                            disabled={busy}
                                            aria-expanded={rejectingBooking === key}
                                            className={`${BUTTON_OUTLINE} flex-1`}
                                        >
                                            Reject
                                        </button>
                                    </div>
                                    <Fold open={rejectingBooking === key}>
                                        <RejectPanel
                                            selected={selectedReason}
                                            onSelect={setSelectedReason}
                                            onConfirm={() => handleReview(b.id, "cancelled", selectedReason)}
                                            onCancel={() => setRejectingBooking(null)}
                                            busy={busy}
                                        />
                                    </Fold>
                                </div>
                            )
                        })}
                    </div>
                </section>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="min-w-0 lg:col-span-2 flex flex-col gap-6">
                    {/* Revenue, last 6 months */}
                    <section aria-labelledby="revenue" className={CARD}>
                        <div className="flex items-baseline justify-between gap-3">
                            <h2 id="revenue" className={CARD_TITLE}>
                                Revenue
                            </h2>
                            <span className="text-[13px] text-muted-foreground">Last 6 months</span>
                        </div>
                        <div className="grid grid-cols-6 gap-2 sm:gap-3 items-end">
                            {stats.monthlyRevenue.map((m, i) => {
                                const current = i === stats.monthlyRevenue.length - 1
                                return (
                                    <div key={m.month} className="min-w-0 flex flex-col items-center gap-1.5">
                                        <span className="text-xs font-semibold text-muted-foreground truncate max-w-full">${m.revenue}</span>
                                        <div
                                            className={`w-full rounded-t-lg ${current ? "bg-foreground" : "bg-[#D4D4D4]"}`}
                                            style={{ height: `${Math.max((m.revenue / maxRevenue) * 120, 4)}px` }}
                                        />
                                        <span className={`text-[13px] text-foreground ${current ? "font-bold" : "font-medium"}`}>{m.month}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </section>

                    {/* Revenue and bookings by house */}
                    <section aria-labelledby="by-house" className={CARD}>
                        <h2 id="by-house" className={CARD_TITLE}>
                            By house
                        </h2>
                        {houses.map((house) => {
                            const revenue = stats.revenueByHouse[house.slug] || 0
                            const bookingCount = stats.bookingsByHouse[house.slug] || 0
                            const pct = Math.round((revenue / (stats.totalRevenue || 1)) * 100)
                            return (
                                <div key={house.slug} className="flex flex-col gap-2">
                                    <div className="flex justify-between items-center gap-3 text-[15px] text-foreground">
                                        <span className="flex items-center gap-2 font-semibold">
                                            <span aria-hidden="true" className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: houseColor(house.slug) }} />
                                            {house.name}
                                        </span>
                                        <span>
                                            <span className="font-semibold">${revenue}</span>
                                            <span className="text-muted-foreground"> · {pct}%</span>
                                        </span>
                                    </div>
                                    <div className="h-2 rounded-full bg-[#EBEBEB] overflow-hidden">
                                        <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: houseColor(house.slug) }} />
                                    </div>
                                    <span className="text-[13px] text-muted-foreground">
                                        {plural(bookingCount, "booking")} · ${prices?.[house.slug]?.pricePerNight ?? house.pricePerNight} a night
                                    </span>
                                </div>
                            )
                        })}
                    </section>
                </div>

                <div className="min-w-0 flex flex-col gap-6">
                    {stats.currentlyHosting.length > 0 && (
                        <section aria-labelledby="hosting" className={CARD}>
                            <h2 id="hosting" className={CARD_TITLE}>
                                Currently hosting
                            </h2>
                            {stats.currentlyHosting.map((b) => (
                                <div key={b.id} className="px-4 py-3.5 rounded-xl bg-[#F7F7F7] flex flex-col gap-0.5">
                                    <div className="flex justify-between gap-3 text-[15px]">
                                        <span className="min-w-0 font-semibold text-foreground [overflow-wrap:anywhere]">{b.guestName}</span>
                                        <span className="shrink-0 text-muted-foreground">{b.houseName}</span>
                                    </div>
                                    <span className="text-[13px] text-muted-foreground">
                                        Checks out {format(parseISO(b.checkOut), "MMM d")} · {plural(b.guests, "guest")}
                                    </span>
                                </div>
                            ))}
                        </section>
                    )}

                    <section aria-labelledby="booking-status" className={CARD}>
                        <h2 id="booking-status" className={CARD_TITLE}>
                            Booking status
                        </h2>
                        {stats.totalBookingsAll > 0 && (
                            <div className="flex h-2 gap-0.5" aria-hidden="true">
                                {stats.confirmedCount > 0 && <div className="rounded-full bg-[#1E40AF]" style={{ flexGrow: stats.confirmedCount }} />}
                                {stats.pendingCount > 0 && <div className="rounded-full bg-[#D97706]" style={{ flexGrow: stats.pendingCount }} />}
                                {stats.cancelledCount > 0 && <div className="rounded-full bg-[#B0B0B0]" style={{ flexGrow: stats.cancelledCount }} />}
                            </div>
                        )}
                        {(
                            [
                                ["Confirmed", stats.confirmedCount, "bg-[#1E40AF]"],
                                ["Pending", stats.pendingCount, "bg-[#D97706]"],
                                ["Cancelled", stats.cancelledCount, "bg-[#B0B0B0]"],
                            ] as const
                        ).map(([label, count, dot]) => (
                            <div key={label} className="flex justify-between text-[15px] text-foreground">
                                <span className="flex items-center gap-2">
                                    <span aria-hidden="true" className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                                    {label}
                                </span>
                                <span className="font-semibold">{count}</span>
                            </div>
                        ))}
                    </section>
                </div>
            </div>

            {/* The five newest bookings */}
            <section aria-labelledby="recent" className="flex flex-col">
                <div className="flex items-baseline justify-between gap-3 mb-2">
                    <h2 id="recent" className={SECTION_TITLE}>
                        Recent bookings
                    </h2>
                    <Link href="/admin/bookings" className="min-h-11 flex items-center text-sm font-semibold text-foreground underline underline-offset-4">
                        View all
                    </Link>
                </div>
                {bookings.slice(0, 5).map((booking) => {
                    const isExpanded = expandedRecent === booking.id
                    const key = `recent:${booking.id}`
                    const busy = actionLoading === booking.id
                    return (
                        <div key={booking.id} className="border-b border-[#EBEBEB] last:border-b-0">
                            <button
                                type="button"
                                onClick={() => setExpandedRecent(isExpanded ? null : booking.id)}
                                aria-expanded={isExpanded}
                                className="w-full py-3.5 flex items-center gap-3 sm:gap-4 text-left"
                            >
                                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                    <span className="text-base font-semibold text-foreground truncate">{booking.guestName}</span>
                                    <span className="text-[13px] text-muted-foreground">
                                        {booking.houseName} · {stay(booking)}
                                    </span>
                                </div>
                                <StatusPill status={booking.status} />
                                <span className="w-14 text-right text-base font-semibold text-foreground">${booking.total}</span>
                                <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
                            </button>
                            <Fold open={isExpanded}>
                                <div className="pb-4 flex flex-col gap-3">
                                    <div className="p-4 rounded-xl bg-[#F7F7F7] flex flex-col gap-1.5 text-sm">
                                        <div className="flex justify-between gap-3">
                                            <span className="text-muted-foreground">Phone</span>
                                            <span className="text-foreground text-right">{booking.guestPhone}</span>
                                        </div>
                                        <div className="flex justify-between gap-3">
                                            <span className="text-muted-foreground">Guests</span>
                                            <span className="text-foreground">{booking.guests}</span>
                                        </div>
                                        <div className="flex justify-between gap-3">
                                            <span className="text-muted-foreground">Total</span>
                                            <span className="text-foreground font-semibold text-right">
                                                ${booking.total} · {booking.totalRwf.toLocaleString()} RWF
                                            </span>
                                        </div>
                                        {booking.momoTransactionId && (
                                            <div className="flex justify-between gap-3">
                                                <span className="text-muted-foreground">MoMo</span>
                                                <span className="text-foreground font-mono text-right [overflow-wrap:anywhere]">{booking.momoTransactionId}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {isAfter(new Date(), parseISO(booking.checkOut)) ? (
                                            <span className="text-sm text-muted-foreground">Check-out passed — no actions</span>
                                        ) : (
                                            <>
                                                {booking.status === "confirmed" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setConfirmingBooking(null)
                                                            setRejectingBooking(rejectingBooking === key ? null : key)
                                                            setSelectedReason("dates_unavailable")
                                                        }}
                                                        disabled={busy}
                                                        className={BUTTON_OUTLINE}
                                                    >
                                                        Undo Accept
                                                    </button>
                                                )}
                                                {booking.status === "cancelled" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setRejectingBooking(null)
                                                            setConfirmingBooking(confirmingBooking === booking.id ? null : booking.id)
                                                        }}
                                                        disabled={busy}
                                                        className={BUTTON_OUTLINE}
                                                    >
                                                        Undo Reject
                                                    </button>
                                                )}
                                                {booking.status === "pending" && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleReview(booking.id, "confirmed")}
                                                            disabled={busy}
                                                            className={BUTTON_DARK}
                                                        >
                                                            Accept
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setConfirmingBooking(null)
                                                                setRejectingBooking(rejectingBooking === key ? null : key)
                                                                setSelectedReason("dates_unavailable")
                                                            }}
                                                            disabled={busy}
                                                            className={BUTTON_OUTLINE}
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                            </>
                                        )}
                                        <Link
                                            href="/admin/bookings"
                                            className="ml-auto min-h-11 flex items-center text-sm font-semibold text-foreground underline underline-offset-4"
                                        >
                                            Full details
                                        </Link>
                                    </div>
                                    <Fold open={confirmingBooking === booking.id}>
                                        <ConfirmPanel
                                            booking={booking}
                                            onConfirm={() => {
                                                setConfirmingBooking(null)
                                                handleReview(booking.id, "confirmed")
                                            }}
                                            onCancel={() => setConfirmingBooking(null)}
                                            busy={busy}
                                        />
                                    </Fold>
                                    <Fold open={rejectingBooking === key}>
                                        <RejectPanel
                                            booking={booking.status === "confirmed" ? booking : undefined}
                                            selected={selectedReason}
                                            onSelect={setSelectedReason}
                                            onConfirm={() => handleReview(booking.id, "cancelled", selectedReason)}
                                            onCancel={() => setRejectingBooking(null)}
                                            busy={busy}
                                        />
                                    </Fold>
                                </div>
                            </Fold>
                        </div>
                    )
                })}
            </section>
        </div>
    )
}
