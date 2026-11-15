// Runs of consecutive days, for showing a long list of blocked dates as
// "13 Nov to 17 Nov" instead of one chip per day.

export interface DateRange {
    /** First day, yyyy-MM-dd */
    start: string
    /** Last day (inclusive), yyyy-MM-dd */
    end: string
    /** Days in the run */
    days: number
}

const DAY_MS = 24 * 60 * 60 * 1000
const toUtc = (key: string) => Date.parse(`${key}T00:00:00Z`)

/** Groups yyyy-MM-dd days into runs of consecutive days, earliest first. Duplicates and anything that is not a date are ignored. */
export function groupDateRanges(dates: Iterable<string>): DateRange[] {
    const days = Array.from(new Set(dates))
        .filter((key) => /^\d{4}-\d{2}-\d{2}$/.test(key) && !Number.isNaN(toUtc(key)))
        .sort()
    const ranges: DateRange[] = []
    for (const day of days) {
        const last = ranges[ranges.length - 1]
        if (last && toUtc(day) - toUtc(last.end) === DAY_MS) {
            last.end = day
            last.days += 1
        } else {
            ranges.push({ start: day, end: day, days: 1 })
        }
    }
    return ranges
}
