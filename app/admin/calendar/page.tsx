"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isBefore,
    startOfDay,
    subDays,
    parseISO,
} from "date-fns"
import { ChevronLeft, ChevronRight, Lock, Unlock, Loader2, RefreshCw, Copy, Check } from "lucide-react"
import { houses } from "@/lib/houses"
import { nightsOf, upcomingBlockedRuns, type BlockedRun } from "@/lib/date-ranges"
import { loadBookings } from "@/lib/admin-data"
import { toast } from "sonner"
import { SegmentedControl } from "@/components/segmented-control"
import { BlockedTimeline } from "@/components/blocked-timeline"
import { Skeleton, rise, undoable } from "@/components/admin-motion"

const ARROW_BUTTON =
    "w-11 h-11 shrink-0 rounded-full border border-[#B0B0B0] bg-card flex items-center justify-center text-foreground hover:bg-[#F7F7F7]"
const TEXT_LINK = "min-h-11 text-sm font-semibold text-foreground underline underline-offset-4"

// A booking as the calendar needs it: whose nights a blocked run is
interface Stay {
    id: string
    house: string
    guestName: string
    checkIn: string
    checkOut: string
    status: string
}

interface AirbnbEvent {
    start: string
    end: string
    summary: string
}

export default function AdminCalendarPage() {
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedHouse, setSelectedHouse] = useState(houses[0].slug)
    const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set())
    const [airbnbDates, setAirbnbDates] = useState<Set<string>>(new Set())
    const [airbnbEvents, setAirbnbEvents] = useState<AirbnbEvent[]>([])
    const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [copied, setCopied] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [lastSynced, setLastSynced] = useState<Date | null>(null)
    // Latest downloads of this house's export feed (by Airbnb or anything else)
    const [feedReads, setFeedReads] = useState<{ at: string; userAgent: string }[] | null>(null)
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

    const today = startOfDay(new Date())
    const todayKey = format(today, "yyyy-MM-dd")
    // Bookings, to say which blocked nights belong to a confirmed stay
    const [stays, setStays] = useState<Stay[]>([])
    // The blocked run folding away after Unblock (by its first night)
    const [leaving, setLeaving] = useState<string | null>(null)
    // Which way the month grid slides when the month changes
    const [monthDir, setMonthDir] = useState<"next" | "prev">("next")
    const houseRef = useRef(selectedHouse)
    houseRef.current = selectedHouse

    useEffect(() => {
        loadBookings<Stay>()
            .then(setStays)
            .catch(() => {})
    }, [])

    useEffect(() => {
        setMounted(true)
    }, [])

    const fetchBlockedDates = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/blocked-dates?house=${selectedHouse}`)
            const data = await res.json()
            setBlockedDates(new Set(data.dates || []))
        } catch {
            setMessage({ type: "error", text: "Failed to load blocked dates" })
        } finally {
            setLoading(false)
        }
    }, [selectedHouse])

    const fetchAirbnbDates = useCallback(async () => {
        try {
            const res = await fetch(`/api/airbnb-sync?house=${selectedHouse}`)
            const data = await res.json()
            setAirbnbDates(new Set(data.dates || []))
            setAirbnbEvents(data.events || [])
            setLastSynced(new Date())
        } catch {
            // silently fail for airbnb sync
        }
    }, [selectedHouse])

    const fetchFeedReads = useCallback(async () => {
        try {
            const res = await fetch(`/api/calendar/${selectedHouse}/reads`)
            const data = await res.json()
            setFeedReads(data.reads || [])
        } catch {
            setFeedReads(null)
        }
    }, [selectedHouse])

    useEffect(() => {
        fetchBlockedDates()
        fetchAirbnbDates()
        fetchFeedReads()
        setSelectedDates(new Set())
    }, [fetchBlockedDates, fetchAirbnbDates, fetchFeedReads])

    // No background refresh here: an open admin tab would keep the database
    // awake. "Sync now" re-reads blocked dates and Airbnb on demand.

    const handleSyncAirbnb = async () => {
        setSyncing(true)
        setMessage(null)
        try {
            await Promise.all([fetchBlockedDates(), fetchAirbnbDates(), fetchFeedReads()])
            setMessage({ type: "success", text: "Airbnb calendar synced successfully" })
        } catch {
            setMessage({ type: "error", text: "Failed to sync with Airbnb" })
        } finally {
            setSyncing(false)
        }
    }

    const icalExportUrl = mounted
        ? `${window.location.origin}/api/calendar/${selectedHouse}/ical`
        : ""

    const copyIcalUrl = () => {
        navigator.clipboard.writeText(icalExportUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const toggleDate = (dateStr: string, date: Date) => {
        if (isBefore(date, today)) return
        setSelectedDates((prev) => {
            const next = new Set(prev)
            if (next.has(dateStr)) {
                next.delete(dateStr)
            } else {
                next.add(dateStr)
            }
            return next
        })
    }

    const handleBlockDates = async () => {
        if (selectedDates.size === 0) return
        setSaving(true)
        setMessage(null)
        try {
            const res = await fetch("/api/blocked-dates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    house: selectedHouse,
                    dates: Array.from(selectedDates),
                    action: "block",
                }),
            })
            const data = await res.json()
            setBlockedDates(new Set(data.dates || []))
            setSelectedDates(new Set())
            setMessage({ type: "success", text: `${selectedDates.size} date(s) blocked` })
        } catch {
            setMessage({ type: "error", text: "Failed to block dates" })
        } finally {
            setSaving(false)
        }
    }

    const handleUnblockDates = async () => {
        if (selectedDates.size === 0) return
        setSaving(true)
        setMessage(null)
        try {
            const res = await fetch("/api/blocked-dates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    house: selectedHouse,
                    dates: Array.from(selectedDates),
                    action: "unblock",
                }),
            })
            const data = await res.json()
            setBlockedDates(new Set(data.dates || []))
            setSelectedDates(new Set())
            setMessage({ type: "success", text: `${selectedDates.size} date(s) unblocked` })
        } catch {
            setMessage({ type: "error", text: "Failed to unblock dates" })
        } finally {
            setSaving(false)
        }
    }

    const selectAllBlockedInMonth = () => {
        const monthStart = startOfMonth(currentMonth)
        const monthEnd = endOfMonth(currentMonth)
        const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
        const newSelected = new Set(selectedDates)
        days.forEach((day) => {
            const dateStr = format(day, "yyyy-MM-dd")
            if (blockedDates.has(dateStr) && !isBefore(day, today)) {
                newSelected.add(dateStr)
            }
        })
        setSelectedDates(newSelected)
    }

    const clearSelection = () => setSelectedDates(new Set())

    // Calendar grid
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calendarStart = startOfWeek(monthStart)
    const calendarEnd = endOfWeek(monthEnd)
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    const selectedHouseData = houses.find((h) => h.slug === selectedHouse)

    const dayOf = (key: string) => new Date(key + "T00:00:00")

    // Confirmed stays of this house, night by night
    const stayByNight = useMemo(() => {
        const map = new Map<string, Stay>()
        for (const stay of stays) {
            if (stay.house !== selectedHouse || stay.status !== "confirmed") continue
            for (const night of nightsOf({ start: stay.checkIn, end: format(subDays(parseISO(stay.checkOut), 1), "yyyy-MM-dd") })) {
                map.set(night, stay)
            }
        }
        return map
    }, [stays, selectedHouse])
    const runs = upcomingBlockedRuns(blockedDates, todayKey, (night) => stayByNight.get(night)?.id ?? null)
    const bookingName = (id: string) => stays.find((s) => s.id === id)?.guestName || "a guest"

    // Unblock a run blocked by hand: it leaves the list at once, and the
    // request goes out when the Undo toast runs out
    const unblockRun = (run: BlockedRun) => {
        const house = selectedHouse
        const houseName = selectedHouseData?.name ?? house
        const nights = nightsOf(run)
        const putBack = () => {
            if (houseRef.current !== house) return
            setBlockedDates((prev) => new Set([...Array.from(prev), ...nights]))
        }
        setLeaving(run.start)
        setTimeout(() => {
            setLeaving(null)
            setBlockedDates((prev) => new Set(Array.from(prev).filter((d) => !nights.includes(d))))
            setSelectedDates((prev) => new Set(Array.from(prev).filter((d) => !nights.includes(d))))
            undoable({
                title: `Unblocked ${nights.length} night${nights.length === 1 ? "" : "s"}`,
                description: `${format(dayOf(run.start), "EEE d MMM")}${run.days > 1 ? ` → ${format(dayOf(run.end), "EEE d MMM")}` : ""} · ${houseName}`,
                undo: putBack,
                send: () => {
                    fetch("/api/blocked-dates", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ house, dates: nights, action: "unblock" }),
                        keepalive: true,
                    })
                        .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Request failed"))))
                        .then((data) => {
                            if (houseRef.current === house) setBlockedDates(new Set(data.dates || []))
                        })
                        .catch(() => {
                            putBack()
                            toast.error("Couldn't unblock the nights", { description: "They are still blocked. Try again." })
                        })
                },
            })
        }, 300)
    }

    return (
        // zoom scales the whole page down a notch on every screen size
        <div className="[zoom:0.88] px-4 pt-7 sm:pt-12 pb-14 max-w-[1120px] mx-auto flex flex-col gap-6 sm:gap-7">
            <h1 {...rise(0)} className="m-rise text-[28px] sm:text-[34px] leading-tight font-bold tracking-[-0.02em] text-foreground">Calendar</h1>

            {/* House Selector */}
            <div {...rise(1)} className="m-rise self-start max-w-full">
                <SegmentedControl
                    className="max-w-full"
                    itemClassName="px-[22px]"
                    options={houses.map((h) => ({ id: h.slug, label: h.name }))}
                    value={selectedHouse}
                    onChange={setSelectedHouse}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                <div {...rise(2)} className="m-rise min-w-0 lg:col-span-3 flex flex-col gap-6">
                    {/* Calendar Card */}
                    <section aria-label={`${selectedHouseData?.name} calendar`} className="m-card rounded-[20px] border border-border bg-card p-4 sm:p-6 flex flex-col gap-4">
                        {/* Month Navigation */}
                        <div className="flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => {
                                    setMonthDir("prev")
                                    setCurrentMonth(subMonths(currentMonth, 1))
                                }}
                                aria-label="Previous month"
                                className={ARROW_BUTTON}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <h2 className="text-xl font-bold tracking-[-0.02em] text-foreground">{format(currentMonth, "MMMM yyyy")}</h2>
                            <button
                                type="button"
                                onClick={() => {
                                    setMonthDir("next")
                                    setCurrentMonth(addMonths(currentMonth, 1))
                                }}
                                aria-label="Next month"
                                className={ARROW_BUTTON}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-7 gap-1 sm:gap-1.5" aria-label="Loading the calendar">
                                {Array.from({ length: 35 }, (_, i) => (
                                    <Skeleton key={i} className="h-12 sm:h-[60px] rounded-xl" />
                                ))}
                            </div>
                        ) : (
                            <div key={format(currentMonth, "yyyy-MM")} className={`flex flex-col gap-2 ${monthDir === "next" ? "m-in-next" : "m-in-prev"}`}>
                                {/* Weekday Headers */}
                                <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                                    {weekDays.map((day) => (
                                        <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-1">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Days Grid */}
                                <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                                    {calendarDays.map((day) => {
                                        const dateStr = format(day, "yyyy-MM-dd")
                                        const isCurrentMonth = isSameMonth(day, currentMonth)
                                        const isToday = isSameDay(day, today)
                                        const isPast = isBefore(day, today)
                                        const isBlocked = blockedDates.has(dateStr)
                                        const isAirbnb = airbnbDates.has(dateStr)
                                        const isSelected = selectedDates.has(dateStr)
                                        const isOpen = isCurrentMonth && !isPast && !isAirbnb

                                        return (
                                            <button
                                                key={dateStr}
                                                type="button"
                                                onClick={() => toggleDate(dateStr, day)}
                                                disabled={!isCurrentMonth || isPast || isAirbnb}
                                                aria-pressed={isOpen ? isSelected : undefined}
                                                title={isAirbnb ? "Booked on Airbnb" : isBlocked ? "Manually blocked" : undefined}
                                                className={`
                        h-12 sm:h-[60px] flex items-center justify-center text-[15px] rounded-xl border transition-colors
                        ${!isCurrentMonth ? "invisible" : ""}
                        ${isPast && isCurrentMonth ? "border-transparent text-[#8A8A8A] cursor-not-allowed" : ""}
                        ${isAirbnb && isCurrentMonth && !isPast ? "border-primary bg-[#F6D5D2] text-[#7A2A25] font-bold cursor-not-allowed" : ""}
                        ${isOpen && !isBlocked && !isSelected ? "border-[#DDDDDD] bg-card text-foreground font-semibold hover:bg-[#F7F7F7] cursor-pointer" : ""}
                        ${isOpen && isBlocked && !isSelected ? "border-foreground bg-foreground text-background font-bold" : ""}
                        ${isOpen && isSelected && isBlocked ? "border-foreground bg-foreground text-background font-bold ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}
                        ${isOpen && isSelected && !isBlocked ? "border-foreground bg-card text-foreground font-bold ring-1 ring-foreground" : ""}
                        ${isToday && !isSelected && !isBlocked && !isAirbnb ? "underline underline-offset-4" : ""}
                      `}
                                            >
                                                {isCurrentMonth && format(day, "d")}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Legend */}
                        <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <div className="w-3.5 h-3.5 rounded bg-foreground" />
                                <span>Manually blocked</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3.5 h-3.5 rounded bg-[#F6D5D2] border border-primary" />
                                <span>Booked on Airbnb</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3.5 h-3.5 rounded border-2 border-foreground" />
                                <span>Selected to block</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3.5 h-3.5 rounded bg-foreground ring-2 ring-primary ring-offset-1 ring-offset-background" />
                                <span>Selected to unblock</span>
                            </div>
                        </div>

                        {/* Action Bar */}
                        <div className="pt-4 border-t border-[#EBEBEB] flex flex-col gap-3">
                            {message && (
                                <div
                                    role="status"
                                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold ${message.type === "success"
                                        ? "bg-[#DCFCE7] text-[#166534]"
                                        : "bg-[#FEE2E2] text-[#991B1B]"
                                        }`}
                                >
                                    {message.text}
                                </div>
                            )}

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                <div className="text-[15px] font-semibold text-foreground mr-auto">
                                    {selectedDates.size > 0
                                        ? `${selectedDates.size} date${selectedDates.size > 1 ? "s" : ""} selected`
                                        : "Click dates to select them"}
                                </div>

                                <button type="button" onClick={selectAllBlockedInMonth} className={TEXT_LINK}>
                                    Select all blocked
                                </button>

                                {selectedDates.size > 0 && (
                                    <button type="button" onClick={clearSelection} className={TEXT_LINK}>
                                        Clear selection
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={handleBlockDates}
                                    disabled={selectedDates.size === 0 || saving}
                                    className="min-h-12 rounded-xl bg-primary text-primary-foreground text-[15px] font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-45 disabled:hover:bg-primary"
                                >
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                                    Block dates
                                </button>
                                <button
                                    type="button"
                                    onClick={handleUnblockDates}
                                    disabled={selectedDates.size === 0 || saving}
                                    className="min-h-12 rounded-xl border border-[#B0B0B0] bg-card text-foreground text-[15px] font-semibold flex items-center justify-center gap-2 hover:bg-[#F7F7F7] transition-colors disabled:opacity-45 disabled:hover:bg-card"
                                >
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlock className="h-4 w-4" />}
                                    Unblock dates
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Blocked nights from today on */}
                    {!loading && (
                        <BlockedTimeline
                            houseName={selectedHouseData?.name ?? selectedHouse}
                            runs={runs}
                            today={todayKey}
                            bookingName={bookingName}
                            leaving={leaving}
                            onUnblock={unblockRun}
                        />
                    )}
                </div>

                {/* Airbnb Sync Section */}
                <section aria-labelledby="airbnb-sync" {...rise(3)} className="m-rise m-card min-w-0 lg:col-span-2 rounded-[20px] border border-border bg-card p-5 sm:p-6 flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-3">
                            <h3 id="airbnb-sync" className="text-[17px] font-bold tracking-[-0.01em] text-foreground">
                                Airbnb Calendar Sync
                            </h3>
                            <button
                                type="button"
                                onClick={handleSyncAirbnb}
                                disabled={syncing}
                                className="shrink-0 min-h-11 px-4 rounded-full border border-foreground bg-card text-sm font-semibold text-foreground flex items-center gap-2 hover:bg-[#F7F7F7] disabled:opacity-45"
                            >
                                <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
                                {syncing ? "Syncing..." : "Sync now"}
                            </button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Airbnb bookings are imported automatically and shown in red on the calendar. Press Sync now to refresh.
                            {lastSynced && <span className="block mt-1 text-[13px]">Last synced {format(lastSynced, "HH:mm:ss")}</span>}
                        </p>
                    </div>

                    {/* iCal Export URL */}
                    <div className="pt-5 border-t border-[#EBEBEB] flex flex-col gap-2">
                        <h4 className="text-[13px] font-semibold text-muted-foreground">Export to Airbnb</h4>
                        <p className="text-[13px] text-muted-foreground">
                            Copy this URL and paste it into Airbnb → Your Listing → Availability → Calendar → Import calendar. Airbnb
                            will periodically fetch your blocked dates.
                        </p>
                        <div className="px-3.5 py-3 bg-[#F7F7F7] rounded-xl text-[13px] font-mono text-foreground [overflow-wrap:anywhere]">
                            {icalExportUrl || "Loading..."}
                        </div>
                        <button
                            type="button"
                            onClick={copyIcalUrl}
                            className="self-start min-h-11 px-4 rounded-full border border-[#B0B0B0] bg-card text-sm font-semibold text-foreground flex items-center gap-2 hover:bg-[#F7F7F7]"
                        >
                            {copied ? (
                                <>
                                    <Check className="h-3.5 w-3.5" />
                                    Copied
                                </>
                            ) : (
                                <>
                                    <Copy className="h-3.5 w-3.5" />
                                    Copy URL
                                </>
                            )}
                        </button>
                    </div>

                    {feedReads && (
                        <div className="pt-5 border-t border-[#EBEBEB] flex flex-col gap-2 text-[13px] text-muted-foreground">
                            {feedReads.length === 0 ? (
                                <p>
                                    Nothing has read this calendar yet. If Airbnb has not read it within a few hours, the import on
                                    Airbnb is missing or uses a different URL.
                                </p>
                            ) : (
                                <>
                                    <h4 className="font-semibold">Last read by</h4>
                                    <ul className="flex flex-col gap-1">
                                        {feedReads.map((read) => (
                                            <li key={read.at} className="truncate">
                                                <span className="font-semibold text-foreground">{format(new Date(read.at), "EEE d MMM, HH:mm")}</span> ·{" "}
                                                {read.userAgent}
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </div>
                    )}

                    {/* Airbnb Bookings */}
                    {airbnbEvents.length > 0 && (
                        <div className="pt-5 border-t border-[#EBEBEB] flex flex-col gap-2">
                            <h4 className="text-[13px] font-semibold text-muted-foreground">Airbnb bookings ({airbnbEvents.length})</h4>
                            {airbnbEvents.map((event, idx) => (
                                <div key={idx} className="px-4 py-3 rounded-xl bg-[#F7F7F7] flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
                                    <span className="text-[15px] font-semibold text-foreground">
                                        {format(dayOf(event.start), "MMM d")} → {format(dayOf(event.end), "MMM d, yyyy")}
                                    </span>
                                    <span className="text-[13px] text-muted-foreground">{event.summary}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    )
}
