"use client"

import { useState, useEffect, useCallback } from "react"
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
} from "date-fns"
import { ChevronLeft, ChevronRight, Lock, Unlock, Loader2, RefreshCw, Copy, Check, ExternalLink, Link2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { houses } from "@/lib/houses"

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
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

    const today = startOfDay(new Date())

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
        } catch {
            // silently fail for airbnb sync
        }
    }, [selectedHouse])

    useEffect(() => {
        fetchBlockedDates()
        fetchAirbnbDates()
        setSelectedDates(new Set())
    }, [fetchBlockedDates, fetchAirbnbDates])

    const handleSyncAirbnb = async () => {
        setSyncing(true)
        setMessage(null)
        try {
            await fetchAirbnbDates()
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

    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-10">
                    <h1 className="font-serif text-3xl font-semibold text-foreground mb-2">
                        Manage Calendar
                    </h1>
                    <p className="text-muted-foreground">
                        Block or unblock dates for your properties. Blocked dates will be unavailable for booking.
                    </p>
                </div>

                {/* House Selector */}
                <div className="flex gap-3 mb-8">
                    {houses.map((house) => (
                        <button
                            key={house.slug}
                            onClick={() => setSelectedHouse(house.slug)}
                            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${selectedHouse === house.slug
                                ? "bg-foreground text-background"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                                }`}
                        >
                            {house.name}
                        </button>
                    ))}
                </div>

                {/* Calendar Card */}
                <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                        <button
                            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                            className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                        >
                            <ChevronLeft className="h-5 w-5 text-foreground" />
                        </button>
                        <h2 className="text-lg font-semibold text-foreground">
                            {format(currentMonth, "MMMM yyyy")}
                        </h2>
                        <button
                            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                            className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                        >
                            <ChevronRight className="h-5 w-5 text-foreground" />
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="p-6">
                            {/* Weekday Headers */}
                            <div className="grid grid-cols-7 mb-2">
                                {weekDays.map((day) => (
                                    <div
                                        key={day}
                                        className="text-center text-xs font-medium text-muted-foreground py-2"
                                    >
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Days Grid */}
                            <div className="grid grid-cols-7">
                                {calendarDays.map((day) => {
                                    const dateStr = format(day, "yyyy-MM-dd")
                                    const isCurrentMonth = isSameMonth(day, currentMonth)
                                    const isToday = isSameDay(day, today)
                                    const isPast = isBefore(day, today)
                                    const isBlocked = blockedDates.has(dateStr)
                                    const isAirbnb = airbnbDates.has(dateStr)
                                    const isSelected = selectedDates.has(dateStr)

                                    return (
                                        <button
                                            key={dateStr}
                                            onClick={() => toggleDate(dateStr, day)}
                                            disabled={!isCurrentMonth || isPast || isAirbnb}
                                            title={isAirbnb ? "Booked on Airbnb" : isBlocked ? "Manually blocked" : undefined}
                                            className={`
                        relative h-12 sm:h-14 flex items-center justify-center text-sm transition-all rounded-lg m-0.5
                        ${!isCurrentMonth ? "text-transparent cursor-default" : ""}
                        ${isPast && isCurrentMonth ? "text-muted-foreground/30 cursor-not-allowed" : ""}
                        ${isAirbnb && isCurrentMonth && !isPast ? "bg-orange-500/15 text-orange-600 dark:text-orange-400 font-medium cursor-not-allowed" : ""}
                        ${isCurrentMonth && !isPast && !isBlocked && !isAirbnb && !isSelected ? "text-foreground hover:bg-muted cursor-pointer" : ""}
                        ${isBlocked && isCurrentMonth && !isPast && !isSelected && !isAirbnb ? "bg-red-500/15 text-red-600 dark:text-red-400 font-medium" : ""}
                        ${isSelected && isBlocked ? "bg-red-500 text-white font-medium ring-2 ring-red-500 ring-offset-2 ring-offset-background" : ""}
                        ${isSelected && !isBlocked ? "bg-foreground text-background font-medium ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""}
                        ${isToday && !isSelected ? "ring-1 ring-foreground/30" : ""}
                      `}
                                        >
                                            {isCurrentMonth && format(day, "d")}
                                            {isBlocked && isCurrentMonth && !isPast && !isSelected && !isAirbnb && (
                                                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-red-500" />
                                            )}
                                            {isAirbnb && isCurrentMonth && !isPast && (
                                                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-orange-500" />
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Legend */}
                    <div className="px-6 pb-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-red-500/15 border border-red-500/30" />
                            <span>Manually blocked</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-orange-500/15 border border-orange-500/30" />
                            <span>Booked on Airbnb</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-foreground" />
                            <span>Selected to block</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-red-500 ring-2 ring-red-500 ring-offset-1 ring-offset-background" />
                            <span>Selected to unblock</span>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="px-6 py-4 border-t border-border bg-muted/30">
                        {message && (
                            <div
                                className={`mb-4 px-4 py-2.5 rounded-xl text-sm font-medium ${message.type === "success"
                                    ? "bg-green-500/10 text-green-700 dark:text-green-400"
                                    : "bg-red-500/10 text-red-700 dark:text-red-400"
                                    }`}
                            >
                                {message.text}
                            </div>
                        )}

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="text-sm text-muted-foreground mr-auto">
                                {selectedDates.size > 0
                                    ? `${selectedDates.size} date${selectedDates.size > 1 ? "s" : ""} selected`
                                    : "Click dates to select them"}
                            </div>

                            <button
                                onClick={selectAllBlockedInMonth}
                                className="text-sm font-medium text-foreground underline underline-offset-4 hover:text-muted-foreground transition-colors"
                            >
                                Select all blocked
                            </button>

                            {selectedDates.size > 0 && (
                                <button
                                    onClick={clearSelection}
                                    className="text-sm font-medium text-foreground underline underline-offset-4 hover:text-muted-foreground transition-colors"
                                >
                                    Clear selection
                                </button>
                            )}

                            <Button
                                onClick={handleBlockDates}
                                disabled={selectedDates.size === 0 || saving}
                                className="rounded-full px-6 gap-2"
                            >
                                {saving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Lock className="h-4 w-4" />
                                )}
                                Block dates
                            </Button>

                            <Button
                                onClick={handleUnblockDates}
                                disabled={selectedDates.size === 0 || saving}
                                variant="outline"
                                className="rounded-full px-6 gap-2 hover:bg-transparent hover:border-foreground"
                            >
                                {saving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Unlock className="h-4 w-4" />
                                )}
                                Unblock dates
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Currently Blocked Dates Summary */}
                {blockedDates.size > 0 && (
                    <div className="mt-8 bg-card rounded-2xl border border-border p-6">
                        <h3 className="font-semibold text-foreground mb-4">
                            Blocked dates for {selectedHouseData?.name}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {Array.from(blockedDates)
                                .sort()
                                .map((dateStr) => (
                                    <span
                                        key={dateStr}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-medium"
                                    >
                                        <Lock className="h-3 w-3" />
                                        {format(new Date(dateStr + "T00:00:00"), "MMM d, yyyy")}
                                    </span>
                                ))}
                        </div>
                    </div>
                )}

                {/* Airbnb Sync Section */}
                <div className="mt-8 bg-card rounded-2xl border border-border overflow-hidden">
                    <div className="p-6 border-b border-border">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-foreground flex items-center gap-2">
                                <ExternalLink className="h-4 w-4" />
                                Airbnb Calendar Sync
                            </h3>
                            <Button
                                onClick={handleSyncAirbnb}
                                disabled={syncing}
                                variant="outline"
                                size="sm"
                                className="rounded-full gap-2"
                            >
                                <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
                                {syncing ? "Syncing..." : "Sync now"}
                            </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Airbnb bookings are imported automatically and shown in orange on the calendar.
                        </p>
                    </div>

                    {/* iCal Export URL */}
                    <div className="p-6 border-b border-border">
                        <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                            <Link2 className="h-4 w-4" />
                            Export to Airbnb
                        </h4>
                        <p className="text-xs text-muted-foreground mb-3">
                            Copy this URL and paste it into Airbnb → Your Listing → Availability → Calendar → Import calendar.
                            Airbnb will periodically fetch your blocked dates.
                        </p>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 px-3 py-2 bg-muted rounded-lg text-xs font-mono text-muted-foreground truncate">
                                {icalExportUrl || "Loading..."}
                            </div>
                            <Button
                                onClick={copyIcalUrl}
                                variant="outline"
                                size="sm"
                                className="rounded-lg gap-1.5 shrink-0"
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
                            </Button>
                        </div>
                    </div>

                    {/* Airbnb Bookings */}
                    {airbnbEvents.length > 0 && (
                        <div className="p-6">
                            <h4 className="text-sm font-semibold text-foreground mb-3">
                                Airbnb bookings ({airbnbEvents.length})
                            </h4>
                            <div className="space-y-2">
                                {airbnbEvents.map((event, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-orange-500/5 border border-orange-500/10"
                                    >
                                        <span className="text-sm text-foreground">{event.summary}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {format(new Date(event.start + "T00:00:00"), "MMM d")} →{" "}
                                            {format(new Date(event.end + "T00:00:00"), "MMM d, yyyy")}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
