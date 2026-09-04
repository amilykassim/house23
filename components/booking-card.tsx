"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { format, addDays, addMonths, differenceInDays, isAfter, isBefore, isSameDay as isSameDayFn } from "date-fns"
import { Calendar as CalendarIcon, Star, Users, Info, X, ChevronLeft, ChevronRight, ChevronDown, Check, Home, ArrowRight, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { AnimatedButton } from "@/components/animated-button"
import { Calendar } from "@/components/ui/calendar"
import { CalendarDayButton } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { houses, type HouseData } from "@/lib/houses"
import { usePolling } from "@/lib/use-polling"
import type { DateRange } from "react-day-picker"
import Link from "next/link"

const DISCOUNT_AMOUNT = 10

interface BookingCardProps {
  pricePerNight?: number
  cleaningFee?: number
  serviceFee?: number
  rating?: number
  reviewCount?: number
  maxGuests?: number
  houseName?: string
  slug?: string
}

export function BookingCard({
  pricePerNight: initialPricePerNight = 51,
  cleaningFee: initialCleaningFee = 10,
  serviceFee: initialServiceFee = 0,
  rating: initialRating = 4.95,
  reviewCount: initialReviewCount = 43,
  maxGuests: initialMaxGuests = 8,
  houseName: initialHouseName = "House 23",
  slug: initialSlug = "house-23",
}: BookingCardProps) {
  const router = useRouter()
  const [selectedSlug, setSelectedSlug] = useState(initialSlug)
  const [houseSelectOpen, setHouseSelectOpen] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [guests, setGuests] = useState("2")
  const [mounted, setMounted] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [guestsOpen, setGuestsOpen] = useState(false)
  const [selectingStart, setSelectingStart] = useState(true)
  const [calendarKey, setCalendarKey] = useState(0)
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right')
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set())
  const [otherBlockedDates, setOtherBlockedDates] = useState<Set<string>>(new Set())
  const [isReserving, setIsReserving] = useState(false)
  const [showHouseRequired, setShowHouseRequired] = useState(false)
  const [dynamicPrices, setDynamicPrices] = useState<Record<string, { pricePerNight: number; cleaningFee: number; serviceFee: number; airbnbPricePerNight: number }> | null>(null)

  // Get the selected house's data
  const selectedHouse = houses.find((h) => h.slug === selectedSlug) || houses[0]
  const otherHouse = houses.find((h) => h.slug !== selectedSlug) || houses[1]

  // Use dynamic prices if available, otherwise fall back to static
  const dp = dynamicPrices?.[selectedSlug]
  const pricePerNight = dp?.pricePerNight ?? selectedHouse.pricePerNight
  const cleaningFee = dp?.cleaningFee ?? selectedHouse.cleaningFee
  const serviceFee = dp?.serviceFee ?? selectedHouse.serviceFee
  const rating = selectedHouse.rating
  const reviewCount = selectedHouse.reviewCount
  const maxGuests = selectedHouse.guests

  const handleReserve = () => {
    if (!selectedSlug) {
      setShowHouseRequired(true)
      toast.error("Please select a house before making a booking.")
      return
    }
    if (!dateRange?.from || !dateRange?.to) {
      toast.error("Please select your check-in and check-out dates first.")
      return
    }
    setIsReserving(true)
    const params = new URLSearchParams()
    if (dateRange?.from) params.set("checkIn", dateRange.from.toISOString())
    if (dateRange?.to) params.set("checkOut", dateRange.to.toISOString())
    params.set("guests", guests)
    router.push(`/book/${selectedSlug}?${params.toString()}`)
  }

  useEffect(() => {
    setMounted(true)
    // Fetch dynamic prices
    fetch("/api/prices")
      .then((res) => res.json())
      .then((data) => setDynamicPrices(data))
      .catch(() => {})
  }, [])

  const fetchBlockedDates = useCallback(() => {
    // Fetch blocked dates for selected house
    fetch(`/api/blocked-dates?house=${selectedSlug}`)
      .then((res) => res.json())
      .then((data) => {
        const dates = new Set<string>(data.dates || [])
        fetch(`/api/airbnb-sync?house=${selectedSlug}`)
          .then((res) => res.json())
          .then((airbnb) => {
            if (airbnb.dates?.length) {
              airbnb.dates.forEach((d: string) => dates.add(d))
            }
            setBlockedDates(dates)
          })
          .catch(() => setBlockedDates(dates))
      })
      .catch(() => { })

    // Fetch blocked dates for the other house
    const otherSlug = houses.find((h) => h.slug !== selectedSlug)?.slug
    if (otherSlug) {
      fetch(`/api/blocked-dates?house=${otherSlug}`)
        .then((res) => res.json())
        .then((data) => {
          const dates = new Set<string>(data.dates || [])
          fetch(`/api/airbnb-sync?house=${otherSlug}`)
            .then((res) => res.json())
            .then((airbnb) => {
              if (airbnb.dates?.length) {
                airbnb.dates.forEach((d: string) => dates.add(d))
              }
              setOtherBlockedDates(dates)
            })
            .catch(() => setOtherBlockedDates(dates))
        })
        .catch(() => { })
    }
  }, [selectedSlug])

  useEffect(() => {
    fetchBlockedDates()
  }, [fetchBlockedDates])

  // While the calendar is open, keep availability fresh (Airbnb + manual blocks)
  // without the guest having to close and reopen it.
  usePolling(fetchBlockedDates, 30_000, calendarOpen, true)

  const isDateBlocked = useCallback(
    (date: Date) => blockedDates.has(format(date, "yyyy-MM-dd")),
    [blockedDates]
  )

  const disabledDates = useMemo(() => {
    return [
      { before: new Date() },
      (date: Date) => isDateBlocked(date),
    ] as any
  }, [isDateBlocked])

  const nights = useMemo(() => {
    if (dateRange?.from && dateRange?.to) {
      return differenceInDays(dateRange.to, dateRange.from)
    }
    return 0
  }, [dateRange])

  const subtotal = nights * pricePerNight
  const applicableCleaningFee = nights >= 3 ? cleaningFee : 0
  const total = subtotal + applicableCleaningFee + serviceFee

  // Check if selected dates are blocked on current house but available on the other
  const dateAvailabilitySuggestion = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return null
    const selectedDays: string[] = []
    let d = new Date(dateRange.from)
    while (d < dateRange.to) {
      selectedDays.push(format(d, "yyyy-MM-dd"))
      d = addDays(d, 1)
    }
    const blockedOnCurrent = selectedDays.some((day) => blockedDates.has(day))
    if (!blockedOnCurrent) return null
    const blockedOnOther = selectedDays.some((day) => otherBlockedDates.has(day))
    if (blockedOnOther) return null
    return {
      currentHouse: selectedHouse.name,
      otherHouseName: otherHouse.name,
      otherSlug: otherHouse.slug,
    }
  }, [dateRange, blockedDates, otherBlockedDates, selectedHouse, otherHouse])

  // Guest count suggestion
  const guestSuggestion = useMemo(() => {
    const guestCount = Number(guests)
    if (guestCount <= 3) return null
    return {
      currentHouse: selectedHouse.name,
      otherHouseName: otherHouse.name,
      otherSlug: otherHouse.slug,
    }
  }, [guests, selectedHouse, otherHouse])

  const handleDateSelect = (range: DateRange | undefined) => {
    if (!range?.from) {
      setDateRange(undefined)
      setSelectingStart(true)
      return
    }

    // react-day-picker v9 sets from and to to the same date on first click
    const isSameDay = range.from && range.to &&
      differenceInDays(range.to, range.from) === 0

    if (isSameDay) {
      // First click — treat as only check-in
      setDateRange({ from: range.from, to: undefined })
      setSelectingStart(false)
    } else if (range.from && range.to) {
      // Second click — check-out selected, auto-close
      setDateRange(range)
      setTimeout(() => {
        setCalendarOpen(false)
        setSelectingStart(true)
      }, 300)
    } else {
      setDateRange(range)
    }
  }

  const clearDates = () => {
    setDateRange(undefined)
    setSelectingStart(true)
  }

  const handleHouseSelect = (slug: string) => {
    setSelectedSlug(slug)
    setHouseSelectOpen(false)
    setShowHouseRequired(false)
    setDateRange(undefined)
    setSelectingStart(true)
  }

  return (
    <div className="sticky top-24 bg-card rounded-2xl border border-border p-6 shadow-lg">
      {/* Price */}
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-2xl font-semibold text-foreground">${pricePerNight}</span>
        <span className="text-muted-foreground">night</span>
        <div className="ml-auto flex items-center gap-1">
          <Star className="h-4 w-4 fill-primary text-primary" />
          <span className="text-sm font-semibold">{rating}</span>
          <span className="text-muted-foreground text-sm">({reviewCount})</span>
        </div>
      </div>

      {/* House Selection */}
      <div className={`border rounded-xl mb-4 transition-colors ${showHouseRequired ? 'border-destructive' : 'border-border'}`}>
        <Popover open={houseSelectOpen} onOpenChange={setHouseSelectOpen}>
          <PopoverTrigger asChild>
            <button className="w-full p-3 text-left hover:bg-muted/30 transition-colors rounded-xl">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground mb-0.5">
                House
              </div>
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{selectedHouse.name}</span>
                <ChevronDown className="h-3.5 w-3.5 ml-auto opacity-50" />
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-(--radix-popover-trigger-width) p-1" align="start" sideOffset={4}>
            {houses.map((house) => (
              <button
                key={house.slug}
                onClick={() => handleHouseSelect(house.slug)}
                className="flex items-center justify-between w-full px-3 py-2.5 text-sm rounded-lg hover:bg-primary/10 hover:text-foreground transition-colors"
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">{house.name}</span>
                  <span className="text-xs text-muted-foreground">${house.pricePerNight}/night · Up to {house.guests} guests</span>
                </div>
                {selectedSlug === house.slug && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      </div>

      {/* House Required Message */}
      <AnimatePresence>
        {showHouseRequired && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 overflow-hidden"
          >
            <p className="text-xs text-destructive flex items-center gap-1.5 px-1">
              <Info className="h-3.5 w-3.5 shrink-0" />
              Please select a house before making a booking.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Date Selection */}
      <div className="border border-border rounded-xl overflow-hidden mb-4">
        <Popover open={calendarOpen} onOpenChange={(open) => {
          setCalendarOpen(open)
          if (open) {
            // Always start fresh when opening
            setSelectingStart(true)
            setDateRange(undefined)
            setCalendarKey(k => k + 1)
          }
        }}>
          <PopoverTrigger asChild>
            <button className="w-full grid grid-cols-2 divide-x divide-border text-left touch-manipulation">
              <div className={`p-3 transition-colors ${selectingStart && calendarOpen ? 'bg-muted' : 'hover:bg-muted/50'}`}>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground mb-0.5">
                  Check-in
                </div>
                <div className="text-sm text-foreground">
                  {mounted && dateRange?.from ? format(dateRange.from, "MMM d, yyyy") : "Add date"}
                </div>
              </div>
              <div className={`p-3 transition-colors ${!selectingStart && calendarOpen ? 'bg-muted' : 'hover:bg-muted/50'}`}>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground mb-0.5">
                  Checkout
                </div>
                <div className="text-sm text-foreground">
                  {mounted && dateRange?.to ? format(dateRange.to, "MMM d, yyyy") : "Add date"}
                </div>
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto max-h-[90vh] overflow-y-auto p-0 border-0 shadow-2xl rounded-2xl"
            align="center"
            side="bottom"
            sideOffset={8}
            collisionPadding={16}
            avoidCollisions={true}
          >
            <div className="bg-card rounded-2xl overflow-hidden">
              {/* Airbnb-style Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-foreground">
                    {nights > 0 ? `${nights} night${nights > 1 ? 's' : ''}` : 'Select dates'}
                  </h3>
                  <button
                    onClick={() => setCalendarOpen(false)}
                    className="p-1 hover:bg-muted rounded-full transition-colors"
                  >
                    <X className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setSelectingStart(true)
                      setDateRange(undefined)
                      setCalendarKey(k => k + 1)
                    }}
                    className={`flex-1 p-3 rounded-xl border-2 transition-all text-left ${selectingStart
                      ? 'border-foreground bg-background'
                      : 'border-border hover:border-muted-foreground'
                      }`}
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                      Check-in
                    </div>
                    <div className="text-sm font-medium text-foreground">
                      {dateRange?.from ? format(dateRange.from, "MMM d, yyyy") : "Add date"}
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setSelectingStart(false)
                      if (dateRange?.from) {
                        setDateRange({ from: dateRange.from, to: undefined })
                      }
                    }}
                    className={`flex-1 p-3 rounded-xl border-2 transition-all text-left ${!selectingStart
                      ? 'border-foreground bg-background'
                      : 'border-border hover:border-muted-foreground'
                      }`}
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                      Checkout
                    </div>
                    <div className="text-sm font-medium text-foreground">
                      {dateRange?.to ? format(dateRange.to, "MMM d, yyyy") : "Add date"}
                    </div>
                  </button>
                </div>
              </div>

              {/* Month Navigation */}
              <div className="flex items-center justify-between px-4 pt-4">
                <button
                  onClick={() => {
                    setSlideDirection('left')
                    setCalendarMonth(m => addMonths(m, -1))
                  }}
                  className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 text-foreground" />
                </button>
                <div className="overflow-hidden flex-1 flex justify-center">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={calendarMonth.toISOString() + '-title'}
                      initial={{ x: slideDirection === 'right' ? 20 : -20 }}
                      animate={{ x: 0 }}
                      exit={{ x: slideDirection === 'right' ? -20 : 20 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="text-sm font-medium text-foreground block"
                    >
                      {format(calendarMonth, "MMMM yyyy")} — {format(addMonths(calendarMonth, 1), "MMMM yyyy")}
                    </motion.span>
                  </AnimatePresence>
                </div>
                <button
                  onClick={() => {
                    setSlideDirection('right')
                    setCalendarMonth(m => addMonths(m, 1))
                  }}
                  className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                >
                  <ChevronRight className="h-5 w-5 text-foreground" />
                </button>
              </div>

              {/* Calendar */}
              <div className="p-4 overflow-hidden">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={calendarMonth.toISOString()}
                    initial={{ x: slideDirection === 'right' ? 40 : -40 }}
                    animate={{ x: 0 }}
                    exit={{ x: slideDirection === 'right' ? -40 : 40 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                  >
                    <Calendar
                      key={calendarKey}
                      mode="range"
                      month={calendarMonth}
                      onMonthChange={setCalendarMonth}
                      selected={dateRange}
                      onSelect={handleDateSelect}
                      numberOfMonths={2}
                      showOutsideDays={false}
                      disabled={disabledDates}
                      classNames={{
                        months: "flex gap-8 flex-col md:flex-row",
                        month: "space-y-4",
                        month_caption: "hidden",
                        caption_label: "hidden",
                        nav: "hidden",
                        button_previous: "hidden",
                        button_next: "hidden",
                        table: "w-full border-collapse",
                        weekdays: "flex mb-2",
                        weekday: "text-muted-foreground rounded-md w-10 font-medium text-xs",
                        week: "flex w-full",
                        day: "h-10 w-10 text-center text-sm p-0 relative focus-within:relative focus-within:z-20 rounded-full touch-manipulation",
                        range_start: "rounded-full",
                        range_end: "rounded-full",
                        range_middle: "bg-muted/50 rounded-none",
                        today: "",
                        outside: "text-muted-foreground opacity-50",
                        disabled: "text-muted-foreground opacity-30 cursor-not-allowed",
                      }}
                      components={{
                        Chevron: ({ orientation }) => (
                          orientation === 'left'
                            ? <ChevronLeft className="h-5 w-5" />
                            : <ChevronRight className="h-5 w-5" />
                        ),
                        DayButton: (props) => {
                          const dayDate = props.day.date
                          const isInHoverRange = !selectingStart && dateRange?.from && !dateRange?.to && hoveredDate &&
                            isAfter(dayDate, dateRange.from) && (isBefore(dayDate, hoveredDate) || isSameDayFn(dayDate, hoveredDate))

                          return (
                            <div
                              onPointerEnter={(e) => {
                                if (e.pointerType === 'mouse') setHoveredDate(dayDate)
                              }}
                              onPointerLeave={(e) => {
                                if (e.pointerType === 'mouse') setHoveredDate(null)
                              }}
                              className={isInHoverRange ? 'bg-primary/5' : ''}
                            >
                              <CalendarDayButton
                                {...props}
                                className="touch-manipulation hover:bg-transparent hover:text-foreground hover:border hover:border-foreground/30 hover:rounded-full data-[range-start=true]:bg-transparent data-[range-start=true]:text-foreground data-[range-start=true]:border-2 data-[range-start=true]:border-foreground data-[range-start=true]:rounded-full data-[range-end=true]:bg-transparent data-[range-end=true]:text-foreground data-[range-end=true]:border-2 data-[range-end=true]:border-foreground data-[range-end=true]:rounded-full data-[selected-single=true]:bg-transparent data-[selected-single=true]:text-foreground data-[selected-single=true]:border-2 data-[selected-single=true]:border-foreground data-[selected-single=true]:rounded-full data-[range-middle=true]:bg-transparent data-[range-middle=true]:text-foreground data-[range-middle=true]:rounded-none dark:hover:text-foreground"
                              />
                            </div>
                          )
                        },
                      }}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Date Availability Suggestion */}
              <AnimatePresence>
                {dateAvailabilitySuggestion && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-4 pb-2 overflow-hidden"
                  >
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl p-3.5">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0 mt-0.5">
                          <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
                            These dates are unavailable for {dateAvailabilitySuggestion.currentHouse}, but available for{" "}
                            <span className="font-semibold">{dateAvailabilitySuggestion.otherHouseName}</span>!
                          </p>
                          <button
                            onClick={() => handleHouseSelect(dateAvailabilitySuggestion.otherSlug)}
                            className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 transition-colors"
                          >
                            Switch to {dateAvailabilitySuggestion.otherHouseName}
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Footer */}
              <div className="p-4 border-t border-border flex items-center justify-between">
                <button
                  onClick={clearDates}
                  className="text-sm font-semibold underline text-foreground hover:text-muted-foreground transition-colors"
                >
                  Clear dates
                </button>
                <Button
                  onClick={() => setCalendarOpen(false)}
                  className="rounded-lg px-6 bg-black text-white hover:bg-black/90"
                >
                  Close
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Guests */}
        <div className="border-t border-border p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground mb-0.5">
            Guests
          </div>
          <Popover open={guestsOpen} onOpenChange={setGuestsOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 text-sm text-foreground w-full">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{guests} {Number(guests) === 1 ? "guest" : "guests"}</span>
                <ChevronDown className="h-3.5 w-3.5 ml-auto opacity-50" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-(--radix-popover-trigger-width) p-1" align="start" sideOffset={4}>
              {Array.from({ length: maxGuests }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => { setGuests(num.toString()); setGuestsOpen(false) }}
                  className="flex items-center justify-between w-full px-2 py-1.5 text-sm rounded-sm hover:bg-primary/10 hover:text-foreground transition-colors"
                >
                  <span>{num} {num === 1 ? "guest" : "guests"}</span>
                  {guests === num.toString() && <Check className="h-4 w-4" />}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Guest Count Suggestion */}
      <AnimatePresence>
        {guestSuggestion && (
          <motion.div
            initial={{ opacity: 0, y: -5, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -5, height: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="mb-4 overflow-hidden"
          >
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/30 rounded-xl p-3.5">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0 mt-0.5">
                  <Users className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                    For groups larger than 3, you can also book the nearby{" "}
                    <Link
                      href={`/house/${guestSuggestion.otherSlug}`}
                      className="font-semibold underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-100 transition-colors"
                    >
                      {guestSuggestion.otherHouseName}
                    </Link>{" "}
                    at a similar price.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reserve Button */}
      <AnimatedButton
        className="w-full rounded-xl h-12 text-base font-semibold mb-4"
        hoverText="Let's go ✦"
        onClick={handleReserve}
        loading={isReserving}
      >
        Let's go
      </AnimatedButton>

      <p className="text-center text-sm text-muted-foreground mb-6">
        {"You won't be charged yet"}
      </p>

      {/* Price Breakdown */}
      {mounted && nights > 0 && (
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex justify-between text-foreground">
            <span className="underline cursor-pointer">
              ${pricePerNight} x {nights} nights
            </span>
            <span>${subtotal}</span>
          </div>
          {nights >= 3 && (
            <div className="flex justify-between text-foreground">
              <span className="underline cursor-pointer flex items-center gap-1">
                Cleaning fee
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Cleaning fee is added for stays of 3 nights or more</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </span>
              <span>${applicableCleaningFee}</span>
            </div>
          )}
          <div className="flex justify-between text-foreground">
            <span className="underline cursor-pointer flex items-center gap-1">
              Service fee
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Service fee is currently free of charge</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </span>
            <span>${serviceFee}</span>
          </div>
          <div className="flex justify-between text-foreground font-semibold pt-3 border-t border-border">
            <span>Total before taxes</span>
            <span>${total}</span>
          </div>
        </div>
      )}

      {/* Price Tag */}
      <div className="mt-6 flex items-start gap-3 p-4 bg-primary/5 rounded-xl">
        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
          <span className="text-primary font-bold text-sm">%</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Lower price</p>
          <p className="text-xs text-muted-foreground">
            Booking directly with us saves you <b>20%</b>!
          </p>
        </div>
      </div>
    </div>
  )
}
