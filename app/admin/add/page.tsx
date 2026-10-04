"use client"

import { useCallback, useEffect, useState } from "react"
import { addDays, differenceInCalendarDays, parseISO } from "date-fns"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { houses } from "@/lib/houses"
import { SegmentedControl } from "@/components/segmented-control"
import { DateRangePicker, dayKey, dayLabel } from "@/components/date-range-picker"
import { ADMIN_NIGHTLY_PRICE_RWF, USD_TO_RWF } from "@/lib/currency"
import { usePolling } from "@/lib/use-polling"

export default function AdminAddBookingPage() {
    const [house, setHouse] = useState(houses[0].slug)
    const [checkIn, setCheckIn] = useState<string | null>(null)
    const [checkOut, setCheckOut] = useState<string | null>(null)
    // Amount paid, in RWF
    const [amount, setAmount] = useState("")
    const [unavailable, setUnavailable] = useState<Set<string>>(new Set())
    const [saving, setSaving] = useState(false)
    // Bumped to close the calendar and start the date cards afresh
    const [pickerKey, setPickerKey] = useState(0)

    // Taken nights for the selected house. From today on: admin blocks,
    // confirmed bookings and Airbnb. In the past only a confirmed booking
    // counts, so a stay that already happened can still be recorded late.
    const fetchUnavailable = useCallback(async () => {
        const [blocked, airbnb, confirmed] = await Promise.all([
            fetch(`/api/blocked-dates?house=${house}`).then((r) => r.json()).catch(() => ({ dates: [] })),
            fetch(`/api/airbnb-sync?house=${house}`).then((r) => r.json()).catch(() => ({ dates: [] })),
            fetch(`/api/bookings?house=${house}&status=confirmed`).then((r) => r.json()).catch(() => ({ bookings: [] })),
        ])
        const today = dayKey(new Date())
        const taken = new Set<string>()
        for (const date of [...(blocked.dates || []), ...(airbnb.dates || [])] as string[]) {
            if (date >= today) taken.add(date)
        }
        for (const booking of (confirmed.bookings || []) as { checkIn: string; checkOut: string }[]) {
            const nights = differenceInCalendarDays(parseISO(booking.checkOut), parseISO(booking.checkIn))
            for (let i = 0; i < nights; i++) taken.add(dayKey(addDays(parseISO(booking.checkIn), i)))
        }
        setUnavailable(taken)
    }, [house])

    useEffect(() => {
        setUnavailable(new Set())
        fetchUnavailable()
    }, [fetchUnavailable])

    usePolling(fetchUnavailable, 5_000)

    const nights = checkIn && checkOut ? differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn)) : 0
    const setPriceRwf = nights * ADMIN_NIGHTLY_PRICE_RWF
    const paid = Number(amount)
    const canSave = nights > 0 && paid > 0 && !saving

    const resetDates = () => {
        setCheckIn(null)
        setCheckOut(null)
        setPickerKey((k) => k + 1)
    }

    const pickHouse = (slug: string) => {
        setHouse(slug)
        resetDates()
    }

    const handleSave = async () => {
        if (!canSave || !checkIn || !checkOut) return
        setSaving(true)
        try {
            const res = await fetch("/api/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    manual: true,
                    house,
                    houseName: houses.find((h) => h.slug === house)?.name,
                    checkIn,
                    checkOut,
                    totalRwf: paid,
                    pricePerNight: Math.round((ADMIN_NIGHTLY_PRICE_RWF / USD_TO_RWF) * 100) / 100,
                    cleaningFee: 0,
                }),
            })
            if (res.status === 409) {
                toast.error("Those dates were just taken", { description: "Pick different dates and try again." })
                setCheckOut(null)
                fetchUnavailable()
                return
            }
            if (!res.ok) throw new Error("Request failed")
            toast.success("Booking saved", {
                description: `${dayLabel(checkIn)} to ${dayLabel(checkOut)} · dates blocked on the website`,
            })
            resetDates()
            setAmount("")
            fetchUnavailable()
        } catch {
            toast.error("Couldn't save the booking", { description: "Nothing was recorded. Try again." })
        } finally {
            setSaving(false)
        }
    }

    return (
        // zoom scales the whole page down a notch on every screen size
        <div className="[zoom:0.88] px-4 pt-7 sm:pt-12 pb-14 max-w-[592px] mx-auto flex flex-col gap-6 sm:gap-7">
            <h1 className="text-[28px] sm:text-[34px] leading-tight font-bold tracking-[-0.02em] text-foreground">
                Add a booking
            </h1>

            {/* House */}
            <SegmentedControl
                className="self-start"
                itemClassName="px-[22px]"
                options={houses.map((h) => ({ id: h.slug, label: h.name }))}
                value={house}
                onChange={pickHouse}
            />

            {/* Dates */}
            <DateRangePicker
                key={pickerKey}
                startLabel="Check-in"
                endLabel="Check-out"
                start={checkIn}
                end={checkOut}
                onChange={(start, end) => {
                    setCheckIn(start)
                    setCheckOut(end)
                }}
                unavailable={unavailable}
                summary={
                    <p className="text-[15px] text-muted-foreground">
                        {nights > 0 && checkIn && checkOut
                            ? `${dayLabel(checkIn)} to ${dayLabel(checkOut)} · ${nights} night${nights === 1 ? "" : "s"}`
                            : "Tap a card to pick the dates."}
                    </p>
                }
            />

            {/* Amount */}
            <div className="flex flex-col gap-4">
                <label className="rounded-2xl border border-[#B0B0B0] bg-card px-5 py-[18px] flex flex-col gap-0.5 focus-within:border-foreground focus-within:ring-1 focus-within:ring-foreground">
                    <span className="text-[13px] font-semibold text-muted-foreground">Amount paid</span>
                    <input
                        type="number"
                        min="0"
                        inputMode="numeric"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0"
                        className="w-full bg-transparent text-[34px] sm:text-[40px] leading-tight font-semibold text-foreground placeholder:text-[#B0B0B0] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <span className="text-[13px] text-muted-foreground">RWF</span>
                </label>
                <div>
                    <button
                        type="button"
                        onClick={() => nights > 0 && setAmount(String(setPriceRwf))}
                        disabled={nights === 0}
                        className="min-h-11 px-4 rounded-full border border-[#B0B0B0] bg-card text-sm font-semibold text-foreground hover:bg-[#F7F7F7] disabled:hover:bg-card"
                    >
                        {nights > 0
                            ? `Use the set price · ${nights} × ${ADMIN_NIGHTLY_PRICE_RWF.toLocaleString("en-US")} RWF`
                            : "Pick the dates to see the set price"}
                    </button>
                </div>
            </div>

            <div className="border-t border-[#EBEBEB] pt-4 flex justify-between gap-4 text-[15px]">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold text-foreground text-right">
                    {paid > 0 ? `${paid.toLocaleString("en-US")} RWF` : "needs an amount"}
                </span>
            </div>

            <button
                type="button"
                onClick={handleSave}
                disabled={!canSave}
                className="min-h-13 rounded-xl bg-primary text-primary-foreground text-base font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-45 disabled:hover:bg-primary"
            >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save booking
            </button>
        </div>
    )
}
