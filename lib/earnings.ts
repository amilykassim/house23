import {
    addDays,
    addMonths,
    addWeeks,
    addYears,
    differenceInCalendarDays,
    eachDayOfInterval,
    eachMonthOfInterval,
    endOfMonth,
    endOfWeek,
    endOfYear,
    format,
    parseISO,
    startOfMonth,
    startOfWeek,
    startOfYear,
    subDays,
} from "date-fns"

export interface EarningsBooking {
    id: string
    house: string
    checkIn: string
    checkOut: string
    total: number
    totalRwf: number
    status: "pending" | "confirmed" | "cancelled"
    createdAt: string
    source?: "website" | "manual"
    freeNights?: number
    houseName?: string
    guestName?: string
    guestEmail?: string
    guestPhone?: string
    specialRequests?: string
}

// A confirmed booking with at least one night inside the period
export interface EarningsStay {
    booking: EarningsBooking
    totalNights: number
    nightsInPeriod: number
    // Free nights of the whole stay, and those that fall inside the period
    freeNights: number
    freeNightsInPeriod: number
    amountInPeriod: number // RWF
}

export type PeriodKind = "week" | "month" | "year" | "custom"

export interface Period {
    kind: PeriodKind
    start: Date
    end: Date // inclusive
}

export interface EarningsBucket {
    key: string
    name: string // full label for the hover readout
    label: string // short axis label, may be empty
    byHouse: Record<string, number>
    total: number
}

// All amounts are in RWF except `totalUsd`.
export interface EarningsSummary {
    total: number
    totalUsd: number
    previousTotal: number
    buckets: EarningsBucket[]
    nights: number
    freeNights: number // part of `nights`
    capacity: number
    bookings: number
    byHand: number
    averageStay: number
    leadDays: number | null // bookings made or recorded before check-in
    byHouse: Record<string, { total: number; nights: number; freeNights: number }>
    weekdays: number[] // Monday first
    stays: EarningsStay[] // by check-in date
}

const WEEK_OPTIONS = { weekStartsOn: 1 as const }
const DAY_BUCKET_LIMIT = 62

export function periodFor(kind: Exclude<PeriodKind, "custom">, anchor: Date): Period {
    if (kind === "week") {
        return { kind, start: startOfWeek(anchor, WEEK_OPTIONS), end: endOfWeek(anchor, WEEK_OPTIONS) }
    }
    if (kind === "month") {
        return { kind, start: startOfMonth(anchor), end: endOfMonth(anchor) }
    }
    return { kind, start: startOfYear(anchor), end: endOfYear(anchor) }
}

export function shiftAnchor(kind: Exclude<PeriodKind, "custom">, anchor: Date, step: number): Date {
    if (kind === "week") return addWeeks(anchor, step)
    if (kind === "month") return addMonths(anchor, step)
    return addYears(anchor, step)
}

// The period of the same length immediately before this one.
export function previousPeriod(period: Period): Period {
    if (period.kind !== "custom") {
        return periodFor(period.kind, shiftAnchor(period.kind, period.start, -1))
    }
    const days = differenceInCalendarDays(period.end, period.start) + 1
    return { kind: "custom", start: subDays(period.start, days), end: subDays(period.start, 1) }
}

export function periodTitle(period: Period): string {
    if (period.kind === "month") return format(period.start, "MMMM yyyy")
    if (period.kind === "year") return format(period.start, "yyyy")
    const sameYear = period.start.getFullYear() === period.end.getFullYear()
    return `${format(period.start, sameYear ? "d MMM" : "d MMM yyyy")} to ${format(period.end, "d MMM yyyy")}`
}

const dayKey = (d: Date) => format(d, "yyyy-MM-dd")

/**
 * Earnings for a period. A booking's total is spread evenly over its nights,
 * so a stay that crosses a week or month boundary is split between them.
 * Only confirmed bookings count as earned. Free nights are counted as the
 * last nights of the stay; the money is still spread over every night.
 */
export function summarizeEarnings(
    bookings: EarningsBooking[],
    period: Period,
    houseSlugs: string[]
): EarningsSummary {
    const startKey = dayKey(period.start)
    const endKey = dayKey(period.end)
    const days = differenceInCalendarDays(period.end, period.start) + 1
    const byDay = days <= DAY_BUCKET_LIMIT

    const buckets: EarningsBucket[] = byDay
        ? eachDayOfInterval({ start: period.start, end: period.end }).map((d, i) => ({
            key: dayKey(d),
            name: format(d, "EEE d MMM"),
            label: days <= 7 ? format(d, "EEE") : i % 7 === 0 ? format(d, "d") : "",
            byHouse: {},
            total: 0,
        }))
        : eachMonthOfInterval({ start: period.start, end: period.end }).map((d) => ({
            key: format(d, "yyyy-MM"),
            name: format(d, "MMMM yyyy"),
            label: format(d, "MMM"),
            byHouse: {},
            total: 0,
        }))
    const bucketIndex = new Map(buckets.map((b, i) => [b.key, i]))

    const byHouse: EarningsSummary["byHouse"] = {}
    houseSlugs.forEach((slug) => {
        byHouse[slug] = { total: 0, nights: 0, freeNights: 0 }
    })
    const weekdays = [0, 0, 0, 0, 0, 0, 0]

    let total = 0
    let totalUsd = 0
    let nights = 0
    let freeNights = 0
    let bookingCount = 0
    let byHand = 0
    let stayNights = 0
    let leadSum = 0
    let leadCount = 0
    const stays: EarningsStay[] = []

    const previous = previousPeriod(period)
    const previousStartKey = dayKey(previous.start)
    const previousEndKey = dayKey(previous.end)
    let previousTotal = 0

    for (const booking of bookings) {
        if (booking.status !== "confirmed") continue
        const checkIn = parseISO(booking.checkIn)
        const stay = differenceInCalendarDays(parseISO(booking.checkOut), checkIn)
        if (!(stay > 0)) continue

        const perNight = booking.totalRwf / stay
        const perNightUsd = booking.total / stay
        const free = Math.min(Math.max(booking.freeNights || 0, 0), stay)
        let nightsInPeriod = 0
        let freeNightsInPeriod = 0

        for (let i = 0; i < stay; i++) {
            const night = addDays(checkIn, i)
            const key = dayKey(night)
            if (key >= previousStartKey && key <= previousEndKey) previousTotal += perNight
            if (key < startKey || key > endKey) continue

            nightsInPeriod += 1
            total += perNight
            totalUsd += perNightUsd
            nights += 1
            weekdays[(night.getDay() + 6) % 7] += perNight

            const house = (byHouse[booking.house] ??= { total: 0, nights: 0, freeNights: 0 })
            house.total += perNight
            house.nights += 1
            if (i >= stay - free) {
                freeNightsInPeriod += 1
                freeNights += 1
                house.freeNights += 1
            }

            const index = bucketIndex.get(byDay ? key : key.slice(0, 7))
            if (index !== undefined) {
                const bucket = buckets[index]
                bucket.byHouse[booking.house] = (bucket.byHouse[booking.house] || 0) + perNight
                bucket.total += perNight
            }
        }

        if (nightsInPeriod === 0) continue
        stays.push({
            booking,
            totalNights: stay,
            nightsInPeriod,
            freeNights: free,
            freeNightsInPeriod,
            amountInPeriod: perNight * nightsInPeriod,
        })
        bookingCount += 1
        stayNights += stay
        if (booking.source === "manual") byHand += 1
        // A by-hand booking counts from the day it was recorded; one recorded
        // after check-in says nothing about how far ahead it was booked.
        const lead = differenceInCalendarDays(checkIn, parseISO(booking.createdAt))
        if (lead >= 0) {
            leadSum += lead
            leadCount += 1
        }
    }

    return {
        total,
        totalUsd,
        previousTotal,
        buckets,
        nights,
        freeNights,
        capacity: days * houseSlugs.length,
        bookings: bookingCount,
        byHand,
        averageStay: bookingCount > 0 ? stayNights / bookingCount : 0,
        leadDays: leadCount > 0 ? leadSum / leadCount : null,
        byHouse,
        weekdays,
        stays: stays.sort((a, b) => a.booking.checkIn.localeCompare(b.booking.checkIn)),
    }
}

/**
 * Nights of the period that can still be booked and are not: from today
 * (tonight included) to the period's end, per house, without a confirmed
 * booking. Past nights are gone, so a period that is over has none.
 */
export function emptyNightsAhead(
    bookings: EarningsBooking[],
    period: Period,
    houseSlugs: string[],
    today: Date
): { total: number; byHouse: Record<string, number>; startsToday: boolean } {
    const todayKey = dayKey(today)
    const firstKey = dayKey(period.start) > todayKey ? dayKey(period.start) : todayKey
    const endKey = dayKey(period.end)
    const byHouse: Record<string, number> = {}
    houseSlugs.forEach((slug) => (byHouse[slug] = 0))
    const startsToday = firstKey === todayKey && dayKey(period.start) < todayKey
    if (firstKey > endKey) return { total: 0, byHouse, startsToday: false }

    // Nights held by a confirmed booking, per house (overlaps count once)
    const taken = new Map<string, Set<string>>(houseSlugs.map((slug) => [slug, new Set<string>()]))
    for (const booking of bookings) {
        if (booking.status !== "confirmed") continue
        const held = taken.get(booking.house)
        if (!held) continue
        const checkIn = parseISO(booking.checkIn)
        const stay = differenceInCalendarDays(parseISO(booking.checkOut), checkIn)
        for (let i = 0; i < stay; i++) {
            const key = dayKey(addDays(checkIn, i))
            if (key >= firstKey && key <= endKey) held.add(key)
        }
    }

    const nights = differenceInCalendarDays(parseISO(endKey), parseISO(firstKey)) + 1
    let total = 0
    for (const slug of houseSlugs) {
        byHouse[slug] = nights - (taken.get(slug)?.size ?? 0)
        total += byHouse[slug]
    }
    return { total, byHouse, startsToday }
}

// The stipend the business pays us each calendar month, counted as a cost
// when the Earnings page is switched to "after stipend".
export const MONTHLY_STIPEND_RWF = 350_000

// The stipend falling inside a period (inclusive dates): a whole month counts
// in full, part of a month counts for the share of its days that are in the
// period. Rounded to whole RWF. `monthly` is one amount for every month, or
// the amount for a given month ("yyyy-MM") when some months differ.
export function stipendForPeriod(
    start: Date,
    end: Date,
    monthly: number | ((month: string) => number) = MONTHLY_STIPEND_RWF
): number {
    if (end < start) return 0
    let sum = 0
    for (const month of eachMonthOfInterval({ start, end })) {
        const amount = typeof monthly === "number" ? monthly : monthly(format(month, "yyyy-MM"))
        const first = startOfMonth(month)
        const last = endOfMonth(month)
        const from = start > first ? start : first
        const to = end < last ? end : last
        const days = differenceInCalendarDays(to, from) + 1
        const inMonth = differenceInCalendarDays(last, first) + 1
        sum += (amount * days) / inMonth
    }
    return Math.round(sum)
}
