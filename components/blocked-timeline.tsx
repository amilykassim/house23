"use client"

import Link from "next/link"
import { differenceInCalendarDays, format, parseISO } from "date-fns"
import { Lock, Unlock } from "lucide-react"
import type { BlockedRun } from "@/lib/date-ranges"

// The admin calendar's list of blocked nights from today on, as a timeline
// grouped by month. Nights held by a confirmed booking say whose they are and
// can't be unblocked from here; nights blocked by hand can.

const day = (key: string) => parseISO(key)
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`

function rangeText(run: BlockedRun, today: string) {
    const from = run.start === today && run.startedOn ? "Today" : format(day(run.start), "EEE d MMM")
    if (run.start === run.end) return from === "Today" ? "Today" : from
    const sameMonth = run.start.slice(0, 7) === run.end.slice(0, 7)
    const to = format(day(run.end), "EEE d MMM")
    if (from === "Today") return `Today → ${to}`
    return sameMonth ? `${format(day(run.start), "EEE d")} → ${to}` : `${from} → ${to}`
}

function whenText(run: BlockedRun, today: string) {
    const until = differenceInCalendarDays(day(run.start), day(today))
    if (until <= 0) return "Now"
    if (until === 1) return "Tomorrow"
    return `in ${until} days`
}

export function BlockedTimeline({
    houseName,
    runs,
    today,
    bookingName,
    leaving,
    onUnblock,
}: {
    houseName: string
    runs: BlockedRun[]
    today: string
    /** The guest of a booking id, for nights a booking holds */
    bookingName: (id: string) => string
    /** The run (by start) folding away after Unblock */
    leaving: string | null
    onUnblock: (run: BlockedRun) => void
}) {
    const nights = runs.reduce((sum, r) => sum + r.days, 0)
    const thisYear = today.slice(0, 4)
    const groups: { month: string; runs: BlockedRun[] }[] = []
    for (const run of runs) {
        const month = format(day(run.start), run.start.slice(0, 4) === thisYear ? "MMMM" : "MMMM yyyy")
        const last = groups[groups.length - 1]
        if (last && last.month === month) last.runs.push(run)
        else groups.push({ month, runs: [run] })
    }

    if (runs.length === 0) {
        return (
            <section aria-label={`Blocked for ${houseName}`} className="m-rise rounded-[20px] border border-border bg-card px-5 sm:px-6 py-5 flex items-center gap-4">
                <div aria-hidden="true" className="w-11 h-11 shrink-0 rounded-full bg-[#F7F7F7] flex items-center justify-center">
                    <Lock className="h-[18px] w-[18px] text-muted-foreground" />
                </div>
                <div className="flex flex-col gap-0.5">
                    <span className="text-[15px] font-bold text-foreground">Nothing blocked from today on</span>
                    <span className="text-[13px] text-muted-foreground">Every night of {houseName} is open to guests. Pick dates above to block them.</span>
                </div>
            </section>
        )
    }

    let index = 0
    return (
        <section aria-labelledby="blocked-dates" className="m-card rounded-[20px] border border-border bg-card overflow-hidden">
            <div className="px-5 sm:px-6 pt-5 pb-4 flex flex-wrap items-end justify-between gap-3 border-b border-border">
                <div className="flex flex-col gap-0.5">
                    <h3 id="blocked-dates" className="text-[17px] font-bold tracking-[-0.01em] text-foreground">
                        Blocked for {houseName}
                    </h3>
                    <span className="text-[13px] text-muted-foreground">From today on · past nights are hidden</span>
                </div>
                <span className="text-[13px] font-semibold text-muted-foreground tabular-nums">
                    {plural(runs.length, "stretch").replace("stretchs", "stretches")} · {plural(nights, "night")}
                </span>
            </div>
            {groups.map((group) => (
                <div key={group.month}>
                    <div className="px-5 sm:px-6 pt-3.5 pb-1.5 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">{group.month}</div>
                    <ul>
                        {group.runs.map((run) => {
                            const now = run.start <= today
                            const booked = run.owner !== null
                            const crossesMonth = run.start.slice(0, 7) !== run.end.slice(0, 7)
                            const sub = [
                                booked ? `Booked by ${bookingName(run.owner as string)}` : null,
                                run.startedOn ? `${plural(run.days, "night")} left` : plural(run.days, "night"),
                                run.startedOn ? `started ${format(day(run.startedOn), "EEE d MMM")}` : null,
                                crossesMonth ? `runs into ${format(day(run.end), "MMMM")}` : null,
                            ]
                                .filter(Boolean)
                                .join(" · ")
                            const delay = `${Math.min(index++, 10) * 45}ms`
                            return (
                                <li
                                    key={run.start}
                                    className={`m-row px-4 sm:px-6 py-2.5 flex items-center gap-3 sm:gap-4 ${leaving === run.start ? "m-fold-away" : "m-rise"}`}
                                    style={{ animationDelay: leaving === run.start ? undefined : delay }}
                                >
                                    <div
                                        aria-hidden="true"
                                        className={`w-12 shrink-0 rounded-xl py-1.5 flex flex-col items-center leading-none ${now ? "bg-foreground text-background" : "bg-[#F7F7F7] text-foreground"}`}
                                    >
                                        <span className="text-[17px] font-bold">{format(day(run.start), "d")}</span>
                                        <span className="mt-1 text-[11px] font-semibold uppercase tracking-wide opacity-75">{format(day(run.start), "MMM")}</span>
                                    </div>
                                    <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                                        <span className="text-[15px] font-semibold text-foreground">{rangeText(run, today)}</span>
                                        <span className="text-[13px] text-muted-foreground [overflow-wrap:anywhere]">{sub}</span>
                                    </div>
                                    <span
                                        className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${now ? "bg-foreground text-background" : "bg-[#F2F2F2] text-[#555555]"}`}
                                    >
                                        {whenText(run, today)}
                                    </span>
                                    {booked ? (
                                        <Link
                                            href="/admin/bookings"
                                            className="m-quiet shrink-0 min-h-10 px-3 rounded-full flex items-center text-[13px] font-semibold text-foreground hover:bg-[#F2F2F2]"
                                        >
                                            View booking
                                        </Link>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => onUnblock(run)}
                                            disabled={leaving !== null}
                                            aria-label={`Unblock ${rangeText(run, today)}`}
                                            className="m-quiet shrink-0 min-h-10 px-3 rounded-full flex items-center gap-1.5 text-[13px] font-semibold text-foreground hover:bg-[#F2F2F2]"
                                        >
                                            <Unlock className="h-3.5 w-3.5" />
                                            Unblock
                                        </button>
                                    )}
                                </li>
                            )
                        })}
                    </ul>
                </div>
            ))}
            <div className="h-2.5" />
        </section>
    )
}
