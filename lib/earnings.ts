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
    capacity: number
    bookings: number
    byHand: number
    averageStay: number
    leadDays: number | null // website bookings only
    byHouse: Record<string, { total: number; nights: number }>
    weekdays: number[] // Monday first
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
 * Only confirmed bookings count as earned.
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
        byHouse[slug] = { total: 0, nights: 0 }
    })
    const weekdays = [0, 0, 0, 0, 0, 0, 0]

    let total = 0
    let totalUsd = 0
    let nights = 0
    let bookingCount = 0
    let byHand = 0
    let stayNights = 0
    let leadSum = 0
    let leadCount = 0

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
        let touches = false

        for (let i = 0; i < stay; i++) {
            const night = addDays(checkIn, i)
            const key = dayKey(night)
            if (key >= previousStartKey && key <= previousEndKey) previousTotal += perNight
            if (key < startKey || key > endKey) continue

            touches = true
            total += perNight
            totalUsd += perNightUsd
            nights += 1
            weekdays[(night.getDay() + 6) % 7] += perNight

            const house = (byHouse[booking.house] ??= { total: 0, nights: 0 })
            house.total += perNight
            house.nights += 1

            const index = bucketIndex.get(byDay ? key : key.slice(0, 7))
            if (index !== undefined) {
                const bucket = buckets[index]
                bucket.byHouse[booking.house] = (bucket.byHouse[booking.house] || 0) + perNight
                bucket.total += perNight
            }
        }

        if (!touches) continue
        bookingCount += 1
        stayNights += stay
        if (booking.source === "manual") {
            byHand += 1
        } else {
            const lead = differenceInCalendarDays(checkIn, parseISO(booking.createdAt))
            if (lead >= 0) {
                leadSum += lead
                leadCount += 1
            }
        }
    }

    return {
        total,
        totalUsd,
        previousTotal,
        buckets,
        nights,
        capacity: days * houseSlugs.length,
        bookings: bookingCount,
        byHand,
        averageStay: bookingCount > 0 ? stayNights / bookingCount : 0,
        leadDays: leadCount > 0 ? leadSum / leadCount : null,
        byHouse,
        weekdays,
    }
}
