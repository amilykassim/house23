"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { format, parseISO, startOfMonth, subMonths } from "date-fns"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { ArrowDown, ArrowUp, Check, ChevronLeft, ChevronRight, Copy, Loader2, Plus, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { houses } from "@/lib/houses"
import { ALL_HOUSES, EXPENSE_CATEGORIES, splitEvenly, type Expense, type ExpenseCategory } from "@/lib/expenses"
import type { EarningsBooking } from "@/lib/earnings"
import { expenseReport, monthLines, shiftMonth, usualText, type ExpenseLine } from "@/lib/expense-report"
import { SegmentedControl } from "@/components/segmented-control"
import { PillMenu } from "@/components/pill-menu"
import { houseColor } from "@/components/earnings-insights"
import { forgetExpenses, loadBookings, loadExpenses } from "@/lib/admin-data"
import { CalendarPanel, dayKey, dayLabel, monthCells } from "@/components/date-range-picker"

const HOUSE_OPTIONS = [
    ...houses.map((h) => ({ id: h.slug, label: h.name })),
    ...(houses.length > 1 ? [{ id: ALL_HOUSES, label: houses.length === 2 ? "Both houses" : "All houses" }] : []),
]
const houseLabel = (id: string) => HOUSE_OPTIONS.find((h) => h.id === id)?.label ?? id
const rwf = (n: number) => `${Math.round(n).toLocaleString("en-US")} RWF`
const pct = (share: number) => `${Math.round(share * 100)}%`
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`
// Lines of a month shown before "Show more"
const FIRST_LINES = 5
// Other months offered as shortcuts under the list
const MONTH_SHORTCUTS = 3
// Months offered as the month to copy to: this one and the ones before it
const TARGET_MONTHS = 12
const CHART_HEIGHT = 120
// The month pills fill their column, label left and arrow right
const MONTH_MENU = "[&>button]:w-full [&>button]:justify-between [&>button]:min-h-12 [&>button]:text-[15px]"
const monthLabel = (key: string) => format(parseISO(`${key}-01`), "MMMM yyyy")
const monthName = (key: string) => format(parseISO(`${key}-01`), "MMMM")

const SECTION_TITLE = "text-[22px] font-bold tracking-[-0.02em] leading-tight text-foreground"
const TILE = "min-w-0 rounded-[20px] p-5 flex flex-col gap-1.5"
const TRACK = "h-2 rounded-full bg-[#D5D5D5] overflow-hidden"
const ARROW_BUTTON =
    "w-11 h-11 shrink-0 rounded-full border border-[#B0B0B0] bg-card flex items-center justify-center text-foreground hover:bg-[#F7F7F7] disabled:text-[#B0B0B0] disabled:hover:bg-card"

export default function AdminExpensesPage() {
    const today = dayKey(new Date())
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [bookings, setBookings] = useState<EarningsBooking[]>([])
    const [loading, setLoading] = useState(true)
    // The add form stays folded until "Add an expense" is pressed
    const [formOpen, setFormOpen] = useState(false)
    // With more than one house, an expense is shared between them by default
    const [house, setHouse] = useState(houses.length > 1 ? ALL_HOUSES : houses[0].slug)
    const [category, setCategory] = useState<ExpenseCategory>(EXPENSE_CATEGORIES[0])
    const [amount, setAmount] = useState("")
    const [date, setDate] = useState(today)
    const [note, setNote] = useState("")
    const [calendarOpen, setCalendarOpen] = useState(false)
    const [month, setMonth] = useState(() => startOfMonth(new Date()))
    const [saving, setSaving] = useState(false)
    // The house the report is about: every house, or one of them
    const [view, setView] = useState(houses.length > 1 ? ALL_HOUSES : houses[0].slug)
    // Month whose expenses are reported ("yyyy-MM"), and whether all of them show
    const [listMonth, setListMonth] = useState(today.slice(0, 7))
    const [showAll, setShowAll] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
    const [deleting, setDeleting] = useState<string | null>(null)
    // Copying a month: null while the dialog is closed
    const [copy, setCopy] = useState<{ from: string; to: string; picked: Record<string, boolean>; amounts: Record<string, string> } | null>(null)
    const [copying, setCopying] = useState(false)

    const fetchExpenses = useCallback(async () => {
        try {
            setExpenses(await loadExpenses<Expense>())
        } catch {
            // keep whatever is on screen
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchExpenses()
        // Bookings give the month's revenue and booked nights; without them the
        // report still shows what was spent
        loadBookings<EarningsBooking>()
            .then(setBookings)
            .catch(() => {})
    }, [fetchExpenses])

    const paid = Number(amount)
    // An expense for all houses is saved as an equal share for each
    const shares = house === ALL_HOUSES ? splitEvenly(Math.round(paid) || 0, houses.length) : []
    const splitText =
        shares.length === 0
            ? ""
            : shares.every((s) => s === shares[0])
                ? `${rwf(shares[0])} for each house`
                : shares.map((s, i) => `${rwf(s)} for ${houses[i].name}`).join(", ")
    const canSave = paid > 0 && !saving && shares.every((s) => s > 0)

    // Expenses can't be dated in the future
    const cells = useMemo(() => monthCells(month, (key) => ({ disabled: key > today })), [month, today])

    const monthKey = today.slice(0, 7)
    const report = useMemo(() => expenseReport(expenses, bookings, listMonth, view), [expenses, bookings, listMonth, view])
    const visible = showAll ? report.lines : report.lines.slice(0, FIRST_LINES)
    const listMonthName = monthName(listMonth)
    const previousMonthName = monthName(shiftMonth(listMonth, -1))
    // The arrows stop at the oldest month with an expense and at this month
    const oldestMonth = expenses.reduce((oldest, e) => (e.date.slice(0, 7) < oldest ? e.date.slice(0, 7) : oldest), monthKey)
    const showMonth = (key: string) => {
        setListMonth(key)
        setShowAll(false)
        setConfirmDelete(null)
    }
    const stepMonth = (step: number) => showMonth(shiftMonth(listMonth, step))
    const topCategory = report.categories[0]
    const chartMax = Math.max(...report.months.map((m) => m.total), 1)
    const hasSpending = report.total > 0

    const handleSave = async () => {
        if (!canSave) return
        setSaving(true)
        try {
            const res = await fetch("/api/expenses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ house, category, amountRwf: paid, date, note }),
            })
            if (!res.ok) throw new Error("Request failed")
            forgetExpenses()
            toast.success("Expense saved", {
                description:
                    house === ALL_HOUSES
                        ? `${rwf(paid)} for ${category.toLowerCase()}, split: ${splitText}`
                        : `${rwf(paid)} for ${category.toLowerCase()} · ${houseLabel(house)}`,
            })
            setAmount("")
            setNote("")
            setDate(today)
            setCalendarOpen(false)
            setFormOpen(false)
            fetchExpenses()
        } catch {
            toast.error("Couldn't save the expense", { description: "Nothing was recorded. Try again." })
        } finally {
            setSaving(false)
        }
    }

    // Months that have expenses, newest first
    const sourceMonths = useMemo(() => [...new Set(expenses.map((e) => e.date.slice(0, 7)))].sort().reverse(), [expenses])
    const otherMonths = sourceMonths
        .filter((m) => m !== listMonth)
        .slice(0, MONTH_SHORTCUTS)
        .map((key) => ({ key, total: expenses.filter((e) => e.date.startsWith(key)).reduce((sum, e) => sum + e.amountRwf, 0) }))
    const targetMonths = useMemo(
        () => Array.from({ length: TARGET_MONTHS }, (_, i) => format(subMonths(new Date(), i), "yyyy-MM")),
        []
    )
    const lines = useMemo(() => (copy ? monthLines(expenses, copy.from) : []), [expenses, copy?.from])
    // Already recorded in the month copied to: same category for the same house(s)
    const alreadyThere = useCallback(
        (line: ExpenseLine, to: string) => {
            const has = (slug: string) => expenses.some((e) => e.date.startsWith(to) && e.category === line.category && e.house === slug)
            return line.house === ALL_HOUSES ? houses.every((h) => has(h.slug)) : has(line.house)
        },
        [expenses]
    )

    // Opens the dialog, or changes its months; ticks everything not already there
    const startCopy = (from: string, to: string) => {
        const picked: Record<string, boolean> = {}
        const amounts: Record<string, string> = {}
        for (const line of monthLines(expenses, from)) {
            picked[line.key] = from !== to && !alreadyThere(line, to)
            amounts[line.key] = String(line.amountRwf)
        }
        setCopy({ from, to, picked, amounts })
    }

    const openCopy = () => {
        const lastMonth = format(subMonths(new Date(), 1), "yyyy-MM")
        const from = sourceMonths.includes(lastMonth) ? lastMonth : sourceMonths.find((m) => m !== monthKey) ?? sourceMonths[0]
        startCopy(from, monthKey)
    }

    const chosen = copy ? lines.filter((line) => copy.picked[line.key]) : []
    const chosenTotal = copy ? chosen.reduce((sum, line) => sum + (Math.round(Number(copy.amounts[line.key])) || 0), 0) : 0
    const canCopy =
        copy !== null &&
        copy.from !== copy.to &&
        chosen.length > 0 &&
        !copying &&
        chosen.every((line) => {
            const amount = Math.round(Number(copy.amounts[line.key]))
            return amount > 0 && (line.house !== ALL_HOUSES || splitEvenly(amount, houses.length).every((s) => s > 0))
        })

    const handleCopy = async () => {
        if (!copy || !canCopy) return
        setCopying(true)
        try {
            const res = await fetch("/api/expenses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: chosen.map((line) => ({
                        house: line.house,
                        category: line.category,
                        amountRwf: Math.round(Number(copy.amounts[line.key])),
                        // Copies are dated the 1st of the month they are copied to
                        date: `${copy.to}-01`,
                        note: line.note,
                    })),
                }),
            })
            if (!res.ok) throw new Error("Request failed")
            forgetExpenses()
            toast.success(`${chosen.length} expense${chosen.length === 1 ? "" : "s"} copied to ${monthLabel(copy.to)}`, {
                description: `${rwf(chosenTotal)}, dated ${dayLabel(`${copy.to}-01`)}`,
            })
            setCopy(null)
            fetchExpenses()
        } catch {
            toast.error("Couldn't copy the expenses", { description: "Nothing was recorded. Try again." })
        } finally {
            setCopying(false)
        }
    }

    // Deletes a line: one expense, or every house's share of a split one
    const handleDelete = async (line: ExpenseLine) => {
        setDeleting(line.key)
        const removed: string[] = []
        try {
            for (const id of line.ids) {
                const res = await fetch(`/api/expenses?id=${encodeURIComponent(id)}`, { method: "DELETE" })
                if (!res.ok) throw new Error("Request failed")
                removed.push(id)
            }
            toast.success("Expense deleted")
        } catch {
            toast.error("Couldn't delete the expense", {
                description: removed.length > 0 ? "Only part of it was deleted. Check the list and try again." : undefined,
            })
        } finally {
            if (removed.length > 0) {
                forgetExpenses()
                setExpenses((prev) => prev.filter((e) => !removed.includes(e.id)))
            }
            setDeleting(null)
            setConfirmDelete(null)
        }
    }

    const fieldCard = "min-w-0 rounded-2xl border-2 bg-card px-3.5 sm:px-[17px] py-[15px] flex flex-col gap-1.5"

    // "▲ 45% vs September", "same as September", "first month"
    const changeLine =
        report.change.kind === "first" ? (
            <span>first month</span>
        ) : report.change.kind === "same" ? (
            <span>same as {previousMonthName}</span>
        ) : (
            <>
                {report.change.kind === "up" ? <ArrowUp className="h-3.5 w-3.5" aria-label="up" /> : <ArrowDown className="h-3.5 w-3.5" aria-label="down" />}
                <span>
                    {report.change.pct}% vs {previousMonthName}
                </span>
            </>
        )

    return (
        // zoom scales the whole page down a notch on every screen size
        <div className="[zoom:0.88] px-4 pt-7 sm:pt-12 pb-14 max-w-[592px] mx-auto flex flex-col gap-6 sm:gap-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-[28px] sm:text-[34px] leading-tight font-bold tracking-[-0.02em] text-foreground">Expenses</h1>
                <button
                    type="button"
                    onClick={() => setFormOpen((open) => !open)}
                    aria-expanded={formOpen}
                    aria-controls="add-expense"
                    className="min-h-13 px-5 rounded-xl bg-primary text-primary-foreground text-[15px] font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors"
                >
                    {formOpen ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                    {formOpen ? "Close" : "Add an expense"}
                </button>
            </div>

            {formOpen && (
                <div id="add-expense" className="rounded-[20px] border border-border bg-card p-4 sm:p-5 flex flex-col gap-5">
                    {/* House */}
                    <SegmentedControl
                        className="self-start max-w-full"
                        itemClassName="px-3 sm:px-[22px]"
                        options={HOUSE_OPTIONS}
                        value={house}
                        onChange={setHouse}
                    />

                    {/* Category */}
                    <div className="flex flex-col gap-3">
                        <span className="text-[15px] font-semibold text-foreground">What was it for?</span>
                        <div className="flex flex-wrap gap-2">
                            {EXPENSE_CATEGORIES.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setCategory(c)}
                                    aria-pressed={category === c}
                                    className={`min-h-11 px-4 rounded-full border text-sm font-semibold ${category === c
                                        ? "border-foreground bg-foreground text-background"
                                        : "border-[#B0B0B0] bg-card text-foreground hover:bg-[#F7F7F7]"
                                        }`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Amount */}
                    <label className="rounded-2xl border border-[#B0B0B0] bg-card px-5 py-[18px] flex flex-col gap-0.5 focus-within:border-foreground focus-within:ring-1 focus-within:ring-foreground">
                        <span className="text-[13px] font-semibold text-muted-foreground">Amount spent</span>
                        <input
                            type="number"
                            min="0"
                            inputMode="numeric"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0"
                            className="w-full bg-transparent text-[34px] sm:text-[40px] leading-tight font-semibold text-foreground placeholder:text-[#B0B0B0] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                        <span className="text-[13px] text-muted-foreground">
                            RWF{house === ALL_HOUSES && paid > 0 && ` · split between the houses: ${splitText}`}
                        </span>
                    </label>

                    {/* Date + note */}
                    <div className="flex flex-col gap-3">
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setMonth(startOfMonth(parseISO(date)))
                                    setCalendarOpen((open) => !open)
                                }}
                                aria-expanded={calendarOpen}
                                className={`${fieldCard} text-left ${calendarOpen ? "border-foreground" : "border-[#B0B0B0]"}`}
                            >
                                <span className="text-[13px] font-semibold text-muted-foreground">Date</span>
                                <span className="text-[17px] font-medium text-foreground">
                                    {date === today ? `Today, ${dayLabel(date)}` : dayLabel(date)}
                                </span>
                            </button>
                            <label className={`${fieldCard} border-[#B0B0B0] focus-within:border-foreground`}>
                                <span className="text-[13px] font-semibold text-muted-foreground">Note (optional)</span>
                                <input
                                    type="text"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="e.g. plumber"
                                    maxLength={200}
                                    autoComplete="off"
                                    className="w-full bg-transparent text-[19px] sm:text-[17px] font-medium text-foreground placeholder:text-[#B0B0B0] outline-none"
                                />
                            </label>
                        </div>
                        {calendarOpen && (
                            <CalendarPanel
                                prompt="Pick the date"
                                onClose={() => setCalendarOpen(false)}
                                month={month}
                                onMonthChange={setMonth}
                                cells={cells}
                                start={date}
                                onPick={(key) => {
                                    setDate(key)
                                    setCalendarOpen(false)
                                }}
                            />
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={!canSave}
                        className="min-h-13 rounded-xl bg-primary text-primary-foreground text-base font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-45 disabled:hover:bg-primary"
                    >
                        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                        Save expense
                    </button>
                </div>
            )}

            {/* Which house the report is about */}
            {houses.length > 1 && (
                <SegmentedControl
                    className="self-start max-w-full"
                    itemClassName="px-3 sm:px-[22px]"
                    options={HOUSE_OPTIONS}
                    value={view}
                    onChange={(next) => {
                        setView(next)
                        setShowAll(false)
                        setConfirmDelete(null)
                    }}
                />
            )}

            {/* One month at a time */}
            <div className="flex items-center gap-3">
                <button type="button" onClick={() => stepMonth(-1)} disabled={listMonth <= oldestMonth} aria-label="Previous month" className={ARROW_BUTTON}>
                    <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="min-w-0 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                    <span className="text-[17px] font-bold tracking-[-0.02em] text-foreground">{monthLabel(listMonth)}</span>
                    <span className="text-[13px] text-muted-foreground">{plural(report.lines.length, "expense")}</span>
                </div>
                <button type="button" onClick={() => stepMonth(1)} disabled={listMonth >= monthKey} aria-label="Next month" className={ARROW_BUTTON}>
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>

            {loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (
                <>
                    {/* The month at a glance */}
                    <section aria-label={`${listMonthName} at a glance`} className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-3">
                        <div className={`${TILE} bg-foreground text-background`}>
                            <span className="text-[13px] font-semibold text-background/75">Spent in {listMonthName}</span>
                            <span className="text-[26px] leading-tight font-bold tracking-[-0.02em]">{rwf(report.total)}</span>
                            <span className="text-[13px] flex items-center gap-1.5">{changeLine}</span>
                        </div>
                        <div className={`${TILE} bg-[#F7F7F7]`}>
                            <span className="text-[13px] font-semibold text-muted-foreground">Per booked night</span>
                            <span className="text-[22px] leading-tight font-bold tracking-[-0.02em] text-foreground">
                                {report.nights > 0 ? rwf(report.total / report.nights) : "–"}
                            </span>
                            <span className="text-[13px] text-muted-foreground">
                                {report.nights > 0 ? `${plural(report.nights, "night")} booked` : "no nights yet"}
                            </span>
                        </div>
                        <div className={`${TILE} bg-[#F7F7F7]`}>
                            <span className="text-[13px] font-semibold text-muted-foreground">Biggest cost</span>
                            <span className="text-[22px] leading-tight font-bold tracking-[-0.02em] text-foreground">{topCategory?.category ?? "–"}</span>
                            <span className="text-[13px] text-muted-foreground">{topCategory ? rwf(topCategory.amount) : "nothing yet"}</span>
                        </div>
                        <div className={`${TILE} bg-[#F7F7F7]`}>
                            <span className="text-[13px] font-semibold text-muted-foreground">Share of revenue</span>
                            <span className="text-[22px] leading-tight font-bold tracking-[-0.02em] text-foreground">
                                {report.revenue > 0 ? pct(report.total / report.revenue) : "–"}
                            </span>
                            <span className="text-[13px] text-muted-foreground">{report.revenue > 0 ? `of ${rwf(report.revenue)}` : "no revenue yet"}</span>
                        </div>
                    </section>

                    {!hasSpending ? (
                        <p className="text-sm text-muted-foreground">The breakdown appears once {listMonthName} has an expense.</p>
                    ) : (
                        <>
                            {/* By category, largest first */}
                            <section aria-labelledby="where-it-goes" className="flex flex-col gap-3.5">
                                <h2 id="where-it-goes" className={SECTION_TITLE}>
                                    Where it goes
                                </h2>
                                <div className="flex flex-col gap-4">
                                    {report.categories.map((row) => (
                                        <div key={row.category} className="flex flex-col gap-2">
                                            <div className="flex justify-between gap-3 text-[15px] text-foreground">
                                                <span className="font-semibold">{row.category}</span>
                                                <span className="whitespace-nowrap">
                                                    {pct(row.share)} · {rwf(row.amount)}
                                                </span>
                                            </div>
                                            <div className={TRACK}>
                                                <div className="h-2 rounded-full bg-foreground" style={{ width: `${Math.max(row.share * 100, 1.5)}%` }} />
                                            </div>
                                            <span className="text-[13px] text-muted-foreground">{usualText(row.usual)}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* By house, when every house is shown */}
                            {view === ALL_HOUSES && houses.length > 1 && (
                                <section aria-labelledby="by-house" className="flex flex-col gap-3.5">
                                    <h2 id="by-house" className={SECTION_TITLE}>
                                        By house
                                    </h2>
                                    <div className="flex flex-col gap-4">
                                        {report.byHouse.map((h) => (
                                            <div key={h.slug} className="flex flex-col gap-2">
                                                <div className="flex justify-between items-center gap-3 text-[15px] text-foreground">
                                                    <span className="flex items-center gap-2 font-semibold">
                                                        <span aria-hidden="true" className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: houseColor(h.slug) }} />
                                                        {h.name}
                                                    </span>
                                                    <span className="text-right">
                                                        {rwf(h.amount)}
                                                        {h.revenue > 0 ? ` · ${pct(h.amount / h.revenue)} of its revenue` : " · no revenue yet"}
                                                    </span>
                                                </div>
                                                <div className={TRACK}>
                                                    <div className="h-2 rounded-full" style={{ width: `${Math.max(h.share * 100, 1.5)}%`, background: houseColor(h.slug) }} />
                                                </div>
                                                <span className="text-[13px] text-muted-foreground">
                                                    {h.perNight !== null ? `${rwf(h.perNight)} per booked night · ${plural(h.nights, "night")}` : "no nights yet"}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* The five largest */}
                            <section aria-labelledby="biggest" className="flex flex-col gap-3.5">
                                <h2 id="biggest" className={SECTION_TITLE}>
                                    Biggest expenses
                                </h2>
                                <ol className="flex flex-col">
                                    {report.top.map(({ line, amount, share }) => (
                                        <li key={line.key} className="flex justify-between items-center gap-3 py-3 border-b border-[#EBEBEB] last:border-b-0">
                                            <div className="min-w-0 flex flex-col gap-0.5">
                                                <span className="text-[15px] text-foreground [overflow-wrap:anywhere]">
                                                    {line.category}
                                                    {line.note ? ` (${line.note})` : ""}
                                                </span>
                                                <span className="text-[13px] text-muted-foreground">
                                                    {houseLabel(line.house)} · {dayLabel(line.date)}
                                                </span>
                                            </div>
                                            <div className="shrink-0 flex flex-col items-end gap-0.5">
                                                <span className="text-[15px] font-bold text-foreground whitespace-nowrap">{rwf(amount)}</span>
                                                <span className="text-[13px] text-muted-foreground">{pct(share)}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ol>
                            </section>

                            {/* Spending, month by month */}
                            <section aria-labelledby="six-months" className="flex flex-col gap-3.5">
                                <h2 id="six-months" className={SECTION_TITLE}>
                                    Last six months
                                </h2>
                                <div
                                    role="group"
                                    aria-label={`Spent each month, ${report.months[0].label} to ${monthLabel(listMonth)}`}
                                    className="grid grid-cols-6 gap-2 sm:gap-3"
                                >
                                    {report.months.map((m) => {
                                        const current = m.key === listMonth
                                        return (
                                            <button
                                                key={m.key}
                                                type="button"
                                                onClick={() => showMonth(m.key)}
                                                aria-pressed={current}
                                                aria-label={`${monthLabel(m.key)}: ${rwf(m.total)}`}
                                                className="min-w-0 flex flex-col gap-2 rounded-lg hover:bg-[#F7F7F7]"
                                            >
                                                <div className="w-full flex items-end" style={{ height: CHART_HEIGHT }}>
                                                    <div
                                                        className={`w-full rounded-t ${current ? "bg-foreground" : "bg-[#B0B0B0]"}`}
                                                        style={{ height: Math.max(Math.round((m.total / chartMax) * CHART_HEIGHT), 2) }}
                                                    />
                                                </div>
                                                <div className="flex flex-col items-center gap-0.5 text-[13px] min-w-0 w-full">
                                                    <span className={`text-foreground ${current ? "font-bold" : "font-semibold"}`}>{m.label}</span>
                                                    <span className={`truncate max-w-full ${current ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                                                        {Math.round(m.total).toLocaleString("en-US")}
                                                    </span>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </section>
                        </>
                    )}
                </>
            )}

            {/* The month's expenses, one line each */}
            <div className="rounded-[20px] bg-[#F7F7F7] p-5 flex flex-col gap-3.5">
                <div className="flex flex-wrap justify-between items-end gap-3 pb-3 border-b border-border">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[13px] font-semibold text-muted-foreground">Spent in {listMonthName}</span>
                        <span className="text-[22px] font-bold tracking-[-0.02em] text-foreground">{rwf(report.total)}</span>
                    </div>
                    {report.lines.length > 0 && (
                        <span className="text-[13px] text-muted-foreground">{plural(report.lines.length, "expense")}, largest first</span>
                    )}
                </div>

                {loading ? (
                    <p className="text-sm text-muted-foreground">Loading…</p>
                ) : report.lines.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        {expenses.length === 0 ? "No expenses recorded yet." : `No expenses recorded in ${listMonthName}.`}
                    </p>
                ) : (
                    visible.map((line) => (
                        <div key={line.key} className="flex flex-col gap-2">
                            <div className="flex justify-between items-center gap-4">
                                <div className="min-w-0 flex flex-col gap-0.5">
                                    <span className="text-[15px] font-semibold text-foreground [overflow-wrap:anywhere]">
                                        {line.category}
                                        {line.note ? ` (${line.note})` : ""}
                                    </span>
                                    <span className="text-[13px] text-muted-foreground">
                                        {houseLabel(line.house)} · {dayLabel(line.date)}
                                        {view !== ALL_HOUSES && line.house === ALL_HOUSES && ` · ${rwf(line.amountRwf / houses.length)} for ${houseLabel(view)}`}
                                    </span>
                                </div>
                                <span className="flex items-center gap-1 shrink-0">
                                    <span className="text-[15px] font-semibold text-foreground whitespace-nowrap">{rwf(line.amountRwf)}</span>
                                    <button
                                        type="button"
                                        onClick={() => setConfirmDelete(confirmDelete === line.key ? null : line.key)}
                                        aria-label={`Delete ${line.category} expense of ${rwf(line.amountRwf)}`}
                                        className="w-11 h-11 -my-2 -mr-2 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </span>
                            </div>
                            {confirmDelete === line.key && (
                                <div className="flex flex-wrap items-center justify-end gap-2 text-sm">
                                    <span className="text-muted-foreground">
                                        {line.ids.length > 1 ? `Delete this expense for ${houseLabel(line.house).toLowerCase()}?` : "Delete this expense?"}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(line)}
                                        disabled={deleting === line.key}
                                        className="min-h-9 px-3 rounded-full bg-foreground text-background font-semibold disabled:opacity-50"
                                    >
                                        Delete
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setConfirmDelete(null)}
                                        className="min-h-9 px-3 rounded-full border border-[#B0B0B0] bg-card font-semibold text-foreground"
                                    >
                                        Keep
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
                {report.lines.length > FIRST_LINES && (
                    <button
                        type="button"
                        onClick={() => {
                            setShowAll((all) => !all)
                            setConfirmDelete(null)
                        }}
                        className="self-start min-h-9 text-sm font-semibold text-foreground underline"
                    >
                        {showAll ? "Show fewer" : `Show ${report.lines.length - FIRST_LINES} more from ${listMonthName}`}
                    </button>
                )}
            </div>

            {/* Copy a month's expenses into another month, and shortcuts to other months */}
            {(sourceMonths.length > 0 || otherMonths.length > 0) && (
                <div className="flex flex-wrap items-center gap-2">
                    {sourceMonths.length > 0 && (
                        <button
                            type="button"
                            onClick={openCopy}
                            className="min-h-11 px-4 rounded-full border border-[#B0B0B0] bg-card text-sm font-semibold text-foreground flex items-center gap-2 hover:bg-[#F7F7F7]"
                        >
                            <Copy className="h-4 w-4" />
                            Copy expenses from a month
                        </button>
                    )}
                    {otherMonths.map((m) => (
                        <button
                            key={m.key}
                            type="button"
                            onClick={() => showMonth(m.key)}
                            className="min-h-11 px-4 rounded-full border border-[#B0B0B0] bg-card text-sm font-semibold text-foreground hover:bg-[#F7F7F7]"
                        >
                            {monthLabel(m.key)} · {rwf(m.total)}
                        </button>
                    ))}
                </div>
            )}

            {/* Rendered in place (no portal) so it keeps the admin font and scale */}
            <DialogPrimitive.Root open={copy !== null} onOpenChange={(open) => !open && !copying && setCopy(null)}>
                <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-black/50" />
                <DialogPrimitive.Content
                    aria-describedby={undefined}
                    // Escape closes an open month list first, not the whole dialog
                    onEscapeKeyDown={(e) => document.querySelector('[role="listbox"]') && e.preventDefault()}
                    className="fixed left-1/2 top-1/2 z-[60] w-[calc(100%-2rem)] max-w-[520px] max-h-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-card p-6 sm:p-7 shadow-xl flex flex-col gap-5 outline-none"
                >
                    {copy && (
                        <>
                            <DialogPrimitive.Title className="text-[22px] font-bold tracking-[-0.02em] text-foreground">
                                Copy expenses
                            </DialogPrimitive.Title>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="min-w-0 flex flex-col gap-1.5">
                                    <span className="text-[13px] font-semibold text-muted-foreground">Copy from</span>
                                    <PillMenu
                                        options={sourceMonths.map((m) => ({ id: m, label: monthLabel(m) }))}
                                        value={copy.from}
                                        onChange={(m) => startCopy(m, copy.to)}
                                        label="Month to copy from"
                                        className={MONTH_MENU}
                                        listClassName="max-h-60 overflow-y-auto"
                                    />
                                </div>
                                <div className="min-w-0 flex flex-col gap-1.5">
                                    <span className="text-[13px] font-semibold text-muted-foreground">Copy to</span>
                                    <PillMenu
                                        options={targetMonths.map((m) => ({ id: m, label: monthLabel(m) }))}
                                        value={copy.to}
                                        onChange={(m) => startCopy(copy.from, m)}
                                        label="Month to copy to"
                                        className={MONTH_MENU}
                                        listClassName="max-h-60 overflow-y-auto"
                                    />
                                </div>
                            </div>

                            {copy.from === copy.to ? (
                                <p className="text-[15px] text-muted-foreground">Pick two different months.</p>
                            ) : (
                                <div className="flex flex-col">
                                    {lines.map((line) => {
                                        const picked = copy.picked[line.key]
                                        const there = alreadyThere(line, copy.to)
                                        const amount = Math.round(Number(copy.amounts[line.key])) || 0
                                        return (
                                            <div key={line.key} className="flex items-center gap-3 py-2.5 border-b border-[#EBEBEB] last:border-b-0">
                                                <button
                                                    type="button"
                                                    role="checkbox"
                                                    aria-checked={picked}
                                                    aria-label={`Copy ${line.category} · ${houseLabel(line.house)}`}
                                                    onClick={() => setCopy({ ...copy, picked: { ...copy.picked, [line.key]: !picked } })}
                                                    className="w-11 h-11 -m-2 shrink-0 flex items-center justify-center"
                                                >
                                                    <span
                                                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${picked ? "border-foreground bg-foreground text-background" : "border-[#B0B0B0] bg-card"}`}
                                                    >
                                                        {picked && <Check className="h-4 w-4" />}
                                                    </span>
                                                </button>
                                                <div className="flex-1 min-w-0 flex flex-col">
                                                    <span className="text-[15px] font-semibold text-foreground [overflow-wrap:anywhere]">
                                                        {line.category}
                                                        {line.note ? ` (${line.note})` : ""}
                                                    </span>
                                                    <span className="text-[13px] text-muted-foreground">
                                                        {houseLabel(line.house)}
                                                        {there && ` · already in ${monthName(copy.to)}`}
                                                        {picked && line.house === ALL_HOUSES && amount > 0 && ` · ${rwf(amount / houses.length)} each`}
                                                    </span>
                                                </div>
                                                <label className="shrink-0 flex items-center gap-1.5 rounded-xl border border-[#B0B0B0] bg-card px-3 min-h-11 focus-within:border-foreground">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        inputMode="numeric"
                                                        aria-label={`Amount for ${line.category} · ${houseLabel(line.house)}`}
                                                        value={copy.amounts[line.key]}
                                                        onChange={(e) => setCopy({ ...copy, amounts: { ...copy.amounts, [line.key]: e.target.value } })}
                                                        disabled={!picked}
                                                        className="w-[92px] bg-transparent text-right text-[15px] font-semibold text-foreground outline-none disabled:text-muted-foreground [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                    />
                                                    <span className="text-[13px] text-muted-foreground">RWF</span>
                                                </label>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            <p className="text-[15px] text-muted-foreground">
                                {chosen.length > 0
                                    ? `${chosen.length} selected · ${rwf(chosenTotal)} · saved on ${dayLabel(`${copy.to}-01`)}`
                                    : "Tick the expenses to copy. Each copy is saved on the 1st of the month."}
                            </p>

                            <div className="flex flex-col gap-2">
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    disabled={!canCopy}
                                    className="min-h-12 rounded-xl bg-primary text-primary-foreground text-base font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-45 disabled:hover:bg-primary"
                                >
                                    {copying && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {chosen.length > 0
                                        ? `Copy ${chosen.length} expense${chosen.length === 1 ? "" : "s"} to ${monthName(copy.to)}`
                                        : "Copy expenses"}
                                </button>
                                <DialogPrimitive.Close className="min-h-12 rounded-xl border border-[#B0B0B0] bg-card text-base font-semibold text-foreground hover:bg-[#F7F7F7]">
                                    Cancel
                                </DialogPrimitive.Close>
                            </div>
                        </>
                    )}
                </DialogPrimitive.Content>
            </DialogPrimitive.Root>
        </div>
    )
}
