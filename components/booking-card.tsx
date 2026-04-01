"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { format, addDays, addMonths, differenceInDays, isAfter, isBefore, isSameDay as isSameDayFn } from "date-fns"
import { Calendar as CalendarIcon, Star, Users, Info, X, ChevronLeft, ChevronRight, ChevronDown, Check } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { AnimatedButton } from "@/components/animated-button"
import { Calendar } from "@/components/ui/calendar"
import { CalendarDayButton } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { DateRange } from "react-day-picker"

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
  pricePerNight = 51,
  cleaningFee = 10,
  serviceFee = 0,
  rating = 4.95,
  reviewCount = 43,
  maxGuests = 8,
  houseName = "House 23",
  slug = "house-23",
}: BookingCardProps) {
  const router = useRouter()
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

  const handleReserve = () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast.error("Please select your check-in and check-out dates first.")
      return
    }
    const params = new URLSearchParams()
    if (dateRange?.from) params.set("checkIn", dateRange.from.toISOString())
    if (dateRange?.to) params.set("checkOut", dateRange.to.toISOString())
    params.set("guests", guests)
    router.push(`/book/${slug}?${params.toString()}`)
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Fetch manually blocked dates
    fetch(`/api/blocked-dates?house=${slug}`)
      .then((res) => res.json())
      .then((data) => setBlockedDates(new Set(data.dates || [])))
      .catch(() => { })

    // Fetch Airbnb booked dates
    fetch(`/api/airbnb-sync?house=${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.dates?.length) {
          setBlockedDates((prev) => {
            const merged = new Set(prev)
            data.dates.forEach((d: string) => merged.add(d))
            return merged
          })
        }
      })
      .catch(() => { })
  }, [slug])

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

  return (
    <div className="sticky top-24 bg-card rounded-2xl border border-border p-6 shadow-lg">
      {/* Price */}
      <div className="flex items-baseline gap-2 mb-6">
        <span className="text-2xl font-semibold text-foreground">${pricePerNight}</span>
        <span className="text-muted-foreground">night</span>
        <div className="ml-auto flex items-center gap-1">
          <Star className="h-4 w-4 fill-primary text-primary" />
          <span className="text-sm font-semibold">{rating}</span>
          <span className="text-muted-foreground text-sm">({reviewCount})</span>
        </div>
      </div>

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
            <button className="w-full grid grid-cols-2 divide-x divide-border text-left">
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
                        day: "h-10 w-10 text-center text-sm p-0 relative focus-within:relative focus-within:z-20 rounded-full",
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
                              onMouseEnter={() => setHoveredDate(dayDate)}
                              onMouseLeave={() => setHoveredDate(null)}
                              className={isInHoverRange ? 'bg-primary/5' : ''}
                            >
                              <CalendarDayButton
                                {...props}
                                className="hover:bg-transparent hover:text-foreground hover:border hover:border-foreground/30 hover:rounded-full data-[range-start=true]:bg-transparent data-[range-start=true]:text-foreground data-[range-start=true]:border-2 data-[range-start=true]:border-foreground data-[range-start=true]:rounded-full data-[range-end=true]:bg-transparent data-[range-end=true]:text-foreground data-[range-end=true]:border-2 data-[range-end=true]:border-foreground data-[range-end=true]:rounded-full data-[selected-single=true]:bg-transparent data-[selected-single=true]:text-foreground data-[selected-single=true]:border-2 data-[selected-single=true]:border-foreground data-[selected-single=true]:rounded-full data-[range-middle=true]:bg-transparent data-[range-middle=true]:text-foreground data-[range-middle=true]:rounded-none dark:hover:text-foreground"
                              />
                            </div>
                          )
                        },
                      }}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

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

      {/* Reserve Button */}
      <AnimatedButton
        className="w-full rounded-xl h-12 text-base font-semibold mb-4"
        hoverText="Let's go ✦"
        onClick={handleReserve}
      >
        Reserve
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
      <div className="mt-6 flex items-center gap-2 p-4 bg-primary/5 rounded-xl">
        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
          <span className="text-primary font-bold text-sm">%</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Lower price</p>
          <p className="text-xs text-muted-foreground">
            Your dates are ${DISCOUNT_AMOUNT} less than the avg. nightly rate
          </p>
        </div>
      </div>
    </div>
  )
}
