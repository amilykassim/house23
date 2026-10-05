"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { format, parseISO, startOfDay } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { houses } from "@/lib/houses"
import { SegmentedControl } from "@/components/segmented-control"
import { DateRangePicker } from "@/components/date-range-picker"
import { ADMIN_NIGHTLY_PRICE_RWF } from "@/lib/currency"
import type { Expense } from "@/lib/expenses"
import {
    periodFor,
    periodTitle,
    shiftAnchor,
    summarizeEarnings,
    type EarningsBooking,
    type Period,
    type PeriodKind,
} from "@/lib/earnings"

// One fixed colour per house, in listing order (never reassigned by rank).
const HOUSE_COLORS = ["#2A78D6", "#EB6834", "#1BAF7A", "#EDA100"]
export const houseColor = (slug: string) => HOUSE_COLORS[houses.findIndex((h) => h.slug === slug)] ?? HOUSE_COLORS[0]
// "all" or one house slug, for the house switch on Insights and its detail page
export const HOUSE_FILTERS = [{ id: "all", label: "All houses" }, ...houses.map((h) => ({ id: h.slug, label: h.name }))]
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const PERIOD_KINDS: { id: Exclude<PeriodKind, "custom">; label: string }[] = [
    { id: "week", label: "Week" },
    { id: "month", label: "Month" },
    { id: "year", label: "Year" },
]
const CHART_HEIGHT = 170
const DAY_CHART_HEIGHT = 140
// Two tiles per row on phones, as many as fit from tablet width up
const TILE_GRID = "grid grid-cols-2 gap-3 sm:gap-4 sm:[grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]"
const CARD = "rounded-3xl border border-border bg-card p-4 sm:p-6 flex flex-col"

// Hovering, tapping or dragging across a chart selects the bar under the pointer.
const scrub = (count: number, select: (index: number) => void) => (e: React.PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    const index = Math.floor(((e.clientX - box.left) / box.width) * count)
    select(Math.max(0, Math.min(count - 1, index)))
}

// "yyyy-MM-dd"
export const isDay = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d)
export const money = (n: number) => `${Math.round(n).toLocaleString("en-US")} RWF`
export const houseName = (booking: EarningsBooking) =>
    houses.find((h) => h.slug === booking.house)?.name ?? booking.houseName ?? booking.house
export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`

interface TileProps {
    label: string
    value: string
    note: string
    /** Makes the tile a link to the page with its details */
    href?: string
}

function Tile({ label, value, note, href }: TileProps) {
    const content = (
        <>
            <span className="flex items-center justify-between gap-2 text-[13px] font-semibold text-muted-foreground">
                {label}
                {href && <ChevronRight className="h-4 w-4 shrink-0" />}
            </span>
            <span className="text-[19px] sm:text-[26px] leading-tight font-bold text-foreground">{value}</span>
            <span className="text-[13px] text-muted-foreground">{note}</span>
        </>
    )
    if (!href) {
        return (
            <div className="min-w-0 rounded-2xl border border-border bg-card p-3.5 sm:p-[18px] flex flex-col gap-1">
                {content}
            </div>
        )
    }
    return (
        <Link
            href={href}
            className="min-w-0 rounded-2xl border border-border bg-card p-3.5 sm:p-[18px] flex flex-col gap-1 hover:border-[#B0B0B0] transition-colors"
        >
            {content}
        </Link>
    )
}

// "Sat 3 to Sat 10 Oct", or with both months when the stay crosses one
export function stayLabel(checkIn: string, checkOut: string) {
    const start = parseISO(checkIn)
    const end = parseISO(checkOut)
    const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()
    return `${format(start, sameMonth ? "EEE d" : "EEE d MMM")} to ${format(end, "EEE d MMM")}`
}

export function EarningsInsights({ bookings, expenses = [] }: { bookings: EarningsBooking[]; expenses?: Expense[] }) {
    // The view (period and house) lives in the URL, so coming back from a
    // detail page or reloading shows the same thing.
    const params = useSearchParams()
    const [kind, setKind] = useState<PeriodKind>(() => {
        const k = params.get("kind")
        return k === "week" || k === "year" || k === "custom" ? k : "month"
    })
    const [anchor, setAnchor] = useState(() => {
        const at = params.get("at")
        return startOfDay(at && isDay(at) ? parseISO(at) : new Date())
    })
    const [customStart, setCustomStart] = useState<string | null>(() => {
        const from = params.get("from")
        return from && isDay(from) ? from : format(periodFor("month", new Date()).start, "yyyy-MM-dd")
    })
    const [customEnd, setCustomEnd] = useState<string | null>(() => {
        const to = params.get("to")
        return to && isDay(to) ? to : format(new Date(), "yyyy-MM-dd")
    })
    const [house, setHouse] = useState(() => {
        const slug = params.get("house")
        return houses.some((h) => h.slug === slug) ? (slug as string) : "all"
    })
    const [hoveredBar, setHoveredBar] = useState<number | null>(null)
    const [hoveredDay, setHoveredDay] = useState<number | null>(null)

    const view = new URLSearchParams({ kind, house })
    if (kind === "custom") {
        if (customStart) view.set("from", customStart)
        if (customEnd) view.set("to", customEnd)
    } else {
        view.set("at", format(anchor, "yyyy-MM-dd"))
    }
    const viewQuery = view.toString()
    useEffect(() => {
        window.history.replaceState(null, "", `?${viewQuery}`)
    }, [viewQuery])

    const shownHouses = useMemo(() => (house === "all" ? houses : houses.filter((h) => h.slug === house)), [house])
    const shownBookings = useMemo(
        () => (house === "all" ? bookings : bookings.filter((b) => b.house === house)),
        [bookings, house]
    )
    const period: Period | null = useMemo(() => {
        if (kind !== "custom") return periodFor(kind, anchor)
        if (!customStart || !customEnd || customEnd < customStart) return null
        return { kind: "custom", start: parseISO(customStart), end: parseISO(customEnd) }
    }, [kind, anchor, customStart, customEnd])

    const summary = useMemo(
        () => (period ? summarizeEarnings(shownBookings, period, shownHouses.map((h) => h.slug)) : null),
        [shownBookings, period, shownHouses]
    )

    const pickKind = (next: PeriodKind) => {
        setKind(next)
        setAnchor(startOfDay(new Date()))
        setHoveredBar(null)
        setHoveredDay(null)
    }
    const shift = (step: number) => {
        if (kind === "custom") return
        setAnchor((a) => shiftAnchor(kind, a, step))
        setHoveredBar(null)
    }

    const header = (
        <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl sm:text-[28px] font-bold tracking-[-0.02em] text-foreground">Earnings</h1>
            <div className="flex flex-wrap items-center gap-3">
                {houses.length > 1 && (
                    <SegmentedControl
                        options={HOUSE_FILTERS}
                        value={house}
                        onChange={(next) => {
                            setHouse(next)
                            setHoveredBar(null)
                        }}
                    />
                )}
                <SegmentedControl
                    options={PERIOD_KINDS}
                    value={kind === "custom" ? null : kind}
                    onChange={pickKind}
                />
                <button
                    type="button"
                    onClick={() => pickKind("custom")}
                    aria-pressed={kind === "custom"}
                    className={`min-h-11 px-4 rounded-full border bg-card text-sm font-semibold text-foreground ${kind === "custom" ? "border-foreground ring-1 ring-foreground" : "border-[#B0B0B0]"}`}
                >
                    Custom dates
                </button>
            </div>
        </div>
    )

    const customInputs = kind === "custom" && (
        <div className="max-w-[560px]">
            <DateRangePicker
                startLabel="From"
                endLabel="To"
                startPrompt="Pick the first day"
                endPrompt="Pick the last day"
                start={customStart}
                end={customEnd}
                onChange={(start, end) => {
                    setCustomStart(start)
                    setCustomEnd(end)
                    setHoveredBar(null)
                }}
                allowSameDay
            />
        </div>
    )

    if (!period || !summary) {
        return (
            <div className="space-y-6">
                {header}
                {customInputs}
                <p className="text-sm text-muted-foreground">Pick a start date and an end date to see the earnings.</p>
            </div>
        )
    }

    const { total, previousTotal } = summary
    // The detail page shows this period and house, and links back to this view
    const detailQuery = new URLSearchParams({
        from: format(period.start, "yyyy-MM-dd"),
        to: format(period.end, "yyyy-MM-dd"),
        house,
        back: viewQuery,
    }).toString()

    // Expenses dated inside the period; one for "all houses" counts once.
    // With one house picked: its own expenses, plus its equal share of any
    // still recorded for all houses.
    const periodStart = format(period.start, "yyyy-MM-dd")
    const periodEnd = format(period.end, "yyyy-MM-dd")
    const datedExpenses = expenses.filter((e) => e.date >= periodStart && e.date <= periodEnd)
    const periodExpenses =
        house === "all"
            ? datedExpenses
            : datedExpenses
                .filter((e) => e.house === house || e.house === "all")
                .map((e) => (e.house === "all" ? { ...e, amountRwf: e.amountRwf / houses.length } : e))
    const spent = periodExpenses.reduce((sum, e) => sum + e.amountRwf, 0)
    const profit = total - spent
    const spentByCategory: Record<string, number> = {}
    periodExpenses.forEach((e) => {
        spentByCategory[e.category] = (spentByCategory[e.category] || 0) + e.amountRwf
    })
    const topCategory = Object.keys(spentByCategory).sort((x, y) => spentByCategory[y] - spentByCategory[x])[0] ?? ""
    const change = previousTotal > 0 ? Math.round(((total - previousTotal) / previousTotal) * 100) : null
    const previousName =
        kind === "week" ? "the week before" : kind === "month" ? "the month before" : kind === "year" ? "the year before" : "the period before"
    const delta =
        change === null
            ? `nothing earned ${previousName}`
            : `${change >= 0 ? "up" : "down"} ${Math.abs(change)}% on ${previousName}`

    const maxBucket = Math.max(...summary.buckets.map((b) => b.total), 1)
    const hovered = hoveredBar !== null ? summary.buckets[hoveredBar] : null
    const hasEarnings = total > 0

    const weekdayTotal = summary.weekdays.reduce((sum, v) => sum + v, 0)
    const weekdayMax = Math.max(...summary.weekdays, 1)
    const bestDay = summary.weekdays.indexOf(Math.max(...summary.weekdays))
    const quietDay = summary.weekdays.indexOf(Math.min(...summary.weekdays))
    const weekendTotal = summary.weekdays[4] + summary.weekdays[5] + summary.weekdays[6]
    const weekendShare = weekdayTotal > 0 ? Math.round((weekendTotal / weekdayTotal) * 100) : 0

    const days = summary.capacity / shownHouses.length
    const emptyByHouse = shownHouses.map((h) => Math.max(days - (summary.byHouse[h.slug]?.nights || 0), 0))
    const emptyNights = emptyByHouse.reduce((sum, v) => sum + v, 0)
    const emptyWorth = emptyNights * ADMIN_NIGHTLY_PRICE_RWF
    const houseMax = Math.max(...shownHouses.map((h) => summary.byHouse[h.slug]?.total || 0), 1)
    const website = summary.bookings - summary.byHand
    const ranked = houses
        .map((h) => ({ name: h.name, total: summary.byHouse[h.slug]?.total || 0 }))
        .sort((x, y) => y.total - x.total)
    const lead = ranked.length > 1 ? Math.round(ranked[0].total - ranked[1].total) : 0

    return (
        <div className="space-y-6">
            {header}
            {customInputs}

            {/* Headline */}
            <section className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    {kind !== "custom" && (
                        <button
                            type="button"
                            onClick={() => shift(-1)}
                            aria-label={`Previous ${kind}`}
                            className="w-9 h-9 rounded-full border border-border bg-card flex items-center justify-center text-foreground hover:bg-[#F7F7F7] transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                    )}
                    <span className="text-[15px] text-muted-foreground">{periodTitle(period)}</span>
                    {kind !== "custom" && (
                        <button
                            type="button"
                            onClick={() => shift(1)}
                            aria-label={`Next ${kind}`}
                            className="w-9 h-9 rounded-full border border-border bg-card flex items-center justify-center text-foreground hover:bg-[#F7F7F7] transition-colors"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    )}
                </div>
                {/* Revenue − expenses = profit, for the chosen period */}
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="min-w-0 rounded-[20px] border border-border bg-card p-4 sm:p-5 flex flex-col gap-1">
                        <span className="text-[13px] font-semibold text-muted-foreground">Total revenue</span>
                        <span className="text-[19px] sm:text-[26px] leading-tight font-bold tracking-[-0.02em] text-foreground">
                            {money(total)}
                        </span>
                        <span className="text-[13px] text-muted-foreground">{delta}</span>
                    </div>
                    <div className="min-w-0 rounded-[20px] border border-border bg-card p-4 sm:p-5 flex flex-col gap-1">
                        <span className="text-[13px] font-semibold text-muted-foreground">Expenses</span>
                        <span className="text-[19px] sm:text-[26px] leading-tight font-bold tracking-[-0.02em] text-foreground">
                            {money(spent)}
                        </span>
                        <span className="text-[13px] text-muted-foreground">
                            {periodExpenses.length === 0
                                ? "none recorded"
                                : `${plural(periodExpenses.length, "expense")}, mostly ${topCategory.toLowerCase()}`}
                        </span>
                    </div>
                    <div className="col-span-2 sm:col-span-1 min-w-0 rounded-[20px] bg-foreground p-4 sm:p-5 flex flex-col gap-1">
                        <span className="text-[13px] font-semibold text-background/75">{profit < 0 ? "Loss" : "Profit"}</span>
                        <span className="text-[26px] leading-tight font-bold tracking-[-0.02em] text-background">
                            {profit < 0 ? "−" : ""}
                            {money(Math.abs(profit))}
                        </span>
                        <span className="text-[13px] text-background/75">
                            {total > 0
                                ? profit >= 0
                                    ? `${Math.round((profit / total) * 100)}% of revenue kept`
                                    : "expenses were higher than revenue"
                                : "revenue minus expenses"}
                        </span>
                    </div>
                </div>
            </section>

            {/* Earnings over the period, stacked by house */}
            <section className={`${CARD} gap-4`}>
                <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
                    <div className="flex gap-4 text-sm text-muted-foreground">
                        {shownHouses.map((h) => (
                            <span key={h.slug} className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: houseColor(h.slug) }} />
                                {h.name}
                            </span>
                        ))}
                    </div>
                    <span className="text-sm font-semibold text-foreground min-h-5">
                        {hovered
                            ? `${hovered.name} · ${money(hovered.total)}${shownHouses.length > 1
                                ? ` (${shownHouses.map((h) => `${h.name} ${money(hovered.byHouse[h.slug] || 0)}`).join(", ")})`
                                : ""}`
                            : hasEarnings
                                ? "Tap or hover a bar for the detail"
                                : "No confirmed earnings in this period"}
                    </span>
                </div>
                <div
                    onPointerDown={scrub(summary.buckets.length, setHoveredBar)}
                    onPointerMove={scrub(summary.buckets.length, setHoveredBar)}
                    onMouseLeave={() => setHoveredBar(null)}
                    className={`flex items-end border-b border-border touch-pan-y ${summary.buckets.length > 12 ? "gap-0.5 sm:gap-1" : "gap-2 sm:gap-4"}`}
                    style={{ height: CHART_HEIGHT + 20 }}
                >
                    {summary.buckets.map((bucket, index) => {
                        const segments = houses
                            .map((h) => ({ slug: h.slug, color: houseColor(h.slug), value: bucket.byHouse[h.slug] || 0 }))
                            .filter((s) => s.value > 0)
                        return (
                            <div
                                key={bucket.key}
                                className={`flex-1 min-w-0 h-full flex flex-col-reverse items-center gap-0.5 ${hoveredBar === index ? "bg-[#F7F7F7]" : ""}`}
                            >
                                {segments.map((s, i) => (
                                    <div
                                        key={s.slug}
                                        className={`w-full max-w-7 ${i === segments.length - 1 ? "rounded-t" : ""}`}
                                        style={{ height: Math.max(Math.round((s.value / maxBucket) * CHART_HEIGHT), 2), background: s.color }}
                                    />
                                ))}
                            </div>
                        )
                    })}
                </div>
                <div className={`flex text-xs text-muted-foreground text-center ${summary.buckets.length > 12 ? "gap-0.5 sm:gap-1" : "gap-2 sm:gap-4"}`}>
                    {summary.buckets.map((bucket) => (
                        <span key={bucket.key} className="flex-1 min-w-0 whitespace-nowrap">
                            {bucket.label}
                        </span>
                    ))}
                </div>
            </section>

            <section className={TILE_GRID}>
                <Tile
                    label="Nights booked"
                    value={String(summary.nights)}
                    note={`of ${summary.capacity} available`}
                    href={`/admin/insights/bookings?${detailQuery}&view=nights`}
                />
                <Tile
                    label="Occupancy"
                    value={`${Math.min(Math.round((summary.nights / Math.max(summary.capacity, 1)) * 100), 100)}%`}
                    note={shownHouses.length > 1 ? "all houses together" : "of the period"}
                />
                <Tile
                    label="Bookings"
                    value={String(summary.bookings)}
                    note={`${summary.byHand} added by hand`}
                    href={`/admin/insights/bookings?${detailQuery}`}
                />
                <Tile
                    label="Average per booking"
                    value={summary.bookings > 0 ? money(total / summary.bookings) : "–"}
                    note="earned in this period"
                />
            </section>

            <h2 className="mt-4 text-[22px] font-bold tracking-[-0.01em] text-foreground">Patterns</h2>

            {hasEarnings ? (
                <section className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
                    <div className="rounded-[20px] bg-[#F7F7F7] p-4 sm:p-[22px] flex flex-col gap-2">
                        <span className="text-[13px] font-semibold text-muted-foreground">Best day</span>
                        <span className="text-xl font-bold tracking-[-0.01em] leading-tight text-foreground">{WEEKDAYS[bestDay]}s earn the most</span>
                        <span className="text-sm text-muted-foreground">
                            {money(summary.weekdays[bestDay])} in this period, {Math.round((summary.weekdays[bestDay] / weekdayTotal) * 100)}% of the total
                        </span>
                    </div>
                    <div className="rounded-[20px] bg-[#F7F7F7] p-4 sm:p-[22px] flex flex-col gap-2">
                        <span className="text-[13px] font-semibold text-muted-foreground">Weekends</span>
                        <span className="text-xl font-bold tracking-[-0.01em] leading-tight text-foreground">{weekendShare}% comes from Friday to Sunday</span>
                        <span className="text-sm text-muted-foreground">
                            {money(weekendTotal)} of {money(weekdayTotal)}
                        </span>
                    </div>
                    <div className="rounded-[20px] bg-[#F7F7F7] p-4 sm:p-[22px] flex flex-col gap-2">
                        <span className="text-[13px] font-semibold text-muted-foreground">Room to grow</span>
                        <span className="text-xl font-bold tracking-[-0.01em] leading-tight text-foreground">{WEEKDAYS[quietDay]}s are the quietest</span>
                        <span className="text-sm text-muted-foreground">
                            {money(summary.weekdays[quietDay])} earned. A {quietDay < 4 ? "midweek" : "weekend"} offer could fill them.
                        </span>
                    </div>
                </section>
            ) : (
                <p className="text-sm text-muted-foreground">
                    Patterns appear once there are confirmed bookings in this period.
                </p>
            )}

            <section className="flex flex-wrap items-stretch gap-4">
                {/* Earnings by weekday */}
                <div className={`flex-[999_1_420px] min-w-0 ${CARD} gap-4`}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                        <h3 className="text-[17px] font-semibold text-foreground">By day of the week</h3>
                        <span className="text-sm font-semibold text-foreground min-h-5">
                            {hoveredDay !== null ? `${WEEKDAYS[hoveredDay]} · ${money(summary.weekdays[hoveredDay])}` : ""}
                        </span>
                    </div>
                    <div
                        onPointerDown={scrub(7, setHoveredDay)}
                        onPointerMove={scrub(7, setHoveredDay)}
                        onMouseLeave={() => setHoveredDay(null)}
                        className="flex items-end gap-2 sm:gap-3 border-b border-border touch-pan-y"
                        style={{ height: DAY_CHART_HEIGHT + 40 }}
                    >
                        {summary.weekdays.map((value, index) => (
                            <div
                                key={WEEKDAYS[index]}
                                className={`flex-1 min-w-0 h-full flex flex-col justify-end items-center gap-1.5 ${hoveredDay === index ? "bg-[#F7F7F7]" : ""}`}
                            >
                                <span className="text-[13px] font-semibold text-foreground text-center whitespace-nowrap">
                                    {hasEarnings && index === bestDay ? Math.round(value).toLocaleString("en-US") : ""}
                                </span>
                                <div
                                    className={`w-full max-w-12 rounded-t ${hasEarnings && index === bestDay ? "bg-foreground" : "bg-[#D5D5D5]"}`}
                                    style={{ height: Math.max(Math.round((value / weekdayMax) * DAY_CHART_HEIGHT), 2) }}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2 sm:gap-3 text-[13px] text-muted-foreground text-center">
                        {WEEKDAYS.map((day) => (
                            <span key={day} className="flex-1 min-w-0">
                                {day.slice(0, 3)}
                            </span>
                        ))}
                    </div>
                    {hasEarnings && (
                        <div className="flex flex-col gap-2 pt-2">
                            <div className="flex gap-0.5 h-3.5">
                                <div className="rounded-l-full bg-[#D5D5D5]" style={{ width: `${100 - weekendShare}%` }} />
                                <div className="flex-1 rounded-r-full bg-foreground" />
                            </div>
                            <div className="flex justify-between gap-4 text-sm text-foreground">
                                <span>Mon to Thu · {100 - weekendShare}%</span>
                                <span>Fri to Sun · {weekendShare}%</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-[1_1_300px] min-w-0 flex flex-col gap-4">
                    <div className={`flex-1 ${CARD} gap-3.5`}>
                        <h3 className="text-[17px] font-semibold text-foreground">By house</h3>
                        {shownHouses.map((h) => {
                            const house = summary.byHouse[h.slug] || { total: 0, nights: 0, freeNights: 0 }
                            return (
                                <div key={h.slug} className="flex flex-col gap-1.5">
                                    <div className="flex justify-between gap-4 text-[15px] text-foreground">
                                        <span>{h.name}</span>
                                        <span className="font-semibold">
                                            {money(house.total)} · {plural(house.nights, "night")}
                                            {house.freeNights > 0 && ` · ${house.freeNights} free`}
                                        </span>
                                    </div>
                                    <div className="h-2.5 rounded-full bg-muted">
                                        <div
                                            className="h-2.5 rounded-full"
                                            style={{ width: `${Math.round((house.total / houseMax) * 100)}%`, background: houseColor(h.slug) }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <div className={`flex-1 ${CARD} gap-3.5`}>
                        <h3 className="text-[17px] font-semibold text-foreground">Where bookings came from</h3>
                        {[
                            { name: "Website", count: website },
                            { name: "Added by hand", count: summary.byHand },
                        ].map((source) => (
                            <div key={source.name} className="flex flex-col gap-1.5">
                                <div className="flex justify-between gap-4 text-[15px] text-foreground">
                                    <span>{source.name}</span>
                                    <span className="font-semibold">{plural(source.count, "booking")}</span>
                                </div>
                                <div className="h-2.5 rounded-full bg-muted">
                                    <div
                                        className="h-2.5 rounded-full bg-muted-foreground"
                                        style={{ width: `${summary.bookings > 0 ? Math.round((source.count / summary.bookings) * 100) : 0}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className={TILE_GRID}>
                <Tile label="Empty nights" value={String(emptyNights)} note={`worth ${money(emptyWorth)} at ${ADMIN_NIGHTLY_PRICE_RWF.toLocaleString("en-US")} a night`} />
                <Tile
                    label="Free nights"
                    value={String(summary.freeNights)}
                    note={
                        summary.freeNights === 0
                            ? "none given in this period"
                            : shownHouses.length > 1
                                ? shownHouses.map((h) => `${h.name}: ${summary.byHouse[h.slug]?.freeNights || 0}`).join(" · ")
                                : `of ${plural(summary.nights, "night")} booked`
                    }
                />
                <Tile
                    label="Average stay"
                    value={summary.bookings > 0 ? `${summary.averageStay.toFixed(1)} nights` : "–"}
                    note="per booking"
                />
                <Tile
                    label="Booked ahead"
                    value={summary.leadDays !== null ? plural(Math.round(summary.leadDays), "day") : "–"}
                    note="before check-in, website bookings"
                />
                {ranked.length > 1 && (
                    <Tile
                        label="Stronger house"
                        value={hasEarnings && lead > 0 ? ranked[0].name : "–"}
                        note={
                            !hasEarnings
                                ? "no earnings in this period"
                                : lead > 0
                                    ? `${money(lead)} ahead of ${ranked[1].name}`
                                    : "the houses are level"
                        }
                    />
                )}
            </section>
        </div>
    )
}
