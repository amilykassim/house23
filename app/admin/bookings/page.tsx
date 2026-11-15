"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { format, parseISO, isAfter } from "date-fns"
import { ChevronDown, ChevronLeft, ChevronRight, Phone, Mail, AlertCircle, Plus } from "lucide-react"
import { toast } from "sonner"
import { houses } from "@/lib/houses"
import { formatRwf, formatUsd, usdLineToRwf } from "@/lib/currency"
import { type RejectionReason } from "@/lib/rejection-reasons"
import { forgetBookings, loadBookings } from "@/lib/admin-data"
import { SegmentedControl } from "@/components/segmented-control"
import { BUTTON_DARK, BUTTON_OUTLINE, ConfirmPanel, Fold, RejectPanel, StatusPill } from "@/components/admin-booking-review"
import { Skeleton, rise } from "@/components/admin-motion"

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
    source?: "website" | "manual"
    momoTransactionId: string
    specialRequests: string
    status: "pending" | "confirmed" | "cancelled"
    createdAt: string
}

const STATUS_LABEL: Record<Booking["status"], string> = {
    pending: "Pending",
    confirmed: "Confirmed",
    cancelled: "Cancelled",
}

const PANEL = "min-w-0 rounded-xl bg-[#F7F7F7] p-4 flex flex-col gap-1.5 text-sm"
const PANEL_TITLE = "text-[13px] font-semibold text-muted-foreground"
const DELETE_LINK = "min-h-11 px-2 text-sm font-semibold text-primary underline underline-offset-4"
const DELETE_YES = "min-h-11 px-4 rounded-full bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-45"
const DELETE_NO = "min-h-11 px-4 rounded-full border border-[#B0B0B0] bg-card text-sm font-semibold text-foreground hover:bg-[#F7F7F7]"
const PAGE_ARROW =
    "w-11 h-11 rounded-full border border-[#B0B0B0] bg-card flex items-center justify-center text-foreground hover:bg-[#F7F7F7] disabled:text-[#B0B0B0] disabled:border-[#DDDDDD] disabled:hover:bg-card disabled:cursor-not-allowed"

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
        loadBookings<Booking>()
            .then(setBookings)
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
                forgetBookings()
                const booking = bookings.find((b) => b.id === id)
                setRejectingBooking(null)
                setBookings((prev) =>
                    prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
                )
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
                forgetBookings()
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
            } else {
                throw new Error("Delete failed")
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
        .reduce((sum, b) => sum + b.totalRwf, 0)

    const countOf = (status: string) => (status === "all" ? bookings.length : bookings.filter((b) => b.status === status).length)
    const statusOptions = allStatuses.map((s) => ({
        id: s as string,
        label: `${s === "all" ? "All" : STATUS_LABEL[s]} · ${countOf(s)}`,
    }))
    const houseOptions = [
        { id: "all", label: houses.length === 2 ? "Both houses" : "All houses" },
        ...houses.map((h) => ({ id: h.slug as string, label: h.name })),
    ]
    const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`

    return (
        // zoom scales the whole page down a notch on every screen size
        <div className="[zoom:0.88] px-4 pt-7 sm:pt-12 pb-14 max-w-[880px] mx-auto flex flex-col gap-6">
            <div {...rise(0)} className="m-rise flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-[28px] sm:text-[34px] leading-tight font-bold tracking-[-0.02em] text-foreground">Bookings</h1>
                <Link
                    href="/admin/add"
                    className="min-h-13 px-5 rounded-xl bg-primary text-primary-foreground text-[15px] font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors"
                >
                    <Plus className="h-5 w-5" />
                    Add a booking
                </Link>
            </div>

            {/* Search */}
            <label {...rise(1)} className="m-rise rounded-2xl border border-[#B0B0B0] bg-card px-5 py-3 flex flex-col gap-0.5 focus-within:border-foreground focus-within:ring-1 focus-within:ring-foreground">
                <span className="text-[13px] font-semibold text-muted-foreground">Search</span>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Name, phone, booking or MoMo ID"
                    autoComplete="off"
                    className="w-full bg-transparent text-[17px] leading-7 text-foreground placeholder:text-[#8A8A8A] outline-none"
                />
            </label>

            {/* Filters */}
            <div {...rise(2)} className="m-rise flex flex-col gap-3">
                <div className="flex flex-wrap gap-3">
                    <div className="max-w-full overflow-x-auto rounded-full">
                        <SegmentedControl
                            className="w-max"
                            itemClassName="px-3.5 sm:px-[18px] whitespace-nowrap"
                            options={statusOptions}
                            value={statusFilter}
                            onChange={setStatusFilter}
                        />
                    </div>
                    {houses.length > 1 && (
                        <div className="max-w-full overflow-x-auto rounded-full">
                            <SegmentedControl
                                className="w-max"
                                itemClassName="px-3.5 sm:px-[18px] whitespace-nowrap"
                                options={houseOptions}
                                value={houseFilter}
                                onChange={setHouseFilter}
                            />
                        </div>
                    )}
                </div>
                <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">{filtered.length}</strong> {filtered.length === 1 ? "booking" : "bookings"} ·{" "}
                    <strong className="text-foreground">{formatRwf(totalRevenue)}</strong> revenue
                </p>
            </div>

            {/* Bookings List */}
            {loading ? (
                <div aria-label="Loading the bookings" className="flex flex-col gap-3">
                    {[0, 1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-[76px] rounded-2xl" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="rounded-2xl bg-[#F7F7F7] p-12 text-center">
                    <p className="text-[15px] text-muted-foreground">No bookings found</p>
                </div>
            ) : (
                // Keyed by filter and page (not search, which would replay on every key), so the rows rise in again
                <div key={`${statusFilter}:${houseFilter}:${currentPage}`} className="flex flex-col gap-3">
                    {paginatedBookings.map((booking, index) => {
                        const isExpanded = expandedBooking === booking.id
                        const checkOutPassed = isAfter(new Date(), parseISO(booking.checkOut))
                        const busy = updatingStatus === booking.id

                        return (
                            <div
                                key={booking.id}
                                {...rise(index, 40)}
                                className={`m-rise m-card rounded-2xl border bg-card overflow-hidden ${isExpanded ? "border-foreground ring-1 ring-foreground" : "border-border"}`}
                            >
                                {/* Main row */}
                                <button
                                    type="button"
                                    onClick={() => setExpandedBooking(isExpanded ? null : booking.id)}
                                    aria-expanded={isExpanded}
                                    className="w-full px-4 sm:px-5 py-[18px] flex items-center gap-3 sm:gap-4 text-left hover:bg-[#F7F7F7] transition-colors"
                                >
                                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                        <div className="flex items-baseline gap-2 min-w-0">
                                            <span className="text-[17px] font-semibold text-foreground truncate">{booking.guestName}</span>
                                            <span className="shrink-0 text-[13px] text-muted-foreground hidden sm:inline">{booking.id}</span>
                                        </div>
                                        <span className="text-sm text-muted-foreground">
                                            {booking.houseName} · {format(parseISO(booking.checkIn), "MMM d")} →{" "}
                                            {format(parseISO(booking.checkOut), "MMM d")}
                                            <span className="hidden sm:inline"> · {plural(booking.nights, "night")}</span>
                                        </span>
                                    </div>
                                    <StatusPill status={booking.status} />
                                    <span className="min-w-14 text-right text-[17px] font-semibold text-foreground whitespace-nowrap">{formatRwf(booking.totalRwf)}</span>
                                    <ChevronDown
                                        className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                                    />
                                </button>

                                {/* Expanded details */}
                                <Fold open={isExpanded}>
                                    <div className="px-4 sm:px-5 pb-5 flex flex-col gap-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {/* Guest details */}
                                            <div className={PANEL}>
                                                <h4 className={PANEL_TITLE}>Guest</h4>
                                                <p className="text-foreground [overflow-wrap:anywhere]">{booking.guestName}</p>
                                                {booking.guestEmail && (
                                                    <p className="text-muted-foreground flex items-start gap-1.5 [overflow-wrap:anywhere]">
                                                        <Mail className="h-3.5 w-3.5 mt-[3px] shrink-0" />
                                                        {booking.guestEmail}
                                                    </p>
                                                )}
                                                <p className="text-muted-foreground flex items-start gap-1.5">
                                                    <Phone className="h-3.5 w-3.5 mt-[3px] shrink-0" />
                                                    {booking.guestPhone}
                                                </p>
                                                <p className="text-muted-foreground">{plural(booking.guests, "guest")}</p>
                                            </div>

                                            {/* Stay details */}
                                            <div className={PANEL}>
                                                <h4 className={PANEL_TITLE}>Stay</h4>
                                                <p className="text-foreground">{format(parseISO(booking.checkIn), "EEE, MMM d, yyyy")}</p>
                                                <p className="text-muted-foreground">to</p>
                                                <p className="text-foreground">{format(parseISO(booking.checkOut), "EEE, MMM d, yyyy")}</p>
                                                <p className="text-muted-foreground">
                                                    {plural(booking.nights, "night")} · {booking.id}
                                                </p>
                                            </div>

                                            {/* Payment details */}
                                            <div className={PANEL}>
                                                <h4 className={PANEL_TITLE}>Payment</h4>
                                                <div className="flex justify-between gap-2">
                                                    <span className="text-muted-foreground">
                                                        {formatRwf(usdLineToRwf(booking.pricePerNight, booking.source === "manual"))} × {booking.nights}
                                                    </span>
                                                    <span className="text-foreground">{formatRwf(usdLineToRwf(booking.pricePerNight, booking.source === "manual") * booking.nights)}</span>
                                                </div>
                                                {booking.cleaningFee > 0 && (
                                                    <div className="flex justify-between gap-2">
                                                        <span className="text-muted-foreground">Cleaning</span>
                                                        <span className="text-foreground">{formatRwf(usdLineToRwf(booking.cleaningFee, booking.source === "manual"))}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between gap-2 font-bold border-t border-border pt-1.5">
                                                    <span className="text-foreground">Total</span>
                                                    <span className="text-foreground">{formatRwf(booking.totalRwf)}</span>
                                                </div>
                                                <p className="text-[13px] text-muted-foreground">≈ {formatUsd(booking.total)}</p>
                                                {booking.momoTransactionId && (
                                                    <p className="text-[13px] font-mono text-muted-foreground [overflow-wrap:anywhere]">
                                                        MoMo: {booking.momoTransactionId}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Special requests */}
                                        {booking.specialRequests && (
                                            <p className="text-sm text-foreground">
                                                <span className="font-semibold">Special requests: </span>
                                                {booking.specialRequests}
                                            </p>
                                        )}

                                        {/* Review Actions for Pending */}
                                        {booking.status === "pending" && (
                                            <div className="pt-4 border-t border-[#EBEBEB]">
                                                {checkOutPassed ? (
                                                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                                        <AlertCircle className="h-4 w-4" />
                                                        Check-out date has passed — no actions available
                                                    </p>
                                                ) : (
                                                    <>
                                                        <p className="text-sm text-muted-foreground mb-3">
                                                            Review the booking details and payment info above, then accept or reject.
                                                        </p>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleStatusChange(booking.id, "confirmed")}
                                                                disabled={busy}
                                                                className={BUTTON_DARK}
                                                            >
                                                                Accept Booking
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setRejectingBooking(rejectingBooking === booking.id ? null : booking.id)
                                                                    setSelectedReason("dates_unavailable")
                                                                }}
                                                                disabled={busy}
                                                                aria-expanded={rejectingBooking === booking.id}
                                                                className={BUTTON_OUTLINE}
                                                            >
                                                                Reject Booking
                                                            </button>
                                                            <div className="ml-auto flex flex-wrap items-center gap-2">
                                                                {confirmDelete === booking.id ? (
                                                                    <>
                                                                        <span className="text-sm font-semibold text-primary">Delete permanently?</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleDelete(booking.id)}
                                                                            disabled={deletingBooking === booking.id}
                                                                            className={DELETE_YES}
                                                                        >
                                                                            {deletingBooking === booking.id ? "Deleting..." : "Yes, delete"}
                                                                        </button>
                                                                        <button type="button" onClick={() => setConfirmDelete(null)} className={DELETE_NO}>
                                                                            Cancel
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <button type="button" onClick={() => setConfirmDelete(booking.id)} className={DELETE_LINK}>
                                                                        Delete
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <Fold open={rejectingBooking === booking.id}>
                                                            <RejectPanel
                                                                selected={selectedReason}
                                                                onSelect={setSelectedReason}
                                                                onConfirm={() => handleStatusChange(booking.id, "cancelled", selectedReason)}
                                                                onCancel={() => setRejectingBooking(null)}
                                                                busy={busy}
                                                            />
                                                        </Fold>
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        {/* Status Actions for non-pending */}
                                        {booking.status !== "pending" && !checkOutPassed && (
                                            <div className="pt-4 border-t border-[#EBEBEB]">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-sm font-semibold text-muted-foreground mr-1">Change status:</span>
                                                    {(["confirmed", "cancelled"] as const).map((s) => {
                                                        const isActive = booking.status === s
                                                        return (
                                                            <button
                                                                key={s}
                                                                type="button"
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
                                                                disabled={isActive || busy}
                                                                aria-pressed={isActive}
                                                                className={`min-h-11 px-4 rounded-full border text-sm font-semibold disabled:cursor-not-allowed ${isActive
                                                                    ? "border-foreground bg-foreground text-background"
                                                                    : "border-[#B0B0B0] bg-card text-foreground hover:bg-[#F7F7F7] disabled:opacity-45"
                                                                    }`}
                                                            >
                                                                {STATUS_LABEL[s]}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                                <Fold open={confirmingBooking === booking.id}>
                                                    <ConfirmPanel
                                                        booking={booking}
                                                        onConfirm={() => {
                                                            setConfirmingBooking(null)
                                                            handleStatusChange(booking.id, "confirmed")
                                                        }}
                                                        onCancel={() => setConfirmingBooking(null)}
                                                        busy={busy}
                                                    />
                                                </Fold>
                                                <Fold open={rejectingBooking === booking.id}>
                                                    <RejectPanel
                                                        booking={booking.status === "confirmed" ? booking : undefined}
                                                        selected={selectedReason}
                                                        onSelect={setSelectedReason}
                                                        onConfirm={() => handleStatusChange(booking.id, "cancelled", selectedReason)}
                                                        onCancel={() => setRejectingBooking(null)}
                                                        busy={busy}
                                                    />
                                                </Fold>
                                            </div>
                                        )}

                                        {/* Past checkout notice for non-pending */}
                                        {booking.status !== "pending" && checkOutPassed && (
                                            <p className="pt-4 border-t border-[#EBEBEB] text-sm text-muted-foreground flex items-center gap-1.5">
                                                <AlertCircle className="h-4 w-4" />
                                                Check-out date has passed — no actions available
                                            </p>
                                        )}

                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            {/* Booked at timestamp */}
                                            <p className="text-[13px] text-muted-foreground">
                                                Booked on {format(parseISO(booking.createdAt), "MMM d, yyyy 'at' h:mm a")}
                                            </p>

                                            {/* Delete: pending bookings still under review have it beside Accept / Reject */}
                                            {!(booking.status === "pending" && !checkOutPassed) && (
                                                <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                                                    {confirmDelete === booking.id ? (
                                                        <>
                                                            <span className="text-sm font-semibold text-primary">
                                                                {booking.status === "confirmed"
                                                                    ? "Delete permanently? Its dates open up again and it leaves the earnings. No email is sent."
                                                                    : "Delete permanently?"}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDelete(booking.id)}
                                                                disabled={deletingBooking === booking.id}
                                                                className={DELETE_YES}
                                                            >
                                                                {deletingBooking === booking.id ? "Deleting..." : "Yes, delete"}
                                                            </button>
                                                            <button type="button" onClick={() => setConfirmDelete(null)} className={DELETE_NO}>
                                                                Cancel
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button type="button" onClick={() => setConfirmDelete(booking.id)} className={DELETE_LINK}>
                                                            Delete booking
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Fold>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Pagination */}
            {!loading && filtered.length > ITEMS_PER_PAGE && (
                <nav aria-label="Pages" className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                        <strong className="text-foreground">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong> to{" "}
                        <strong className="text-foreground">{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}</strong> of{" "}
                        <strong className="text-foreground">{filtered.length}</strong>
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            aria-label="Previous page"
                            className={PAGE_ARROW}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                type="button"
                                onClick={() => setCurrentPage(page)}
                                aria-current={page === currentPage ? "page" : undefined}
                                className={`h-11 min-w-11 px-2 rounded-full text-sm font-semibold transition-colors ${page === currentPage
                                    ? "bg-foreground text-background"
                                    : "text-foreground hover:bg-[#F2F2F2]"
                                    }`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            aria-label="Next page"
                            className={PAGE_ARROW}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </nav>
            )}
        </div>
    )
}
