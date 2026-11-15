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

/** A stretch of blocked nights from today on, for the calendar's list. */
export interface BlockedRun extends DateRange {
    /** What holds the nights: a booking id, or null when blocked by hand */
    owner: string | null
    /** The first night when the run began before today (it is shown from today), else null */
    startedOn: string | null
}

const dayAfter = (key: string) => new Date(toUtc(key) + DAY_MS).toISOString().slice(0, 10)
const daysBetween = (from: string, to: string) => Math.round((toUtc(to) - toUtc(from)) / DAY_MS)

/**
 * Blocked nights from `today` on, as runs of consecutive nights held by the
 * same owner (one booking, or blocked by hand). A run that began before today
 * starts at today and remembers where it began; runs that ended are left out.
 */
export function upcomingBlockedRuns(dates: Iterable<string>, today: string, ownerOf: (day: string) => string | null = () => null): BlockedRun[] {
    const days = Array.from(new Set(dates))
        .filter((key) => /^\d{4}-\d{2}-\d{2}$/.test(key) && !Number.isNaN(toUtc(key)))
        .sort()
    const runs: BlockedRun[] = []
    for (const day of days) {
        const owner = ownerOf(day)
        const last = runs[runs.length - 1]
        if (last && dayAfter(last.end) === day && last.owner === owner) {
            last.end = day
            last.days += 1
        } else {
            runs.push({ start: day, end: day, days: 1, owner, startedOn: null })
        }
    }
    return runs
        .filter((run) => run.end >= today)
        .map((run) =>
            run.start >= today ? run : { ...run, startedOn: run.start, start: today, days: daysBetween(today, run.end) + 1 }
        )
}

/** Every night of a run, first to last. */
export function nightsOf(run: Pick<DateRange, "start" | "end">): string[] {
    const nights: string[] = []
    for (let day = run.start; day <= run.end; day = dayAfter(day)) nights.push(day)
    return nights
}

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
