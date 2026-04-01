"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { format, parseISO, isAfter, isBefore, startOfDay, differenceInDays } from "date-fns"
import {
    DollarSign,
    Users,
    CalendarCheck,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    Home,
    ChevronRight,
    ChevronDown,
    Bed,
    Star,
    CircleDot,
    BookOpen,
    CheckCircle2,
    XCircle,
    Phone,
    Undo2,
} from "lucide-react"
import { toast } from "sonner"
import { AnimatePresence, motion } from "motion/react"
import { houses } from "@/lib/houses"

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
    status: "pending" | "confirmed" | "completed" | "cancelled"
    createdAt: string
}

const statusColors: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    confirmed: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    completed: "bg-green-500/10 text-green-600 dark:text-green-400",
    cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
}

const statusDots: Record<string, string> = {
    pending: "bg-amber-500",
    confirmed: "bg-blue-500",
    completed: "bg-green-500",
    cancelled: "bg-red-500",
}

export default function AdminDashboardPage() {
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [expandedRecent, setExpandedRecent] = useState<string | null>(null)
    const [expandedPending, setExpandedPending] = useState<string | null>(null)

    const today = startOfDay(new Date())

    const fetchBookings = () => {
        fetch("/api/bookings")
            .then((res) => res.json())
            .then((data) => setBookings(data.bookings || []))
            .catch(() => { })
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        fetchBookings()
    }, [])

    const handleReview = async (id: string, action: "confirmed" | "cancelled") => {
        setActionLoading(id)
        try {
            const res = await fetch("/api/bookings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status: action }),
            })
            if (res.ok) {
                const booking = bookings.find((b) => b.id === id)
                // Clear expanded states before updating bookings to avoid
                // setState-during-render conflicts with toast/Sonner
                setExpandedPending(null)
                setExpandedRecent(null)
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
        const completedCount = bookings.filter((b) => b.status === "completed").length

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
            completedCount,
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

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground mb-1">
                    Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                    Overview of your properties and bookings
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* Total Revenue */}
                <div className="bg-card rounded-2xl border border-border p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                            <ArrowUpRight className="h-3 w-3" />
                            All time
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">${stats.totalRevenue}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        ≈ {stats.totalRevenueRwf.toLocaleString()} RWF
                    </p>
                </div>

                {/* Total Bookings */}
                <div className="bg-card rounded-2xl border border-border p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <CalendarCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">
                            {stats.pendingCount} pending
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{stats.totalBookings}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Total bookings</p>
                </div>

                {/* Occupancy Rate */}
                <div className="bg-card rounded-2xl border border-border p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">
                            This month
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{stats.occupancyRate}%</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Occupancy rate</p>
                </div>

                {/* Average Stay */}
                <div className="bg-card rounded-2xl border border-border p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{stats.avgStay}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Avg. nights per stay</p>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Revenue Chart + House Performance */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Revenue Chart */}
                    <div className="bg-card rounded-2xl border border-border p-5 sm:p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-base font-semibold text-foreground">Revenue</h2>
                                <p className="text-xs text-muted-foreground">Last 6 months</p>
                            </div>
                        </div>
                        <div className="flex items-end gap-2 sm:gap-3 h-40">
                            {stats.monthlyRevenue.map((m) => (
                                <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                                    <span className="text-[10px] sm:text-xs font-medium text-muted-foreground">
                                        ${m.revenue}
                                    </span>
                                    <div className="w-full relative">
                                        <div
                                            className="w-full bg-foreground/10 rounded-t-lg transition-all duration-500 ease-out"
                                            style={{
                                                height: `${Math.max((m.revenue / maxRevenue) * 120, 4)}px`,
                                            }}
                                        >
                                            <div
                                                className="absolute inset-0 bg-foreground rounded-t-lg transition-all duration-500 ease-out"
                                                style={{
                                                    height: `${Math.max((m.revenue / maxRevenue) * 120, 4)}px`,
                                                    opacity: m.revenue > 0 ? 0.8 : 0.15,
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <span className="text-[10px] sm:text-xs text-muted-foreground">
                                        {m.month}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Property Performance */}
                    <div className="bg-card rounded-2xl border border-border p-5 sm:p-6">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-base font-semibold text-foreground">
                                    Property Performance
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    Revenue & bookings by property
                                </p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {houses.map((house) => {
                                const revenue = stats.revenueByHouse[house.slug] || 0
                                const bookingCount = stats.bookingsByHouse[house.slug] || 0
                                const totalRevAll = stats.totalRevenue || 1
                                const pct = Math.round((revenue / totalRevAll) * 100)

                                return (
                                    <div
                                        key={house.slug}
                                        className="flex items-center gap-4 p-4 rounded-xl bg-muted/40"
                                    >
                                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                                            <img
                                                src={house.heroImage}
                                                alt={house.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <h3 className="text-sm font-semibold text-foreground">
                                                    {house.name}
                                                </h3>
                                                <span className="text-sm font-bold text-foreground">
                                                    ${revenue}
                                                </span>
                                            </div>
                                            {/* Progress bar */}
                                            <div className="w-full h-1.5 bg-foreground/10 rounded-full overflow-hidden mb-1.5">
                                                <div
                                                    className="h-full bg-foreground/70 rounded-full transition-all duration-500"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                <span>{bookingCount} bookings</span>
                                                <span>·</span>
                                                <span>${house.pricePerNight}/night</span>
                                                <span>·</span>
                                                <span className="flex items-center gap-0.5">
                                                    <Star className="h-3 w-3 fill-current" />
                                                    {house.rating}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Right sidebar */}
                <div className="space-y-6">
                    {/* Booking Status Breakdown */}
                    <div className="bg-card rounded-2xl border border-border p-5">
                        <h2 className="text-base font-semibold text-foreground mb-4">
                            Booking Status
                        </h2>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                    <span className="text-sm text-foreground">Pending</span>
                                </div>
                                <span className="text-sm font-semibold text-foreground">
                                    {stats.pendingCount}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                    <span className="text-sm text-foreground">Confirmed</span>
                                </div>
                                <span className="text-sm font-semibold text-foreground">
                                    {stats.confirmedCount}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-600" />
                                    <span className="text-sm text-foreground">Completed</span>
                                </div>
                                <span className="text-sm font-semibold text-foreground">
                                    {stats.completedCount}
                                </span>
                            </div>
                        </div>

                        {/* Visual bar */}
                        {stats.totalBookings > 0 && (
                            <div className="mt-4 flex h-2 rounded-full overflow-hidden gap-0.5">
                                {stats.completedCount > 0 && (
                                    <div
                                        className="bg-green-600 rounded-full"
                                        style={{
                                            width: `${(stats.completedCount / stats.totalBookings) * 100}%`,
                                        }}
                                    />
                                )}
                                {stats.confirmedCount > 0 && (
                                    <div
                                        className="bg-blue-500 rounded-full"
                                        style={{
                                            width: `${(stats.confirmedCount / stats.totalBookings) * 100}%`,
                                        }}
                                    />
                                )}
                                {stats.pendingCount > 0 && (
                                    <div
                                        className="bg-amber-500 rounded-full"
                                        style={{
                                            width: `${(stats.pendingCount / stats.totalBookings) * 100}%`,
                                        }}
                                    />
                                )}
                            </div>
                        )}
                    </div>

                    {/* Pending Review */}
                    {stats.pendingCount > 0 && (
                        <div className="bg-card rounded-2xl border border-border p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                    <h2 className="text-base font-semibold text-foreground">
                                        Pending Review
                                    </h2>
                                </div>
                                <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                    {stats.pendingCount} awaiting
                                </span>
                            </div>
                            <div className="space-y-2">
                                {bookings
                                    .filter((b) => b.status === "pending")
                                    .map((b) => {
                                        const isPendingExpanded = expandedPending === b.id
                                        return (
                                            <div key={b.id} className="rounded-xl overflow-hidden bg-amber-500/5 border border-amber-500/10">
                                                <button
                                                    onClick={() => setExpandedPending(isPendingExpanded ? null : b.id)}
                                                    className="w-full flex items-center gap-3 p-3 hover:bg-amber-500/10 transition-colors text-left"
                                                >
                                                    <div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                                                        <span className="text-xs font-semibold text-foreground">
                                                            {b.guestName
                                                                .split(" ")
                                                                .map((n) => n[0])
                                                                .join("")
                                                                .slice(0, 2)}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-foreground truncate">
                                                            {b.guestName}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {b.houseName} ·{" "}
                                                            {format(parseISO(b.checkIn), "MMM d")} →{" "}
                                                            {format(parseISO(b.checkOut), "MMM d")}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <p className="text-sm font-semibold text-foreground">
                                                            ${b.total}
                                                        </p>
                                                        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-300 ${isPendingExpanded ? "rotate-180" : ""}`} />
                                                    </div>
                                                </button>
                                                <AnimatePresence initial={false}>
                                                    {isPendingExpanded && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="px-3 pb-3 pt-1 space-y-2.5">
                                                                <div className="p-3 rounded-lg bg-muted/40 space-y-1.5 text-xs">
                                                                    <div className="flex justify-between">
                                                                        <span className="text-muted-foreground">Phone</span>
                                                                        <span className="text-foreground flex items-center gap-1">
                                                                            <Phone className="h-3 w-3" />
                                                                            {b.guestPhone}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-muted-foreground">Guests</span>
                                                                        <span className="text-foreground">{b.guests}</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-muted-foreground">Nights</span>
                                                                        <span className="text-foreground">{b.nights} night{b.nights > 1 ? "s" : ""}</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-muted-foreground">Total</span>
                                                                        <span className="text-foreground font-semibold">${b.total} · {b.totalRwf.toLocaleString()} RWF</span>
                                                                    </div>
                                                                    {b.momoTransactionId && (
                                                                        <div className="flex justify-between">
                                                                            <span className="text-muted-foreground">MoMo</span>
                                                                            <span className="text-foreground font-mono">{b.momoTransactionId}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-wrap items-center gap-1.5">
                                                                    <span className="text-[10px] font-medium text-muted-foreground mr-1">Action:</span>
                                                                    <button
                                                                        onClick={() => handleReview(b.id, "confirmed")}
                                                                        disabled={actionLoading === b.id}
                                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                                                                    >
                                                                        <CheckCircle2 className="h-3 w-3" />
                                                                        Accept
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleReview(b.id, "cancelled")}
                                                                        disabled={actionLoading === b.id}
                                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                                                    >
                                                                        <XCircle className="h-3 w-3" />
                                                                        Reject
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        )
                                    })}
                            </div>
                        </div>
                    )}

                    {/* Currently Hosting */}
                    {stats.currentlyHosting.length > 0 && (
                        <div className="bg-card rounded-2xl border border-border p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <h2 className="text-base font-semibold text-foreground">
                                    Currently Hosting
                                </h2>
                            </div>
                            <div className="space-y-3">
                                {stats.currentlyHosting.map((b) => (
                                    <div
                                        key={b.id}
                                        className="p-3 rounded-xl bg-green-500/5 border border-green-500/10"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium text-foreground">
                                                {b.guestName}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {b.houseName}
                                            </span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Checks out{" "}
                                            {format(parseISO(b.checkOut), "MMM d")}
                                            {" · "}
                                            {b.guests} guest{b.guests > 1 ? "s" : ""}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recent Bookings */}
                    <div className="bg-card rounded-2xl border border-border p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-semibold text-foreground">
                                Recent Bookings
                            </h2>
                            <Link
                                href="/admin/bookings"
                                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                            >
                                View all
                                <ChevronRight className="h-3 w-3" />
                            </Link>
                        </div>
                        <div className="space-y-2">
                            {bookings.slice(0, 5).map((booking) => {
                                const isExpanded = expandedRecent === booking.id
                                return (
                                    <div key={booking.id} className="rounded-xl overflow-hidden">
                                        <button
                                            onClick={() => setExpandedRecent(isExpanded ? null : booking.id)}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left"
                                        >
                                            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                                                <span className="text-xs font-semibold text-foreground">
                                                    {booking.guestName
                                                        .split(" ")
                                                        .map((n) => n[0])
                                                        .join("")
                                                        .slice(0, 2)}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">
                                                    {booking.guestName}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {booking.houseName} ·{" "}
                                                    {format(parseISO(booking.checkIn), "MMM d")} →{" "}
                                                    {format(parseISO(booking.checkOut), "MMM d")}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-foreground">
                                                        ${booking.total}
                                                    </p>
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium ${statusColors[booking.status]}`}
                                                    >
                                                        <span className={`w-1.5 h-1.5 rounded-full ${statusDots[booking.status]}`} />
                                                        {booking.status}
                                                    </span>
                                                </div>
                                                <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
                                            </div>
                                        </button>
                                        <AnimatePresence initial={false}>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="px-3 pb-3 pt-1 space-y-2.5">
                                                        <div className="p-3 rounded-lg bg-muted/40 space-y-1.5 text-xs">
                                                            <div className="flex justify-between">
                                                                <span className="text-muted-foreground">Phone</span>
                                                                <span className="text-foreground flex items-center gap-1">
                                                                    <Phone className="h-3 w-3" />
                                                                    {booking.guestPhone}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-muted-foreground">Guests</span>
                                                                <span className="text-foreground">{booking.guests}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-muted-foreground">Total</span>
                                                                <span className="text-foreground font-semibold">${booking.total} · {booking.totalRwf.toLocaleString()} RWF</span>
                                                            </div>
                                                            {booking.momoTransactionId && (
                                                                <div className="flex justify-between">
                                                                    <span className="text-muted-foreground">MoMo</span>
                                                                    <span className="text-foreground font-mono">{booking.momoTransactionId}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {/* Quick status change */}
                                                        <div className="flex flex-wrap items-center gap-1.5">
                                                            <span className="text-[10px] font-medium text-muted-foreground mr-1">Action:</span>
                                                            {booking.status === "confirmed" && (
                                                                <button
                                                                    onClick={() => handleReview(booking.id, "cancelled")}
                                                                    disabled={actionLoading === booking.id}
                                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                                                >
                                                                    <Undo2 className="h-3 w-3" />
                                                                    Undo Accept
                                                                </button>
                                                            )}
                                                            {booking.status === "cancelled" && (
                                                                <button
                                                                    onClick={() => handleReview(booking.id, "confirmed")}
                                                                    disabled={actionLoading === booking.id}
                                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                                                                >
                                                                    <Undo2 className="h-3 w-3" />
                                                                    Undo Reject
                                                                </button>
                                                            )}
                                                            {booking.status === "pending" && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleReview(booking.id, "confirmed")}
                                                                        disabled={actionLoading === booking.id}
                                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                                                                    >
                                                                        <CheckCircle2 className="h-3 w-3" />
                                                                        Accept
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleReview(booking.id, "cancelled")}
                                                                        disabled={actionLoading === booking.id}
                                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                                                    >
                                                                        <XCircle className="h-3 w-3" />
                                                                        Reject
                                                                    </button>
                                                                </>
                                                            )}
                                                            {booking.status === "completed" && (
                                                                <span className="text-[11px] text-muted-foreground">No actions available</span>
                                                            )}
                                                            <Link
                                                                href="/admin/bookings"
                                                                className="ml-auto text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                                                            >
                                                                Full details →
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-card rounded-2xl border border-border p-5">
                        <h2 className="text-base font-semibold text-foreground mb-4">
                            Quick Actions
                        </h2>
                        <div className="space-y-2">
                            <Link
                                href="/admin/calendar"
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                            >
                                <div className="w-9 h-9 rounded-lg bg-foreground/5 flex items-center justify-center">
                                    <CalendarCheck className="h-4 w-4 text-foreground/60" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-foreground">
                                        Manage Calendar
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Block or unblock dates
                                    </p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                            </Link>
                            <Link
                                href="/admin/bookings"
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                            >
                                <div className="w-9 h-9 rounded-lg bg-foreground/5 flex items-center justify-center">
                                    <BookOpen className="h-4 w-4 text-foreground/60" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-foreground">
                                        All Bookings
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        View & manage bookings
                                    </p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
