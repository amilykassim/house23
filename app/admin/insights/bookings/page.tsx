"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { format, parseISO } from "date-fns"
import { ArrowDown, ArrowLeft, ArrowUp, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { houses } from "@/lib/houses"
import { SegmentedControl } from "@/components/segmented-control"
import { DateRangePicker } from "@/components/date-range-picker"
import { PillMenu } from "@/components/pill-menu"
import { loadBookings } from "@/lib/admin-data"
import { HOUSE_FILTERS, houseColor, houseName, isDay, money, plural, stayLabel } from "@/components/earnings-insights"
import { periodFor, periodTitle, summarizeEarnings, type EarningsBooking, type EarningsStay, type Period } from "@/lib/earnings"

type SortKey = "date" | "name" | "house" | "nights" | "amount"
type SortDir = "asc" | "desc"
type Source = "all" | "website" | "manual"

// What bookings can be sorted by, and what each direction is called
const SORT_FIELDS: { id: SortKey; label: string; asc: string; desc: string }[] = [
    { id: "date", label: "Check-in date", asc: "Oldest first", desc: "Newest first" },
    { id: "name", label: "Guest name", asc: "A to Z", desc: "Z to A" },
    { id: "house", label: "House", asc: "A to Z", desc: "Z to A" },
    { id: "nights", label: "Nights", asc: "Fewest first", desc: "Most first" },
    { id: "amount", label: "Amount", asc: "Lowest first", desc: "Highest first" },
]
// The direction a field starts in: the biggest numbers first, the rest ascending
const firstDir = (key: SortKey): SortDir => (key === "nights" || key === "amount" ? "desc" : "asc")
const SOURCES: { id: Source; label: string }[] = [
    { id: "all", label: "All" },
    { id: "website", label: "Website" },
    { id: "manual", label: "By hand" },
]
const PAGE_SIZES = [10, 25, 50]
// Guest, stay, nights, source, amount
const COLUMNS = "sm:grid sm:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1.1fr)_84px_minmax(0,1fr)] sm:gap-x-5 sm:items-center"
const FIELD = "min-h-11 rounded-full border border-[#B0B0B0] bg-card text-sm font-semibold text-foreground outline-none focus-visible:border-foreground focus-visible:ring-1 focus-visible:ring-foreground"

// "Added by hand" is what a by-hand booking gets when no name is typed
const guestOf = (booking: EarningsBooking) =>
    booking.guestName && booking.guestName.trim() !== "Added by hand" ? booking.guestName.trim() : ""

function BookingsDetail() {
    const params = useSearchParams()
    const [bookings, setBookings] = useState<EarningsBooking[]>([])
    const [loading, setLoading] = useState(true)

    const [from, setFrom] = useState<string | null>(() => {
        const d = params.get("from")
        return d && isDay(d) ? d : format(periodFor("month", new Date()).start, "yyyy-MM-dd")
    })
    const [to, setTo] = useState<string | null>(() => {
        const d = params.get("to")
        return d && isDay(d) ? d : format(periodFor("month", new Date()).end, "yyyy-MM-dd")
    })
    const [house, setHouse] = useState(() => {
        const slug = params.get("house")
        return houses.some((h) => h.slug === slug) ? (slug as string) : "all"
    })
    const [source, setSource] = useState<Source>(() => {
        const s = params.get("source")
        return s === "website" || s === "manual" ? s : "all"
    })
    const [query, setQuery] = useState(() => params.get("q") ?? "")
    const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>(() => {
        const wanted = params.get("sort") ?? (params.get("view") === "nights" ? "nights-desc" : "date-asc")
        const [key, dir] = wanted.split("-")
        if (!SORT_FIELDS.some((f) => f.id === key)) return { key: "date", dir: "asc" }
        return { key: key as SortKey, dir: dir === "asc" || dir === "desc" ? dir : firstDir(key as SortKey) }
    })
    const [pageSize, setPageSize] = useState(() => {
        const n = Number(params.get("per"))
        return PAGE_SIZES.includes(n) ? n : 10
    })
    const [page, setPage] = useState(() => Math.max(1, Math.round(Number(params.get("page"))) || 1))
    const [editingDates, setEditingDates] = useState(false)
    // Opened from "Nights booked": leads with the nights, not the bookings
    const nightsView = params.get("view") === "nights"
    // The Insights view this page was opened from
    const back = params.get("back")

    useEffect(() => {
        loadBookings<EarningsBooking>()
            .then(setBookings)
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    const period: Period | null = useMemo(
        () => (from && to && to >= from ? { kind: "custom", start: parseISO(from), end: parseISO(to) } : null),
        [from, to]
    )
    const shownHouses = useMemo(() => (house === "all" ? houses : houses.filter((h) => h.slug === house)), [house])
    // Confirmed stays of the period and house, before search and source
    const summary = useMemo(
        () =>
            period
                ? summarizeEarnings(
                    house === "all" ? bookings : bookings.filter((b) => b.house === house),
                    period,
                    shownHouses.map((h) => h.slug)
                )
                : null,
        [bookings, period, house, shownHouses]
    )

    const rows = useMemo(() => {
        const needle = query.trim().toLowerCase()
        const matches = (stay: EarningsStay) => {
            const b = stay.booking
            if (source === "manual" && b.source !== "manual") return false
            if (source === "website" && b.source === "manual") return false
            if (!needle) return true
            return [guestOf(b), b.guestPhone, b.guestEmail, b.specialRequests, b.id]
                .some((text) => text?.toLowerCase().includes(needle))
        }
        const compare = (a: EarningsStay, b: EarningsStay) => {
            switch (sort.key) {
                case "name": {
                    // Bookings without a name go last, whichever way the names run
                    const [x, y] = [guestOf(a.booking), guestOf(b.booking)]
                    if (!x || !y) return x ? -1 : y ? 1 : 0
                    return sort.dir === "asc" ? x.localeCompare(y) : y.localeCompare(x)
                }
                case "house":
                    return sort.dir === "asc"
                        ? houseName(a.booking).localeCompare(houseName(b.booking))
                        : houseName(b.booking).localeCompare(houseName(a.booking))
                case "nights":
                    return sort.dir === "asc" ? a.nightsInPeriod - b.nightsInPeriod : b.nightsInPeriod - a.nightsInPeriod
                case "amount":
                    return sort.dir === "asc" ? a.amountInPeriod - b.amountInPeriod : b.amountInPeriod - a.amountInPeriod
                default:
                    return sort.dir === "asc"
                        ? a.booking.checkIn.localeCompare(b.booking.checkIn)
                        : b.booking.checkIn.localeCompare(a.booking.checkIn)
            }
        }
        // Ties fall back to the check-in date
        return (summary?.stays ?? [])
            .filter(matches)
            .sort((a, b) => compare(a, b) || a.booking.checkIn.localeCompare(b.booking.checkIn))
    }, [summary, query, source, sort])

    const pages = Math.max(1, Math.ceil(rows.length / pageSize))
    const current = Math.min(page, pages)
    const visible = rows.slice((current - 1) * pageSize, current * pageSize)
    const shownNights = rows.reduce((sum, r) => sum + r.nightsInPeriod, 0)
    const shownAmount = rows.reduce((sum, r) => sum + r.amountInPeriod, 0)
    const filtered = summary !== null && rows.length !== summary.stays.length

    // Keep the view in the URL so a reload or a shared link shows the same list
    const sortId = `${sort.key}-${sort.dir}`
    const viewQuery = useMemo(() => {
        const view = new URLSearchParams()
        if (from) view.set("from", from)
        if (to) view.set("to", to)
        view.set("house", house)
        if (source !== "all") view.set("source", source)
        if (query.trim()) view.set("q", query.trim())
        view.set("sort", sortId)
        if (current > 1) view.set("page", String(current))
        if (pageSize !== 10) view.set("per", String(pageSize))
        if (nightsView) view.set("view", "nights")
        if (back) view.set("back", back)
        return view.toString()
    }, [from, to, house, source, query, sortId, current, pageSize, nightsView, back])
    useEffect(() => {
        if (!loading) window.history.replaceState(null, "", `?${viewQuery}`)
    }, [viewQuery, loading])

    // Any change to what is listed starts again from the first page
    const change = <T,>(set: (value: T) => void) => (value: T) => {
        set(value)
        setPage(1)
    }
    const sortBy = (key: SortKey) =>
        change(setSort)({
            key,
            dir: sort.key === key ? (sort.dir === "asc" ? "desc" : "asc") : firstDir(key),
        })

    const columnHeader = (key: SortKey, label: string, className = "") => (
        <button
            type="button"
            onClick={() => sortBy(key)}
            aria-label={`Sort by ${label.toLowerCase()}`}
            className={`flex items-center gap-1 py-2 text-[13px] font-semibold hover:text-foreground ${sort.key === key ? "text-foreground" : "text-muted-foreground"} ${className}`}
        >
            {label}
            {sort.key === key && (sort.dir === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />)}
        </button>
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
            </div>
        )
    }

    return (
        // zoom scales the whole page down a notch on every screen size
        <div className="[zoom:0.88] px-4 pt-7 sm:pt-10 pb-14 max-w-[1072px] mx-auto flex flex-col gap-6">
            <div className="flex flex-col gap-3">
                <Link
                    href={`/admin/insights${back ? `?${back}` : ""}`}
                    className="self-start inline-flex items-center gap-1.5 min-h-11 text-sm font-semibold text-foreground hover:underline"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Insights
                </Link>
                <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl sm:text-[28px] font-bold tracking-[-0.02em] text-foreground">
                            {nightsView ? "Nights booked" : "Bookings"}
                        </h1>
                        <p className="text-[15px] text-muted-foreground">
                            {period ? periodTitle(period) : "Pick a start date and an end date"} · confirmed bookings only
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setEditingDates(!editingDates)}
                        aria-expanded={editingDates}
                        className={`${FIELD} px-4 ${editingDates ? "border-foreground ring-1 ring-foreground" : ""}`}
                    >
                        Change dates
                    </button>
                </div>
            </div>

            {editingDates && (
                <div className="max-w-[560px]">
                    <DateRangePicker
                        startLabel="From"
                        endLabel="To"
                        startPrompt="Pick the first day"
                        endPrompt="Pick the last day"
                        start={from}
                        end={to}
                        onChange={(start, end) => {
                            setFrom(start)
                            setTo(end)
                            setPage(1)
                        }}
                        allowSameDay
                    />
                </div>
            )}

            {/* What the list below adds up to */}
            <section className="grid grid-cols-3 gap-3 sm:gap-4">
                {[
                    { label: "Bookings", value: String(rows.length), note: filtered ? `of ${summary.stays.length} in this period` : "in this period" },
                    { label: "Nights", value: String(shownNights), note: filtered || !summary ? "in these bookings" : `of ${summary.capacity} available` },
                    { label: "Earned", value: money(shownAmount), note: shownNights > 0 ? `${money(shownAmount / shownNights)} a night` : "nothing yet" },
                ].map((tile) => (
                    <div key={tile.label} className="min-w-0 rounded-2xl border border-border bg-card p-3.5 sm:p-[18px] flex flex-col gap-1">
                        <span className="text-[13px] font-semibold text-muted-foreground">{tile.label}</span>
                        <span className="text-[17px] sm:text-[26px] leading-tight font-bold text-foreground">{tile.value}</span>
                        <span className="text-[13px] text-muted-foreground">{tile.note}</span>
                    </div>
                ))}
            </section>

            {/* Which nights are taken, per house */}
            {nightsView && summary && summary.stays.length > 0 && (
                <section className="rounded-3xl border border-border bg-card p-4 sm:p-6 flex flex-col gap-3">
                    {shownHouses.map((h) => (
                        <div key={h.slug} className="flex flex-col gap-1.5">
                            <div className="flex justify-between gap-4 text-sm">
                                <span className="font-semibold text-foreground">{h.name}</span>
                                <span className="text-muted-foreground">{plural(summary.byHouse[h.slug]?.nights || 0, "night")}</span>
                            </div>
                            <div className="flex gap-0.5">
                                {summary.buckets.map((bucket) => (
                                    <div
                                        key={bucket.key}
                                        title={`${bucket.name}: ${(bucket.byHouse[h.slug] || 0) > 0 ? "booked" : "empty"}`}
                                        className="flex-1 min-w-0 h-7 rounded bg-muted"
                                        style={(bucket.byHouse[h.slug] || 0) > 0 ? { background: houseColor(h.slug) } : undefined}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                    <div className="flex gap-0.5 text-xs text-muted-foreground text-center">
                        {summary.buckets.map((bucket) => (
                            <span key={bucket.key} className="flex-1 min-w-0 whitespace-nowrap">
                                {bucket.label}
                            </span>
                        ))}
                    </div>
                </section>
            )}

            <section className="flex flex-col gap-3">
                {/* Search, filters, sorting */}
                <div className="flex flex-wrap items-center gap-3">
                    <label className={`${FIELD} flex-[1_1_240px] flex items-center gap-2 px-4 font-normal focus-within:border-foreground focus-within:ring-1 focus-within:ring-foreground`}>
                        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => change(setQuery)(e.target.value)}
                            placeholder="Search a guest, phone, email or note"
                            aria-label="Search bookings"
                            className="w-full min-w-0 bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground outline-none"
                        />
                    </label>
                    <div className="flex items-center gap-2">
                        <PillMenu
                            options={SORT_FIELDS}
                            value={sort.key}
                            onChange={(key) => key !== sort.key && change(setSort)({ key, dir: firstDir(key) })}
                            label="Sort bookings by"
                            heading="Sort by"
                        />
                        <button
                            type="button"
                            onClick={() => change(setSort)({ key: sort.key, dir: sort.dir === "asc" ? "desc" : "asc" })}
                            aria-label="Switch the sort direction"
                            className="min-h-11 pl-3 pr-4 rounded-full bg-muted flex items-center gap-2 text-sm font-semibold text-foreground whitespace-nowrap"
                        >
                            <ArrowUp className={`h-4 w-4 transition-transform ${sort.dir === "desc" ? "rotate-180" : ""}`} />
                            {SORT_FIELDS.find((f) => f.id === sort.key)?.[sort.dir]}
                        </button>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {houses.length > 1 && <SegmentedControl options={HOUSE_FILTERS} value={house} onChange={change(setHouse)} />}
                    <SegmentedControl options={SOURCES} value={source} onChange={change(setSource)} />
                </div>

                <div className="rounded-3xl border border-border bg-card px-4 sm:px-6 py-2">
                    <div className={`hidden ${COLUMNS} border-b border-[#EBEBEB]`}>
                        {columnHeader("name", "Guest")}
                        {columnHeader("date", "Stay")}
                        {columnHeader("nights", "Nights")}
                        <span className="text-[13px] font-semibold text-muted-foreground">Source</span>
                        {columnHeader("amount", "Amount", "justify-self-end")}
                    </div>

                    {visible.length === 0 && (
                        <p className="py-8 text-center text-[15px] text-muted-foreground">
                            {!period
                                ? "Pick a start date and an end date to see the bookings."
                                : filtered
                                    ? "No booking matches. Try another name or clear the filters."
                                    : "No confirmed bookings in this period."}
                        </p>
                    )}

                    {visible.map(({ booking, totalNights, nightsInPeriod, freeNights, amountInPeriod }) => {
                        const byHand = booking.source === "manual"
                        const contact = [booking.guestPhone, booking.guestEmail].filter(Boolean).join(" · ")
                        // By-hand bookings keep where they came from in their note
                        const detail = contact || (byHand ? booking.specialRequests || "Added by hand without contact details" : "No contact details")
                        return (
                            <div
                                key={booking.id}
                                className={`flex flex-wrap justify-between items-center gap-x-6 gap-y-2 ${COLUMNS} py-3.5 border-b border-[#EBEBEB] last:border-b-0`}
                            >
                                <div className="flex-[1_1_100%] min-w-0 flex flex-col gap-0.5">
                                    <span className="text-[15px] font-semibold text-foreground [overflow-wrap:anywhere]">
                                        {guestOf(booking) || "No guest name"}
                                    </span>
                                    <span className="text-[13px] text-muted-foreground [overflow-wrap:anywhere]">{detail}</span>
                                </div>
                                <div className="flex-[1_1_180px] min-w-0 flex flex-col gap-0.5">
                                    <span className="text-[15px] text-foreground">{stayLabel(booking.checkIn, booking.checkOut)}</span>
                                    <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                                        <span className="w-2 h-2 rounded-[2px]" style={{ background: houseColor(booking.house) }} />
                                        {houseName(booking)}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[15px] text-foreground">
                                        {nightsInPeriod === totalNights ? plural(totalNights, "night") : `${nightsInPeriod} of ${totalNights} nights`}
                                        {freeNights > 0 && ` · ${freeNights} free`}
                                    </span>
                                    <span className="text-[13px] text-muted-foreground">
                                        {freeNights > 0 && freeNights < totalNights
                                            ? `${money(booking.totalRwf / (totalNights - freeNights))} a paid night`
                                            : `${money(amountInPeriod / nightsInPeriod)} a night`}
                                    </span>
                                </div>
                                <span
                                    className={`justify-self-start px-2.5 py-1 rounded-full text-xs font-semibold text-foreground border ${byHand ? "bg-muted border-muted" : "bg-card border-[#B0B0B0]"}`}
                                >
                                    {byHand ? "By hand" : "Website"}
                                </span>
                                <span className="justify-self-end text-[15px] font-bold text-foreground whitespace-nowrap">
                                    {money(amountInPeriod)}
                                </span>
                            </div>
                        )
                    })}
                </div>

                {/* Pagination */}
                {rows.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                        <span>
                            {(current - 1) * pageSize + 1} to {Math.min(current * pageSize, rows.length)} of {plural(rows.length, "booking")}
                        </span>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2">
                                Per page
                                <PillMenu
                                    options={PAGE_SIZES.map((n) => ({ id: n, label: String(n) }))}
                                    value={pageSize}
                                    onChange={change(setPageSize)}
                                    label="Bookings per page"
                                    above
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPage(current - 1)}
                                    disabled={current === 1}
                                    aria-label="Previous page"
                                    className="w-11 h-11 rounded-full border border-[#B0B0B0] bg-card flex items-center justify-center text-foreground hover:bg-[#F7F7F7] disabled:opacity-40 disabled:hover:bg-card"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <span className="font-semibold text-foreground">
                                    Page {current} of {pages}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setPage(current + 1)}
                                    disabled={current === pages}
                                    aria-label="Next page"
                                    className="w-11 h-11 rounded-full border border-[#B0B0B0] bg-card flex items-center justify-center text-foreground hover:bg-[#F7F7F7] disabled:opacity-40 disabled:hover:bg-card"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </div>
    )
}

export default function AdminInsightsBookingsPage() {
    return (
        // BookingsDetail reads its view from the URL
        <Suspense>
            <BookingsDetail />
        </Suspense>
    )
}
