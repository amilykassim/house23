"use client"

import { useCallback, useEffect, useState } from "react"
import { addDays, differenceInCalendarDays, parseISO } from "date-fns"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Check, ExternalLink, Loader2, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import { houses } from "@/lib/houses"
import { SegmentedControl } from "@/components/segmented-control"
import { DateRangePicker, dayKey, dayLabel } from "@/components/date-range-picker"
import { ADMIN_NIGHTLY_PRICE_RWF, USD_TO_RWF } from "@/lib/currency"

type CheckState = "checking" | "ok" | "failed"

// What the "Booking saved" modal reports on
interface SavedBooking {
    id: string
    house: string
    houseName: string
    checkIn: string
    checkOut: string
    nights: number
    paidRwf: number
    // Nights from today on: the only ones a guest could still book
    upcoming: string[]
    // Are those nights blocked on the website?
    website: CheckState
    // Are they in the calendar feed that Airbnb imports?
    airbnbFeed: CheckState
}

// Every night covered by the events of an iCal feed (DTEND is exclusive)
function nightsInICal(ical: string): Set<string> {
    const nights = new Set<string>()
    const toKey = (d: string) => `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`
    for (const block of ical.split("BEGIN:VEVENT").slice(1)) {
        const start = block.match(/DTSTART[^:]*:(\d{8})/)
        const end = block.match(/DTEND[^:]*:(\d{8})/)
        if (!start || !end) continue
        const first = parseISO(toKey(start[1]))
        const count = differenceInCalendarDays(parseISO(toKey(end[1])), first)
        for (let i = 0; i < count; i++) nights.add(dayKey(addDays(first, i)))
    }
    return nights
}

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
    // The booking just saved, shown in the modal until it is closed
    const [saved, setSaved] = useState<SavedBooking | null>(null)

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

    // No background refresh: availability is read on load and after each save,
    // and the server checks the dates again when the booking is saved.

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

    // After a save, read back both places a guest could still book from and
    // report whether the upcoming nights are closed there.
    const verifyBlocked = async (booking: { id: string; house: string }, upcoming: string[]) => {
        const report = (patch: Partial<SavedBooking>) =>
            setSaved((current) => (current && current.id === booking.id ? { ...current, ...patch } : current))
        const covers = (nights: Set<string>): CheckState => (upcoming.every((d) => nights.has(d)) ? "ok" : "failed")

        await Promise.all([
            fetch(`/api/blocked-dates?house=${booking.house}`, { cache: "no-store" })
                .then((r) => (r.ok ? r.json() : Promise.reject()))
                .then((data) => report({ website: covers(new Set<string>(data.dates || [])) }))
                .catch(() => report({ website: "failed" })),
            fetch(`/api/calendar/${booking.house}/ical`, { cache: "no-store" })
                .then((r) => (r.ok ? r.text() : Promise.reject()))
                .then((ical) => report({ airbnbFeed: covers(nightsInICal(ical)) }))
                .catch(() => report({ airbnbFeed: "failed" })),
        ])
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
            const { booking } = await res.json()
            const today = dayKey(new Date())
            const upcoming = Array.from({ length: nights }, (_, i) => dayKey(addDays(parseISO(checkIn), i))).filter(
                (d) => d >= today
            )
            setSaved({
                id: booking.id,
                house,
                houseName: booking.houseName,
                checkIn,
                checkOut,
                nights,
                paidRwf: paid,
                upcoming,
                website: "checking",
                airbnbFeed: "checking",
            })
            if (upcoming.length > 0) verifyBlocked({ id: booking.id, house }, upcoming)
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

            {/* Rendered in place (no portal) so it keeps the admin font and scale */}
            <DialogPrimitive.Root open={saved !== null} onOpenChange={(open) => !open && setSaved(null)}>
                <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-black/50" />
                <DialogPrimitive.Content
                    aria-describedby={undefined}
                    className="fixed left-1/2 top-1/2 z-[60] w-[calc(100%-2rem)] max-w-[520px] max-h-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-card p-6 sm:p-7 shadow-xl flex flex-col gap-5 outline-none"
                >
                    {saved && <SavedBookingReport saved={saved} />}
                    <DialogPrimitive.Close className="min-h-12 rounded-xl bg-primary text-primary-foreground text-base font-bold hover:bg-primary/90 transition-colors">
                        Done
                    </DialogPrimitive.Close>
                </DialogPrimitive.Content>
            </DialogPrimitive.Root>
        </div>
    )
}

function StatusIcon({ state }: { state: CheckState }) {
    if (state === "checking") return <Loader2 className="h-4 w-4 mt-0.5 shrink-0 animate-spin text-muted-foreground" />
    if (state === "failed") return <TriangleAlert className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
    return <Check className="h-4 w-4 mt-0.5 shrink-0 text-green-600" />
}

function SavedBookingReport({ saved }: { saved: SavedBooking }) {
    const count = saved.upcoming.length
    const nightsText = `${count} night${count === 1 ? "" : "s"}`
    const stay = `${dayLabel(saved.checkIn)} to ${dayLabel(saved.checkOut)}`

    return (
        <>
            <div className="flex flex-col gap-1">
                <DialogPrimitive.Title className="text-[22px] font-bold tracking-[-0.02em] text-foreground">
                    Booking saved
                </DialogPrimitive.Title>
                <p className="text-[15px] text-muted-foreground">
                    {saved.id} · {saved.houseName} · {stay} · {saved.paidRwf.toLocaleString("en-US")} RWF
                </p>
            </div>

            <div className="flex flex-col gap-3">
                <h3 className="text-[13px] font-semibold text-muted-foreground">What happened</h3>
                <div className="flex gap-2.5 text-[15px] text-foreground">
                    <StatusIcon state="ok" />
                    <p>The booking is recorded as confirmed and counts in Insights.</p>
                </div>
                {count === 0 ? (
                    <div className="flex gap-2.5 text-[15px] text-foreground">
                        <StatusIcon state="ok" />
                        <p>The whole stay is in the past, so there was nothing to close on the website or on Airbnb.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex gap-2.5 text-[15px] text-foreground">
                            <StatusIcon state={saved.website} />
                            <p>
                                <span className="font-semibold">Website: </span>
                                {saved.website === "checking" && `checking that ${nightsText} from today on are blocked…`}
                                {saved.website === "ok" && `${nightsText} from today on are blocked. Guests can no longer book them.`}
                                {saved.website === "failed" &&
                                    "couldn't confirm the nights are blocked. Open Calendar and block them by hand."}
                            </p>
                        </div>
                        <div className="flex gap-2.5 text-[15px] text-foreground">
                            <StatusIcon state={saved.airbnbFeed} />
                            <p>
                                <span className="font-semibold">Airbnb: </span>
                                {saved.airbnbFeed === "checking" && "checking the calendar feed Airbnb reads…"}
                                {saved.airbnbFeed === "ok" &&
                                    "the nights are in the calendar feed Airbnb reads. Airbnb closes them at its next refresh, usually within a few hours. It is not instant."}
                                {saved.airbnbFeed === "failed" &&
                                    "couldn't confirm the nights are in the calendar feed Airbnb reads. Block them on Airbnb by hand."}
                            </p>
                        </div>
                    </>
                )}
            </div>

            {count > 0 && (
                <div className="flex flex-col gap-3 border-t border-[#EBEBEB] pt-5">
                    <h3 className="text-[13px] font-semibold text-muted-foreground">How to cross-check</h3>
                    <div className="text-[15px] text-foreground">
                        <p>
                            <span className="font-semibold">Website: </span>
                            open the house page and its date picker. The nights of {stay} should not be selectable.
                        </p>
                        <a
                            href={`/house/${saved.house}`}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-flex items-center gap-1.5 font-semibold underline underline-offset-2"
                        >
                            Open {saved.houseName} on the website
                            <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                    </div>
                    <div className="text-[15px] text-foreground">
                        <p>
                            <span className="font-semibold">Airbnb: </span>
                            open the listing&apos;s calendar. Once Airbnb has refreshed, the nights show as blocked.
                            To refresh now, go to Availability → Connected calendars and press Refresh on the
                            Velstays calendar.
                        </p>
                        <a
                            href="https://www.airbnb.com/hosting"
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-flex items-center gap-1.5 font-semibold underline underline-offset-2"
                        >
                            Open Airbnb hosting
                            <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                    </div>
                </div>
            )}
        </>
    )
}
