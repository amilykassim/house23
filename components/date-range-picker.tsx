"use client"

import { useMemo, useState, type ReactNode } from "react"
import {
    addDays,
    addMonths,
    differenceInCalendarDays,
    eachDayOfInterval,
    endOfMonth,
    format,
    parseISO,
    startOfMonth,
} from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"

export const dayKey = (d: Date) => format(d, "yyyy-MM-dd")
export const dayLabel = (key: string) => format(parseISO(key), "EEE d MMM")

export interface CalendarCell {
    key: string
    day: number
    disabled: boolean
    struck: boolean
}

// One month laid out Monday-first; null entries pad the first week.
export function monthCells(
    month: Date,
    status: (key: string) => { disabled: boolean; struck?: boolean }
): (CalendarCell | null)[] {
    const first = startOfMonth(month)
    const lead = (first.getDay() + 6) % 7
    const days = eachDayOfInterval({ start: first, end: endOfMonth(month) }).map((date) => {
        const key = dayKey(date)
        const { disabled, struck = false } = status(key)
        return { key, day: date.getDate(), disabled, struck }
    })
    return [...Array.from({ length: lead }, () => null), ...days]
}

interface CalendarPanelProps {
    prompt: string
    onClose: () => void
    month: Date
    onMonthChange: (month: Date) => void
    cells: (CalendarCell | null)[]
    /** Selected day, or the first day of the selected range */
    start: string | null
    /** Last day of the selected range, when picking a range */
    end?: string | null
    onPick: (key: string) => void
    footnote?: string
}

/** The one-month calendar card shared by every date picker in the back office. */
export function CalendarPanel({ prompt, onClose, month, onMonthChange, cells, start, end = null, onPick, footnote }: CalendarPanelProps) {
    return (
        <div className="rounded-3xl border border-border bg-card p-4 sm:p-5 shadow-[0_6px_20px_rgba(0,0,0,0.08)] flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
                <span className="text-[15px] font-semibold text-foreground">{prompt}</span>
                <button
                    type="button"
                    onClick={onClose}
                    className="min-h-11 px-2 text-sm font-semibold text-foreground underline"
                >
                    Close
                </button>
            </div>
            <div className="flex items-center justify-between gap-3">
                <button
                    type="button"
                    onClick={() => onMonthChange(addMonths(month, -1))}
                    aria-label="Previous month"
                    className="w-11 h-11 rounded-full border border-border bg-card flex items-center justify-center text-foreground hover:bg-[#F7F7F7]"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
                <h2 className="text-[17px] font-semibold text-foreground">{format(month, "MMMM yyyy")}</h2>
                <button
                    type="button"
                    onClick={() => onMonthChange(addMonths(month, 1))}
                    aria-label="Next month"
                    className="w-11 h-11 rounded-full border border-border bg-card flex items-center justify-center text-foreground hover:bg-[#F7F7F7]"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
            <div className="grid grid-cols-7 text-center text-xs font-semibold text-muted-foreground">
                {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
                    <span key={d}>{d}</span>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-y-1">
                {cells.map((cell, index) => {
                    if (!cell) return <div key={`blank-${index}`} />
                    const isStart = cell.key === start
                    const isEnd = cell.key === end
                    const inRange = !!start && !!end && cell.key >= start && cell.key <= end
                    return (
                        <div
                            key={cell.key}
                            className={`${inRange ? "bg-muted" : ""} ${isStart ? "rounded-l-full" : ""} ${isEnd ? "rounded-r-full" : ""}`}
                        >
                            <button
                                type="button"
                                onClick={() => onPick(cell.key)}
                                disabled={cell.disabled}
                                aria-label={`${dayLabel(cell.key)}${cell.struck ? ", taken" : ""}`}
                                className={`w-full h-12 rounded-full text-[15px] font-semibold ${isStart || isEnd
                                    ? "bg-foreground text-background"
                                    : cell.disabled
                                        ? `text-[#B0B0B0] ${cell.struck ? "line-through" : ""}`
                                        : "text-foreground hover:bg-[#F7F7F7]"
                                    }`}
                            >
                                {cell.day}
                            </button>
                        </div>
                    )
                })}
            </div>
            {footnote && <p className="text-[13px] text-muted-foreground">{footnote}</p>}
        </div>
    )
}

interface DateRangePickerProps {
    startLabel: string
    endLabel: string
    /** Calendar headings; default to "Pick the <label>" */
    startPrompt?: string
    endPrompt?: string
    /** "yyyy-MM-dd" or null */
    start: string | null
    end: string | null
    onChange: (start: string | null, end: string | null) => void
    /** Dates that cannot be a night of the range (shown crossed out) */
    unavailable?: Set<string>
    /** Let the range start and end on the same day */
    allowSameDay?: boolean
    /** Rendered between the two cards and the calendar */
    summary?: ReactNode
}

/**
 * Two date cards that open a one-month calendar. Opening the start card
 * always clears the end date so it is chosen again.
 */
export function DateRangePicker({
    startLabel,
    endLabel,
    startPrompt = `Pick the ${startLabel.toLowerCase()}`,
    endPrompt = `Pick the ${endLabel.toLowerCase()}`,
    start,
    end,
    onChange,
    unavailable,
    allowSameDay = false,
    summary,
}: DateRangePickerProps) {
    // Which date the open calendar is picking; null = calendar closed
    const [picking, setPicking] = useState<"start" | "end" | null>(null)
    const [month, setMonth] = useState(() => startOfMonth(start ? parseISO(start) : new Date()))

    const openStart = () => {
        if (picking === "start") {
            setPicking(null)
            return
        }
        onChange(start, null)
        setPicking("start")
        if (start) setMonth(startOfMonth(parseISO(start)))
    }

    const openEnd = () => {
        if (picking === "end") {
            setPicking(null)
            return
        }
        setPicking(start ? "end" : "start")
        const focus = end || start
        if (focus) setMonth(startOfMonth(parseISO(focus)))
    }

    const pickDay = (key: string) => {
        const beforeStart = !!start && (allowSameDay ? key < start : key <= start)
        if (picking === "start" || !start || beforeStart) {
            onChange(key, null)
            setPicking("end")
            return
        }
        onChange(start, key)
        setPicking(null)
    }

    const cells = useMemo(() => {
        // True when any night in [from, to) is unavailable
        const rangeIsTaken = (from: string, to: string) => {
            if (!unavailable) return false
            const nights = differenceInCalendarDays(parseISO(to), parseISO(from))
            for (let i = 0; i < nights; i++) {
                if (unavailable.has(dayKey(addDays(parseISO(from), i)))) return true
            }
            return false
        }

        return monthCells(month, (key) => {
            const taken = !!unavailable?.has(key)
            // The end day isn't a night, so it may fall on a taken date
            // as long as every night before it is free.
            const asEnd = picking === "end" && !!start && key > start
            const disabled = asEnd ? rangeIsTaken(start, key) : taken
            return { disabled, struck: taken && disabled }
        })
    }, [month, unavailable, picking, start])

    const cardClass = (active: boolean) =>
        `min-w-0 text-left px-3.5 sm:px-[17px] py-[15px] rounded-2xl border-2 bg-card flex flex-col gap-1.5 ${active ? "border-foreground" : "border-[#B0B0B0]"}`

    return (
        <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={openStart} aria-expanded={picking === "start"} className={cardClass(picking === "start")}>
                    <span className="text-[13px] font-semibold text-muted-foreground">{startLabel}</span>
                    <span className={`text-[17px] font-medium ${start ? "text-foreground" : "text-muted-foreground"}`}>
                        {start ? dayLabel(start) : "Add date"}
                    </span>
                </button>
                <button type="button" onClick={openEnd} aria-expanded={picking === "end"} className={cardClass(picking === "end")}>
                    <span className="text-[13px] font-semibold text-muted-foreground">{endLabel}</span>
                    <span className={`text-[17px] font-medium ${end ? "text-foreground" : "text-muted-foreground"}`}>
                        {end ? dayLabel(end) : "Add date"}
                    </span>
                </button>
            </div>
            {summary}

            {picking && (
                <CalendarPanel
                    prompt={picking === "start" ? startPrompt : endPrompt}
                    onClose={() => setPicking(null)}
                    month={month}
                    onMonthChange={setMonth}
                    cells={cells}
                    start={start}
                    end={end}
                    onPick={pickDay}
                    footnote={unavailable ? "Crossed-out dates are already taken." : undefined}
                />
            )}
        </div>
    )
}
