"use client"

import { useState, useMemo, useEffect } from "react"
import { format, addDays, differenceInDays } from "date-fns"
import { Calendar as CalendarIcon, Star, Users, Info, X, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { DateRange } from "react-day-picker"

const DISCOUNT_AMOUNT = 10

interface BookingCardProps {
  pricePerNight?: number
  cleaningFee?: number
  serviceFee?: number
  rating?: number
  reviewCount?: number
  maxGuests?: number
}

export function BookingCard({
  pricePerNight = 51,
  cleaningFee = 10,
  serviceFee = 0,
  rating = 4.95,
  reviewCount = 43,
  maxGuests = 8,
}: BookingCardProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [guests, setGuests] = useState("2")
  const [mounted, setMounted] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [selectingStart, setSelectingStart] = useState(true)

  useEffect(() => {
    setMounted(true)
    const today = new Date()
    setDateRange({
      from: addDays(today, 7),
      to: addDays(today, 10),
    })
  }, [])

  const nights = useMemo(() => {
    if (dateRange?.from && dateRange?.to) {
      return differenceInDays(dateRange.to, dateRange.from)
    }
    return 0
  }, [dateRange])

  const subtotal = nights * pricePerNight
  const total = subtotal + cleaningFee + serviceFee

  const handleDateSelect = (range: DateRange | undefined) => {
    setDateRange(range)

    // Auto-close when both dates are selected
    if (range?.from && range?.to) {
      setTimeout(() => {
        setCalendarOpen(false)
        setSelectingStart(true)
      }, 300)
    } else if (range?.from && !range?.to) {
      setSelectingStart(false)
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
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
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
            className="w-auto p-0 border-0 shadow-2xl rounded-2xl"
            align="center"
            sideOffset={8}
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
                    onClick={() => setSelectingStart(true)}
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
                    onClick={() => setSelectingStart(false)}
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

              {/* Calendar */}
              <div className="p-4">
                <Calendar
                  mode="range"
                  defaultMonth={mounted ? dateRange?.from || new Date() : undefined}
                  selected={dateRange}
                  onSelect={handleDateSelect}
                  numberOfMonths={2}
                  showOutsideDays={false}
                  disabled={{ before: new Date() }}
                  classNames={{
                    months: "flex gap-8 flex-col md:flex-row",
                    month: "space-y-4",
                    month_caption: "flex justify-center pt-1 relative items-center mb-4",
                    caption_label: "text-base font-semibold",
                    nav: "flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between px-2",
                    button_previous: "h-9 w-9 bg-transparent p-0 hover:bg-muted rounded-full flex items-center justify-center",
                    button_next: "h-9 w-9 bg-transparent p-0 hover:bg-muted rounded-full flex items-center justify-center",
                    table: "w-full border-collapse",
                    weekdays: "flex mb-2",
                    weekday: "text-muted-foreground rounded-md w-10 font-medium text-xs",
                    week: "flex w-full",
                    day: "h-10 w-10 text-center text-sm p-0 relative focus-within:relative focus-within:z-20 rounded-full",
                    range_start: "bg-primary text-primary-foreground rounded-full",
                    range_end: "bg-primary text-primary-foreground rounded-full",
                    range_middle: "bg-primary/10 rounded-none",
                    today: "bg-accent text-accent-foreground font-semibold",
                    outside: "text-muted-foreground opacity-50",
                    disabled: "text-muted-foreground opacity-30 cursor-not-allowed",
                  }}
                  components={{
                    Chevron: ({ orientation }) => (
                      orientation === 'left'
                        ? <ChevronLeft className="h-5 w-5" />
                        : <ChevronRight className="h-5 w-5" />
                    ),
                  }}
                />
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
                  className="rounded-lg px-6"
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
          <Select value={guests} onValueChange={setGuests}>
            <SelectTrigger className="border-0 p-0 h-auto shadow-none focus:ring-0">
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Users className="h-4 w-4 text-muted-foreground" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: maxGuests }, (_, i) => i + 1).map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num} {num === 1 ? "guest" : "guests"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reserve Button */}
      <Button className="w-full rounded-xl h-12 text-base font-semibold mb-4">
        Reserve
      </Button>

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
          <div className="flex justify-between text-foreground">
            <span className="underline cursor-pointer flex items-center gap-1">
              Cleaning fee
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
            </span>
            <span>${cleaningFee}</span>
          </div>
          <div className="flex justify-between text-foreground">
            <span className="underline cursor-pointer flex items-center gap-1">
              Service fee
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
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
