"use client"

import { useState, useEffect, useMemo } from "react"
import { format, parseISO, isAfter } from "date-fns"
import {
    Search,
    Filter,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Phone,
    Mail,
    MessageSquare,
    X,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    MoreHorizontal,
    ArrowUpDown,
} from "lucide-react"
import { toast } from "sonner"
import { houses } from "@/lib/houses"
import { AnimatePresence, motion } from "motion/react"
import { REJECTION_REASONS, type RejectionReason } from "@/lib/rejection-reasons"
import { broadcastCalendarRefresh } from "@/lib/calendar-events"

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

const statusConfig: Record<
    string,
    { label: string; color: string; bg: string; icon: React.ElementType }
> = {
    pending: {
        label: "Pending",
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-500/10",
        icon: Clock,
    },
    confirmed: {
        label: "Confirmed",
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-500/10",
        icon: CheckCircle2,
    },
    cancelled: {
        label: "Cancelled",
        color: "text-red-600 dark:text-red-400",
        bg: "bg-red-500/10",
        icon: XCircle,
    },
}

const allStatuses = ["all", "pending", "confirmed", "cancelled"] as const
const ITEMS_PER_PAGE = 10

export default function AdminBookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [houseFilter, setHouseFilter] = useState<string>("all")
    const [currentPage, setCurrentPage] = useState(1)
    const [expandedBooking, setExpandedBooking] = useState<string | null>(null)
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
    const [deletingBooking, setDeletingBooking] = useState<string | null>(null)
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
    const [rejectingBooking, setRejectingBooking] = useState<string | null>(null)
    const [confirmingBooking, setConfirmingBooking] = useState<string | null>(null)
    const [selectedReason, setSelectedReason] = useState<RejectionReason>("dates_unavailable")

    const fetchBookings = () => {
        setLoading(true)
        fetch("/api/bookings")
            .then((res) => res.json())
            .then((data) => setBookings(data.bookings || []))
            .catch(() => { })
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        fetchBookings()
    }, [])

    const handleStatusChange = async (id: string, newStatus: Booking["status"], rejectionReason?: RejectionReason) => {
        setUpdatingStatus(id)
        try {
            const res = await fetch("/api/bookings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status: newStatus, ...(rejectionReason ? { rejectionReason } : {}) }),
            })
            if (res.ok) {
                const booking = bookings.find((b) => b.id === id)
                setRejectingBooking(null)
                setBookings((prev) =>
                    prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
                )
                // Notify other tabs (booking card) to refresh their calendar
                broadcastCalendarRefresh(booking?.house)
                setTimeout(() => {
                    if (newStatus === "confirmed") {
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
                    } else if (newStatus === "cancelled") {
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
                    } else {
                        toast("Status Updated", {
                            icon: "✨",
                            description: `Changed to ${newStatus}`,
                            duration: 3000,
                            unstyled: true,
                            classNames: {
                                toast: "w-full flex items-start gap-3 bg-blue-500/10 border border-blue-200/60 dark:border-blue-500/20 rounded-xl p-4 shadow-lg backdrop-blur-sm",
                                icon: "text-2xl mt-0.5 shrink-0",
                                title: "font-semibold text-blue-800 dark:text-blue-200 text-sm",
                                description: "text-xs text-blue-700/70 dark:text-blue-300/70 mt-0.5",
                            },
                        })
                    }
                }, 0)
            }
        } catch {
            setTimeout(() => toast("Something went wrong", {
                icon: "⚠️",
                description: "Failed to update booking status",
                duration: 4000,
                unstyled: true,
                classNames: {
                    toast: "w-full flex items-start gap-3 bg-red-500/10 border border-red-200/60 dark:border-red-500/20 rounded-xl p-4 shadow-lg backdrop-blur-sm",
                    icon: "text-2xl mt-0.5 shrink-0",
                    title: "font-semibold text-red-800 dark:text-red-200 text-sm",
                    description: "text-xs text-red-700/70 dark:text-red-300/70 mt-0.5",
                },
            }), 0)
        } finally {
            setUpdatingStatus(null)
        }
    }

    const handleDelete = async (id: string) => {
        setDeletingBooking(id)
        try {
            const res = await fetch(`/api/bookings?id=${id}`, {
                method: "DELETE",
            })
            if (res.ok) {
                setBookings((prev) => prev.filter((b) => b.id !== id))
                setExpandedBooking(null)
                setConfirmDelete(null)
                setTimeout(() => toast("Booking Deleted", {
                    icon: "🗑️",
                    description: "Permanently removed from the system",
                    duration: 3000,
                    unstyled: true,
                    classNames: {
                        toast: "w-full flex items-start gap-3 bg-orange-500/10 border border-orange-200/60 dark:border-orange-500/20 rounded-xl p-4 shadow-lg backdrop-blur-sm",
                        icon: "text-2xl mt-0.5 shrink-0",
                        title: "font-semibold text-orange-800 dark:text-orange-200 text-sm",
                        description: "text-xs text-orange-700/70 dark:text-orange-300/70 mt-0.5",
                    },
                }), 0)
            }
        } catch {
            setTimeout(() => toast("Something went wrong", {
                icon: "⚠️",
                description: "Failed to delete booking",
                duration: 4000,
                unstyled: true,
                classNames: {
                    toast: "w-full flex items-start gap-3 bg-red-500/10 border border-red-200/60 dark:border-red-500/20 rounded-xl p-4 shadow-lg backdrop-blur-sm",
                    icon: "text-2xl mt-0.5 shrink-0",
                    title: "font-semibold text-red-800 dark:text-red-200 text-sm",
                    description: "text-xs text-red-700/70 dark:text-red-300/70 mt-0.5",
                },
            }), 0)
        } finally {
            setDeletingBooking(null)
        }
    }

    const filtered = useMemo(() => {
        return bookings
            .filter((b) => {
                if (statusFilter !== "all" && b.status !== statusFilter) return false
                if (houseFilter !== "all" && b.house !== houseFilter) return false
                if (search) {
                    const q = search.toLowerCase()
                    return (
                        b.guestName.toLowerCase().includes(q) ||
                        b.guestPhone.includes(q) ||
                        b.id.toLowerCase().includes(q) ||
                        b.momoTransactionId.toLowerCase().includes(q)
                    )
                }
                return true
            })
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }, [bookings, statusFilter, houseFilter, search])

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [statusFilter, houseFilter, search])

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
    const paginatedBookings = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE
        return filtered.slice(start, start + ITEMS_PER_PAGE)
    }, [filtered, currentPage])

    const totalRevenue = filtered
        .filter((b) => b.status !== "cancelled")
        .reduce((sum, b) => sum + b.total, 0)

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground mb-1">
                    Bookings
                </h1>
                <p className="text-sm text-muted-foreground">
                    Manage and track all bookings across your properties
                </p>
            </div>

            {/* Filters */}
            <div className="bg-card rounded-2xl border border-border p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name or phone..."
                            className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex gap-2">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 cursor-pointer"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>

                        <select
                            value={houseFilter}
                            onChange={(e) => setHouseFilter(e.target.value)}
                            className="h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 cursor-pointer"
                        >
                            <option value="all">All Properties</option>
                            {houses.map((h) => (
                                <option key={h.slug} value={h.slug}>
                                    {h.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Quick stats */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                    <span>
                        <strong className="text-foreground">{filtered.length}</strong> bookings
                    </span>
                    <span>·</span>
                    <span>
                        <strong className="text-foreground">${totalRevenue}</strong> revenue
                    </span>
                </div>
            </div>

            {/* Bookings List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-card rounded-2xl border border-border p-12 text-center">
                    <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No bookings found</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {paginatedBookings.map((booking) => {
                        const config = statusConfig[booking.status]
                        const StatusIcon = config.icon
                        const isExpanded = expandedBooking === booking.id
                        const checkOutPassed = isAfter(new Date(), parseISO(booking.checkOut))

                        return (
                            <div
                                key={booking.id}
                                className="bg-card rounded-2xl border border-border overflow-hidden transition-all"
                            >
                                {/* Main row */}
                                <button
                                    onClick={() =>
                                        setExpandedBooking(isExpanded ? null : booking.id)
                                    }
                                    className="w-full p-4 sm:p-5 flex items-center gap-4 text-left hover:bg-muted/30 transition-colors"
                                >
                                    {/* Avatar */}
                                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                                        <span className="text-xs font-semibold text-foreground">
                                            {booking.guestName
                                                .split(" ")
                                                .map((n) => n[0])
                                                .join("")
                                                .slice(0, 2)}
                                        </span>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-sm font-semibold text-foreground truncate">
                                                {booking.guestName}
                                            </span>
                                            <span className="text-xs text-muted-foreground hidden sm:inline">
                                                {booking.id}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>{booking.houseName}</span>
                                            <span>·</span>
                                            <span>
                                                {format(parseISO(booking.checkIn), "MMM d")} →{" "}
                                                {format(parseISO(booking.checkOut), "MMM d")}
                                            </span>
                                            <span className="hidden sm:inline">·</span>
                                            <span className="hidden sm:inline">
                                                {booking.nights} night{booking.nights > 1 ? "s" : ""}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Status & Amount */}
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${config.bg} ${config.color}`}
                                        >
                                            <StatusIcon className="h-3 w-3" />
                                            <span className="hidden sm:inline">{config.label}</span>
                                        </span>
                                        <span className="text-sm font-bold text-foreground">
                                            ${booking.total}
                                        </span>
                                        <ChevronDown
                                            className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                                        />
                                    </div>
                                </button>

                                {/* Expanded details */}
                                <AnimatePresence initial={false}>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-4 sm:px-5 pb-5 border-t border-border pt-4">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {/* Guest details */}
                                                    <div className="space-y-2">
                                                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                            Guest
                                                        </h4>
                                                        <div className="space-y-1.5">
                                                            <p className="text-sm text-foreground">
                                                                {booking.guestName}
                                                            </p>
                                                            {booking.guestEmail && (
                                                                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                                                    <Mail className="h-3 w-3" />
                                                                    {booking.guestEmail}
                                                                </p>
                                                            )}
                                                            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                                                <Phone className="h-3 w-3" />
                                                                {booking.guestPhone}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {booking.guests} guest{booking.guests > 1 ? "s" : ""}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Stay details */}
                                                    <div className="space-y-2">
                                                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                            Stay
                                                        </h4>
                                                        <div className="space-y-1.5 text-sm">
                                                            <p className="text-foreground">
                                                                {format(parseISO(booking.checkIn), "EEE, MMM d, yyyy")}
                                                            </p>
                                                            <p className="text-muted-foreground">to</p>
                                                            <p className="text-foreground">
                                                                {format(parseISO(booking.checkOut), "EEE, MMM d, yyyy")}
                                                            </p>
                                                            <p className="text-muted-foreground">
                                                                {booking.nights} night{booking.nights > 1 ? "s" : ""}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Payment details */}
                                                    <div className="space-y-2">
                                                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                            Payment
                                                        </h4>
                                                        <div className="space-y-1.5 text-sm">
                                                            <div className="flex justify-between">
                                                                <span className="text-muted-foreground">
                                                                    ${booking.pricePerNight} × {booking.nights}
                                                                </span>
                                                                <span className="text-foreground">
                                                                    ${booking.pricePerNight * booking.nights}
                                                                </span>
                                                            </div>
                                                            {booking.cleaningFee > 0 && (
                                                                <div className="flex justify-between">
                                                                    <span className="text-muted-foreground">
                                                                        Cleaning
                                                                    </span>
                                                                    <span className="text-foreground">
                                                                        ${booking.cleaningFee}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <div className="flex justify-between font-semibold border-t border-border pt-1.5">
                                                                <span className="text-foreground">Total</span>
                                                                <span className="text-foreground">
                                                                    ${booking.total}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">
                                                                ≈ {booking.totalRwf.toLocaleString()} RWF
                                                            </p>
                                                            {booking.momoTransactionId && (
                                                                <p className="text-xs font-mono text-muted-foreground">
                                                                    MoMo: {booking.momoTransactionId}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Special requests */}
                                                {booking.specialRequests && (
                                                    <div className="mt-4 p-3 rounded-xl bg-muted/40">
                                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                                            Special Requests
                                                        </p>
                                                        <p className="text-sm text-foreground">
                                                            {booking.specialRequests}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Review Actions for Pending */}
                                                {booking.status === "pending" && (
                                                    <div className="mt-4 pt-4 border-t border-border">
                                                        {checkOutPassed ? (
                                                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                                <AlertCircle className="h-3.5 w-3.5" />
                                                                Check-out date has passed — no actions available
                                                            </p>
                                                        ) : (<>
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <Clock className="h-4 w-4 text-amber-500" />
                                                                <span className="text-sm font-semibold text-foreground">
                                                                    Awaiting Review
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground mb-4">
                                                                Review the booking details and payment info above, then accept or reject.
                                                            </p>
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <button
                                                                    onClick={() => handleStatusChange(booking.id, "confirmed")}
                                                                    disabled={updatingStatus === booking.id}
                                                                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                                                                >
                                                                    <CheckCircle2 className="h-4 w-4" />
                                                                    Accept Booking
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setRejectingBooking(rejectingBooking === booking.id ? null : booking.id)
                                                                        setSelectedReason("dates_unavailable")
                                                                    }}
                                                                    disabled={updatingStatus === booking.id}
                                                                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                                                >
                                                                    <XCircle className="h-4 w-4" />
                                                                    Reject Booking
                                                                </button>
                                                                <div className="ml-auto">
                                                                    {confirmDelete === booking.id ? (
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-xs text-red-500 font-medium">Delete permanently?</span>
                                                                            <button
                                                                                onClick={() => handleDelete(booking.id)}
                                                                                disabled={deletingBooking === booking.id}
                                                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                                                                            >
                                                                                {deletingBooking === booking.id ? "Deleting..." : "Yes, delete"}
                                                                            </button>
                                                                            <button
                                                                                onClick={() => setConfirmDelete(null)}
                                                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                                            >
                                                                                Cancel
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => setConfirmDelete(booking.id)}
                                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-red-500 transition-colors"
                                                                        >
                                                                            <X className="h-3 w-3" />
                                                                            Delete
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <AnimatePresence initial={false}>
                                                                {rejectingBooking === booking.id && (
                                                                    <motion.div
                                                                        initial={{ height: 0, opacity: 0 }}
                                                                        animate={{ height: "auto", opacity: 1 }}
                                                                        exit={{ height: 0, opacity: 0 }}
                                                                        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                                                                        className="overflow-hidden"
                                                                    >
                                                                        <div className="mt-3 p-4 rounded-xl bg-red-500/5 border border-red-500/10 space-y-3">
                                                                            <p className="text-xs font-semibold text-red-600 dark:text-red-400">Select rejection reason:</p>
                                                                            <div className="space-y-1">
                                                                                {(Object.keys(REJECTION_REASONS) as RejectionReason[]).map((reason) => (
                                                                                    <button
                                                                                        key={reason}
                                                                                        onClick={() => setSelectedReason(reason)}
                                                                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${selectedReason === reason
                                                                                            ? "bg-red-500/15 text-red-700 dark:text-red-300 font-medium"
                                                                                            : "text-muted-foreground hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                                                                                            }`}
                                                                                    >
                                                                                        {selectedReason === reason && <span className="mr-1.5">&#10003;</span>}
                                                                                        {REJECTION_REASONS[reason].label}
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                            <div className="flex items-center gap-2 pt-1">
                                                                                <button
                                                                                    onClick={() => handleStatusChange(booking.id, "cancelled", selectedReason)}
                                                                                    disabled={updatingStatus === booking.id}
                                                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                                                                                >
                                                                                    <XCircle className="h-3.5 w-3.5" />
                                                                                    Confirm Rejection
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => setRejectingBooking(null)}
                                                                                    className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                                                                                >
                                                                                    Cancel
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </>)}
                                                    </div>
                                                )}

                                                {/* Status Actions for non-pending */}
                                                {booking.status !== "pending" && !checkOutPassed && (
                                                    <div className="mt-4 pt-4 border-t border-border">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="text-xs font-medium text-muted-foreground mr-2">
                                                                Change status:
                                                            </span>
                                                            {(["confirmed", "cancelled"] as const).map(
                                                                (s) => {
                                                                    const c = statusConfig[s]
                                                                    const Icon = c.icon
                                                                    const isActive = booking.status === s
                                                                    return (
                                                                        <button
                                                                            key={s}
                                                                            onClick={() => {
                                                                                if (s === "cancelled") {
                                                                                    setConfirmingBooking(null)
                                                                                    setRejectingBooking(rejectingBooking === booking.id ? null : booking.id)
                                                                                    setSelectedReason("dates_unavailable")
                                                                                } else if (s === "confirmed" && booking.status === "cancelled") {
                                                                                    setRejectingBooking(null)
                                                                                    setConfirmingBooking(confirmingBooking === booking.id ? null : booking.id)
                                                                                } else {
                                                                                    handleStatusChange(booking.id, s)
                                                                                }
                                                                            }}
                                                                            disabled={
                                                                                isActive || updatingStatus === booking.id
                                                                            }
                                                                            className={`
                                                                        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                                                                        ${isActive
                                                                                    ? `${c.bg} ${c.color} ring-2 ring-current/20`
                                                                                    : "bg-muted text-muted-foreground hover:text-foreground"
                                                                                }
                                                                        disabled:opacity-50 disabled:cursor-not-allowed
                                                                    `}
                                                                        >
                                                                            <Icon className="h-3 w-3" />
                                                                            {c.label}
                                                                        </button>
                                                                    )
                                                                }
                                                            )}
                                                        </div>
                                                        <AnimatePresence initial={false}>
                                                            {confirmingBooking === booking.id && (
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: "auto", opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                                                                    className="overflow-hidden"
                                                                >
                                                                    <div className="mt-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 space-y-3">
                                                                        <div className="flex gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                                                            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                                                            <div className="space-y-1">
                                                                                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Double-check before confirming</p>
                                                                                <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 leading-relaxed">
                                                                                    This will send a confirmation email to <strong>{booking.guestName}</strong> and block the dates ({booking.checkIn} → {booking.checkOut}) on the calendar, preventing new bookings.
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 pt-1">
                                                                            <button
                                                                                onClick={() => {
                                                                                    setConfirmingBooking(null)
                                                                                    handleStatusChange(booking.id, "confirmed")
                                                                                }}
                                                                                disabled={updatingStatus === booking.id}
                                                                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-black text-white hover:bg-black/80 transition-colors disabled:opacity-50"
                                                                            >
                                                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                                                Proceed
                                                                            </button>
                                                                            <button
                                                                                onClick={() => setConfirmingBooking(null)}
                                                                                className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                                                                            >
                                                                                Cancel
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                        <AnimatePresence initial={false}>
                                                            {rejectingBooking === booking.id && (
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: "auto", opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                                                                    className="overflow-hidden"
                                                                >
                                                                    <div className="mt-3 p-4 rounded-xl bg-red-500/5 border border-red-500/10 space-y-3">
                                                                        {booking.status === "confirmed" && (
                                                                            <div className="flex gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                                                                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                                                                <div className="space-y-1">
                                                                                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Double-check before cancelling</p>
                                                                                    <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 leading-relaxed">
                                                                                        This will send a cancellation email to <strong>{booking.guestName}</strong> and unblock the dates ({booking.checkIn} → {booking.checkOut}) on the calendar, making them available again.
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        <p className="text-xs font-semibold text-red-600 dark:text-red-400">Select rejection reason:</p>
                                                                        <div className="space-y-1">
                                                                            {(Object.keys(REJECTION_REASONS) as RejectionReason[]).map((reason) => (
                                                                                <button
                                                                                    key={reason}
                                                                                    onClick={() => setSelectedReason(reason)}
                                                                                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${selectedReason === reason
                                                                                        ? "bg-red-500/15 text-red-700 dark:text-red-300 font-medium"
                                                                                        : "text-muted-foreground hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                                                                                        }`}
                                                                                >
                                                                                    {selectedReason === reason && <span className="mr-1.5">&#10003;</span>}
                                                                                    {REJECTION_REASONS[reason].label}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                        <div className="flex items-center gap-2 pt-1">
                                                                            <button
                                                                                onClick={() => handleStatusChange(booking.id, "cancelled", selectedReason)}
                                                                                disabled={updatingStatus === booking.id}
                                                                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                                                                            >
                                                                                <XCircle className="h-3.5 w-3.5" />
                                                                                Confirm Rejection
                                                                            </button>
                                                                            <button
                                                                                onClick={() => setRejectingBooking(null)}
                                                                                className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                                                                            >
                                                                                Cancel
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                )}

                                                {/* Past checkout notice for non-pending */}
                                                {booking.status !== "pending" && checkOutPassed && (
                                                    <div className="mt-4 pt-4 border-t border-border">
                                                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                            <AlertCircle className="h-3.5 w-3.5" />
                                                            Check-out date has passed — no actions available
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Booked at timestamp */}
                                                <p className="text-[10px] text-muted-foreground mt-3">
                                                    Booked on{" "}
                                                    {format(
                                                        parseISO(booking.createdAt),
                                                        "MMM d, yyyy 'at' h:mm a"
                                                    )}
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Pagination */}
            {!loading && filtered.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-between mt-6 bg-card rounded-2xl border border-border px-4 py-3">
                    <p className="text-xs text-muted-foreground">
                        Showing <strong className="text-foreground">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong>–<strong className="text-foreground">{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}</strong> of <strong className="text-foreground">{filtered.length}</strong>
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`inline-flex items-center justify-center h-8 min-w-8 rounded-lg text-xs font-medium transition-colors ${page === currentPage
                                        ? "bg-foreground text-background"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                    }`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
