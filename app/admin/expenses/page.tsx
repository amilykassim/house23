"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { format, parseISO, startOfMonth, subMonths } from "date-fns"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { ArrowDown, ArrowUp, Check, ChevronDown, ChevronLeft, ChevronRight, Copy, Loader2, Pencil, Plus, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { houses } from "@/lib/houses"
import { ALL_HOUSES, EXPENSE_CATEGORIES, splitEvenly, type Expense, type ExpenseCategory } from "@/lib/expenses"
import type { EarningsBooking } from "@/lib/earnings"
import { amountFor, expenseReport, monthLines, shiftMonth, usualText, type ExpenseLine, type UsualNote } from "@/lib/expense-report"
import { SegmentedControl } from "@/components/segmented-control"
import { PillMenu } from "@/components/pill-menu"
import { houseColor } from "@/components/earnings-insights"
import { forgetExpenses, forgetPersonal, loadBookings, loadExpenses, loadPersonal } from "@/lib/admin-data"
import type { PersonalExpense, StipendMonth } from "@/lib/personal"
import { PersonalCard } from "@/components/personal-card"
import { Collapse, Skeleton, rise, undoable, useCountUp, useGrown } from "@/components/admin-motion"
import { CalendarPanel, dayKey, dayLabel, monthCells } from "@/components/date-range-picker"

const HOUSE_OPTIONS = [
    ...houses.map((h) => ({ id: h.slug, label: h.name })),
    ...(houses.length > 1 ? [{ id: ALL_HOUSES, label: houses.length === 2 ? "Both houses" : "All houses" }] : []),
]
// Whose money an expense in the add form was for
const WHOSE_OPTIONS = [
    { id: "business" as const, label: "The business" },
    { id: "personal" as const, label: "Us (personal)" },
]
const houseLabel = (id: string) => HOUSE_OPTIONS.find((h) => h.id === id)?.label ?? id
const rwf = (n: number) => `${Math.round(n).toLocaleString("en-US")} RWF`
const pct = (share: number) => `${Math.round(share * 100)}%`
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`
// Lines of a month on one page of the list
const PAGE_SIZE = 5
// Other months offered as shortcuts under the list
const MONTH_SHORTCUTS = 3
// Months offered as the month to copy to: this one and the ones before it
const TARGET_MONTHS = 12
const CHART_HEIGHT = 120
// The month pills fill their column, label left and arrow right
const MONTH_MENU = "[&>button]:w-full [&>button]:justify-between [&>button]:min-h-12 [&>button]:text-[15px]"
const monthLabel = (key: string) => format(parseISO(`${key}-01`), "MMMM yyyy")
const monthName = (key: string) => format(parseISO(`${key}-01`), "MMMM")

const TILE = "min-w-0 rounded-[20px] p-5 flex flex-col gap-1.5"
const CARD = "min-w-0 rounded-[20px] border border-border bg-card p-5 sm:p-6 flex flex-col gap-4"
const CARD_TITLE = "text-[17px] font-bold tracking-[-0.01em] text-foreground"

/** 1,407,300 → "1.41M", 45,000 → "45k": short labels for the chart. */
const compact = (n: number) => {
    const r = Math.round(n)
    if (r >= 1_000_000) return `${(r / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`
    if (r >= 1_000) return `${Math.round(r / 1_000)}k`
    return String(r)
}

/** The chip beside a category: only when it moved from its usual amount, or is new. */
function usualChip(note: UsualNote): { label: string; className: string } | null {
    if (note.kind === "usual") return null
    if (note.kind === "first") return { label: "New", className: "bg-[#DBEAFE] text-[#1E40AF]" }
    // Past double, a multiple reads better than "up 2105%"
    const amount = note.kind === "up" && note.pct >= 100 ? `${((100 + note.pct) / 100).toFixed(1).replace(/\.0$/, "")}× usual` : `${note.pct}%`
    return note.kind === "up"
        ? { label: `▲ ${amount}`, className: "bg-[#FEF3C7] text-[#92400E]" }
        : { label: `▼ ${amount}`, className: "bg-[#F2F2F2] text-[#555555]" }
}
const ARROW_BUTTON =
    "w-11 h-11 shrink-0 rounded-full border border-[#B0B0B0] bg-card flex items-center justify-center text-foreground hover:bg-[#F7F7F7] disabled:text-[#B0B0B0] disabled:hover:bg-card"

export default function AdminExpensesPage() {
    const today = dayKey(new Date())
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [bookings, setBookings] = useState<EarningsBooking[]>([])
    const [loading, setLoading] = useState(true)
    // The add form stays folded until "Add an expense" is pressed
    const [formOpen, setFormOpen] = useState(false)
    // A business expense (default), or money we took for ourselves
    const [whose, setWhose] = useState<"business" | "personal">("business")
    const [personal, setPersonal] = useState<{ expenses: PersonalExpense[]; stipends: StipendMonth[] }>({ expenses: [], stipends: [] })
    const [personalLoading, setPersonalLoading] = useState(true)
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
    // Page of the month's list, from 1
    const [page, setPage] = useState(1)
    // The line folding away after Delete (by its key), and which way pages move
    const [leaving, setLeaving] = useState<string | null>(null)
    const [pageDir, setPageDir] = useState<"next" | "prev">("next")
    // "Where it goes": the category opened to show its expenses, and the line being edited
    const [openCategory, setOpenCategory] = useState<string | null>(null)
    const [editing, setEditing] = useState<ExpenseDraft | null>(null)
    const [savingEdit, setSavingEdit] = useState(false)
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

    const fetchPersonal = useCallback(async () => {
        try {
            const data = await loadPersonal<{ expenses?: PersonalExpense[]; stipends?: StipendMonth[] }>()
            setPersonal({ expenses: data.expenses ?? [], stipends: data.stipends ?? [] })
        } catch {
            // keep whatever is on screen
        } finally {
            setPersonalLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchExpenses()
        fetchPersonal()
        // Bookings give the month's revenue and booked nights; without them the
        // report still shows what was spent
        loadBookings<EarningsBooking>()
            .then(setBookings)
            .catch(() => {})
    }, [fetchExpenses, fetchPersonal])

    const paid = Number(amount)
    // An expense for all houses is saved as an equal share for each
    const shares = house === ALL_HOUSES ? splitEvenly(Math.round(paid) || 0, houses.length) : []
    const splitText =
        shares.length === 0
            ? ""
            : shares.every((s) => s === shares[0])
                ? `${rwf(shares[0])} for each house`
                : shares.map((s, i) => `${rwf(s)} for ${houses[i].name}`).join(", ")
    const canSave = paid > 0 && !saving && (whose === "personal" || shares.every((s) => s > 0))

    // Expenses can't be dated in the future
    const cells = useMemo(() => monthCells(month, (key) => ({ disabled: key > today })), [month, today])

    const monthKey = today.slice(0, 7)
    const report = useMemo(() => expenseReport(expenses, bookings, listMonth, view), [expenses, bookings, listMonth, view])
    const pageCount = Math.max(1, Math.ceil(report.lines.length / PAGE_SIZE))
    // Held to the last page, so deleting its only line never leaves an empty page
    const currentPage = Math.min(page, pageCount)
    const firstShown = (currentPage - 1) * PAGE_SIZE
    const visible = report.lines.slice(firstShown, firstShown + PAGE_SIZE)
    const goToPage = (next: number) => {
        setPageDir(next > currentPage ? "next" : "prev")
        setPage(next)
    }
    const listMonthName = monthName(listMonth)
    const previousMonthName = monthName(shiftMonth(listMonth, -1))
    // The arrows stop at the oldest month with an expense and at this month
    const oldestMonth = [...expenses, ...personal.expenses].reduce((oldest, e) => (e.date.slice(0, 7) < oldest ? e.date.slice(0, 7) : oldest), monthKey)
    const showMonth = (key: string) => {
        setListMonth(key)
        setPage(1)
        setOpenCategory(null)
        setEditing(null)
    }
    const stepMonth = (step: number) => showMonth(shiftMonth(listMonth, step))
    const topCategory = report.categories[0]
    const chartMax = Math.max(...report.months.map((m) => m.total), 1)
    const hasSpending = report.total > 0
    // Motion: the month's total counts up once when the page arrives; bars grow in
    const ready = !loading
    const shownTotal = useCountUp(report.total, ready)
    const grown = useGrown(ready)
    const expensesRef = useRef(expenses)
    expensesRef.current = expenses

    const handleSave = async () => {
        if (!canSave) return
        if (whose === "personal") return handleSavePersonal()
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

    // Money we took for ourselves: saved apart, never a business expense
    const handleSavePersonal = async () => {
        setSaving(true)
        try {
            const res = await fetch("/api/personal-expenses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amountRwf: paid, date, note }),
            })
            if (!res.ok) throw new Error("Request failed")
            forgetPersonal()
            toast.success("Personal expense saved", { description: `${rwf(paid)}${note.trim() ? ` · ${note.trim()}` : ""}` })
            setAmount("")
            setNote("")
            setDate(today)
            setCalendarOpen(false)
            setFormOpen(false)
            showMonth(date.slice(0, 7))
            fetchPersonal()
        } catch {
            toast.error("Couldn't save the personal expense", { description: "Nothing was recorded. Try again." })
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

    // Deletes a line (one expense, or every house's share of a split one). It
    // folds away at once; the delete goes out when the Undo toast runs out.
    const handleDelete = (line: ExpenseLine) => {
        if (leaving) return
        setLeaving(line.key)
        setEditing(null)
        setTimeout(() => {
            const rows = expensesRef.current.filter((e) => line.ids.includes(e.id))
            const putBack = (back: Expense[]) =>
                setExpenses((prev) =>
                    [...prev, ...back.filter((r) => !prev.some((e) => e.id === r.id))].sort(
                        (x, y) => y.date.localeCompare(x.date) || y.createdAt.localeCompare(x.createdAt)
                    )
                )
            setExpenses((prev) => prev.filter((e) => !line.ids.includes(e.id)))
            setLeaving(null)
            undoable({
                title: "Expense deleted",
                description: `${line.category}${line.note ? ` · ${line.note}` : ""} · ${rwf(line.amountRwf)}`,
                undo: () => putBack(rows),
                send: async () => {
                    const removed: string[] = []
                    try {
                        for (const id of line.ids) {
                            const res = await fetch(`/api/expenses?id=${encodeURIComponent(id)}`, { method: "DELETE", keepalive: true })
                            if (!res.ok) throw new Error("Request failed")
                            removed.push(id)
                        }
                    } catch {
                        putBack(rows.filter((r) => !removed.includes(r.id)))
                        toast.error("Couldn't delete the expense", {
                            description: removed.length > 0 ? "Only part of it was deleted. Check the list and try again." : "It is back in the list. Try again.",
                        })
                    } finally {
                        forgetExpenses()
                    }
                },
            })
        }, 300)
    }

    // Saves the line being edited: every stored row behind it changes together
    const handleEdit = async (line: ExpenseLine) => {
        if (!editing || editing.key !== line.key) return
        setSavingEdit(true)
        try {
            const res = await fetch("/api/expenses", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ids: line.ids,
                    category: editing.category,
                    note: editing.note,
                    amountRwf: Math.round(Number(editing.amount)),
                    date: editing.date,
                }),
            })
            if (!res.ok) throw new Error("Request failed")
            forgetExpenses()
            const movedTo = [
                editing.category !== line.category && editing.category,
                editing.date.slice(0, 7) !== line.date.slice(0, 7) && monthLabel(editing.date.slice(0, 7)),
            ].filter(Boolean)
            toast.success("Expense updated", { description: movedTo.length > 0 ? `Moved to ${movedTo.join(", ")}` : undefined })
            setEditing(null)
            await fetchExpenses()
        } catch {
            toast.error("Couldn't update the expense", { description: "Nothing was changed. Try again." })
        } finally {
            setSavingEdit(false)
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
        <div className="[zoom:0.88] px-4 pt-7 sm:pt-12 pb-14 max-w-[592px] lg:max-w-[1040px] mx-auto flex flex-col gap-6 sm:gap-7">
            <div {...rise(0)} className="m-rise flex flex-col">
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

            <Collapse open={formOpen} id="add-expense">
                <div className="pt-6 sm:pt-7">
                <div className="w-full max-w-[592px] rounded-[20px] border border-border bg-card p-4 sm:p-5 flex flex-col gap-5">
                    {/* Whose money it was for */}
                    <div className="flex flex-col gap-2.5">
                        <span className="text-[15px] font-semibold text-foreground">Whose money was it for?</span>
                        <SegmentedControl
                            className="self-start max-w-full"
                            itemClassName="px-3 sm:px-[22px]"
                            options={WHOSE_OPTIONS}
                            value={whose}
                            onChange={setWhose}
                        />
                        {whose === "personal" && (
                            <span className="text-[13px] text-muted-foreground">
                                Money we took from the business for our own life. It won&apos;t count as a business expense.
                            </span>
                        )}
                    </div>

                    {whose === "business" && (
                    <>
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
                    </>
                    )}

                    {/* Amount */}
                    <label className="rounded-2xl border border-[#B0B0B0] bg-card px-5 py-[18px] flex flex-col gap-0.5 focus-within:border-foreground focus-within:ring-1 focus-within:ring-foreground">
                        <span className="text-[13px] font-semibold text-muted-foreground">{whose === "personal" ? "Amount taken" : "Amount spent"}</span>
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
                            RWF{whose === "business" && house === ALL_HOUSES && paid > 0 && ` · split between the houses: ${splitText}`}
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
                                <span className="text-[13px] font-semibold text-muted-foreground">{whose === "personal" ? "What was it for?" : "Note (optional)"}</span>
                                <input
                                    type="text"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder={whose === "personal" ? "e.g. groceries" : "e.g. plumber"}
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
                        {whose === "personal" ? "Save personal expense" : "Save expense"}
                    </button>
                </div>
                </div>
            </Collapse>
            </div>

            {/* Which house the report is about */}
            {houses.length > 1 && (
                <div {...rise(1)} className="m-rise self-start max-w-full">
                <SegmentedControl
                    className="max-w-full"
                    itemClassName="px-3 sm:px-[22px]"
                    options={HOUSE_OPTIONS}
                    value={view}
                    onChange={(next) => {
                        setView(next)
                        setPage(1)
                        setOpenCategory(null)
                        setEditing(null)
                    }}
                />
                </div>
            )}

            {/* One month at a time */}
            <div {...rise(2)} className="m-rise flex items-center gap-3">
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
                <div aria-label="Loading the month" className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 gap-3">
                        {[0, 1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-[118px] rounded-[20px]" />
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-6">
                        <Skeleton className="h-[380px] rounded-[20px]" />
                        <Skeleton className="h-[380px] rounded-[20px]" />
                    </div>
                </div>
            ) : (
                <>
                    {/* The month at a glance */}
                    <section aria-label={`${listMonthName} at a glance`} className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div {...rise(3)} className={`${TILE} m-rise m-lift bg-foreground text-background`}>
                            <span className="text-[13px] font-semibold text-background/75">Spent in {listMonthName}</span>
                            <span className="text-[26px] leading-tight font-bold tracking-[-0.02em] tabular-nums">{rwf(shownTotal)}</span>
                            <span className="text-[13px] flex items-center gap-1.5">{changeLine}</span>
                        </div>
                        <div {...rise(4)} className={`${TILE} m-rise m-lift bg-[#F7F7F7]`}>
                            <span className="text-[13px] font-semibold text-muted-foreground">Per booked night</span>
                            <span className="text-[22px] leading-tight font-bold tracking-[-0.02em] text-foreground tabular-nums">
                                {report.nights > 0 ? rwf(shownTotal / report.nights) : "–"}
                            </span>
                            <span className="text-[13px] text-muted-foreground">
                                {report.nights > 0 ? `${plural(report.nights, "night")} booked` : "no nights yet"}
                            </span>
                        </div>
                        <div {...rise(5)} className={`${TILE} m-rise m-lift bg-[#F7F7F7]`}>
                            <span className="text-[13px] font-semibold text-muted-foreground">Biggest cost</span>
                            <span className="text-[22px] leading-tight font-bold tracking-[-0.02em] text-foreground">{topCategory?.category ?? "–"}</span>
                            <span className="text-[13px] text-muted-foreground">{topCategory ? rwf(topCategory.amount) : "nothing yet"}</span>
                        </div>
                        <div {...rise(6)} className={`${TILE} m-rise m-lift bg-[#F7F7F7]`}>
                            <span className="text-[13px] font-semibold text-muted-foreground">Share of revenue</span>
                            <span className="text-[22px] leading-tight font-bold tracking-[-0.02em] text-foreground tabular-nums">
                                {report.revenue > 0 ? pct(shownTotal / report.revenue) : "–"}
                            </span>
                            <span className="text-[13px] text-muted-foreground">{report.revenue > 0 ? `of ${rwf(report.revenue)}` : "no revenue yet"}</span>
                        </div>
                    </section>

                    {!hasSpending ? (
                        <p className="text-sm text-muted-foreground">The breakdown appears once {listMonthName} has an expense.</p>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-6 items-start">
                            {/* By category, largest first */}
                            <section aria-labelledby="where-it-goes" {...rise(7)} className={`${CARD} m-rise m-card`}>
                                <div className="flex items-baseline justify-between gap-3">
                                    <h2 id="where-it-goes" className={CARD_TITLE}>
                                        Where it goes
                                    </h2>
                                    <span className="text-[13px] text-muted-foreground">{plural(report.categories.length, "category")}</span>
                                </div>
                                <ul className="flex flex-col gap-4">
                                    {report.categories.map((row, i) => {
                                        const note = usualChip(row.usual)
                                        const open = openCategory === row.category
                                        const items = report.lines.filter((line) => line.category === row.category)
                                        return (
                                            <li key={row.category} className="flex flex-col">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setOpenCategory(open ? null : row.category)
                                                        setEditing(null)
                                                    }}
                                                    aria-expanded={open}
                                                    aria-controls={`category-${i}`}
                                                    className="-mx-2 px-2 py-1.5 rounded-xl flex flex-col gap-2 text-left m-row hover:bg-[#F7F7F7]"
                                                >
                                                    <span className="w-full flex items-center justify-between gap-3">
                                                        <span className="min-w-0 flex items-center gap-2">
                                                            <span className="text-[15px] font-semibold text-foreground truncate">{row.category}</span>
                                                            {note && (
                                                                <span
                                                                    title={usualText(row.usual)}
                                                                    className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${note.className}`}
                                                                >
                                                                    {note.label}
                                                                    <span className="sr-only"> ({usualText(row.usual)})</span>
                                                                </span>
                                                            )}
                                                        </span>
                                                        <span className="shrink-0 flex items-center gap-2 tabular-nums">
                                                            <span className="text-[15px] font-semibold text-foreground">{rwf(row.amount)}</span>
                                                            <span className="w-9 text-right text-[13px] text-muted-foreground">{pct(row.share)}</span>
                                                            <ChevronDown
                                                                aria-hidden="true"
                                                                className={`m-chevron h-4 w-4 text-muted-foreground ${open ? "rotate-180" : ""}`}
                                                            />
                                                        </span>
                                                    </span>
                                                    <span className="block w-full h-1.5 rounded-full bg-[#EBEBEB] overflow-hidden">
                                                        <span
                                                            className={`m-grow-w block h-full rounded-full ${i === 0 ? "bg-foreground" : "bg-[#6A6A6A]"}`}
                                                            style={{ width: grown ? `${Math.max(row.share * 100, 1)}%` : "0%" }}
                                                        />
                                                    </span>
                                                </button>

                                                {/* The category's expenses, each one editable */}
                                                <Collapse open={open} id={`category-${i}`}>
                                                    <ul className="mt-2 rounded-2xl bg-[#F7F7F7] divide-y divide-[#E5E5E5]">
                                                        {items.map((line) => {
                                                            const isEditing = editing?.key === line.key
                                                            return (
                                                                <li key={line.key} className={`m-row px-3.5 py-3 flex flex-col gap-3 ${leaving === line.key ? "m-fold-away" : ""}`}>
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                                                                            <span className="text-[15px] font-semibold text-foreground [overflow-wrap:anywhere]">
                                                                                {line.note || <span className="font-normal text-muted-foreground">No name</span>}
                                                                            </span>
                                                                            <span className="text-[13px] text-muted-foreground">
                                                                                {dayLabel(line.date)} · {houseLabel(line.house)}
                                                                            </span>
                                                                        </div>
                                                                        <span className="shrink-0 text-[15px] font-bold text-foreground tabular-nums whitespace-nowrap">
                                                                            {rwf(line.amountRwf)}
                                                                        </span>
                                                                        <span className="shrink-0 flex items-center -mr-1.5">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setEditing(
                                                                                        isEditing
                                                                                            ? null
                                                                                            : { key: line.key, category: line.category, note: line.note, amount: String(line.amountRwf), date: line.date }
                                                                                    )
                                                                                }}
                                                                                aria-label={`Edit ${line.category} expense of ${rwf(line.amountRwf)}`}
                                                                                aria-expanded={isEditing}
                                                                                className={`m-quiet w-11 h-11 rounded-full flex items-center justify-center hover:bg-white hover:text-foreground ${isEditing ? "bg-white text-foreground" : "text-[#6A6A6A]"}`}
                                                                            >
                                                                                <Pencil className="h-4 w-4" />
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleDelete(line)}
                                                                                disabled={leaving !== null}
                                                                                aria-label={`Delete ${line.category} expense of ${rwf(line.amountRwf)}`}
                                                                                className="m-quiet w-11 h-11 rounded-full flex items-center justify-center text-[#6A6A6A] hover:bg-white hover:text-foreground"
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </button>
                                                                        </span>
                                                                    </div>

                                                                    <Collapse open={isEditing} className="-mt-3">
                                                                    {isEditing && editing && (
                                                                        <div className="pt-3">
                                                                        <EditExpenseForm
                                                                            line={line}
                                                                            value={editing}
                                                                            onChange={setEditing}
                                                                            onCancel={() => setEditing(null)}
                                                                            onSave={() => handleEdit(line)}
                                                                            saving={savingEdit}
                                                                            today={today}
                                                                        />
                                                                        </div>
                                                                    )}
                                                                    </Collapse>
                                                                </li>
                                                            )
                                                        })}
                                                    </ul>
                                                </Collapse>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </section>

                            <div className="min-w-0 flex flex-col gap-6">
                                {/* By house, when every house is shown */}
                                {view === ALL_HOUSES && houses.length > 1 && (
                                    <section aria-labelledby="by-house" {...rise(8)} className={`${CARD} m-rise m-card`}>
                                        <h2 id="by-house" className={CARD_TITLE}>
                                            By house
                                        </h2>
                                        {/* One bar, split by house */}
                                        <div className="flex h-2.5 gap-0.5 rounded-full overflow-hidden" aria-hidden="true">
                                            {report.byHouse
                                                .filter((h) => h.amount > 0)
                                                .map((h) => (
                                                    <div
                                                        key={h.slug}
                                                        className="m-grow-w"
                                                        style={{ width: grown ? `${(h.amount / Math.max(report.total, 1)) * 100}%` : "0%", background: houseColor(h.slug) }}
                                                    />
                                                ))}
                                        </div>
                                        <ul className="flex flex-col gap-3.5">
                                            {report.byHouse.map((h) => (
                                                <li key={h.slug} className="flex flex-col gap-0.5">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <span className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
                                                            <span aria-hidden="true" className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: houseColor(h.slug) }} />
                                                            {h.name}
                                                        </span>
                                                        <span className="text-[15px] font-semibold text-foreground tabular-nums">{rwf(h.amount)}</span>
                                                    </div>
                                                    <span className="pl-[18px] text-[13px] text-muted-foreground">
                                                        {h.revenue > 0 ? `${pct(h.amount / h.revenue)} of its revenue` : "no revenue yet"}
                                                        {h.perNight !== null ? ` · ${rwf(h.perNight)} per booked night · ${plural(h.nights, "night")}` : " · no nights yet"}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                )}

                                {/* Spending, month by month */}
                                <section aria-labelledby="six-months" {...rise(9)} className={`${CARD} m-rise m-card`}>
                                    <div className="flex items-baseline justify-between gap-3">
                                        <h2 id="six-months" className={CARD_TITLE}>
                                            Last six months
                                        </h2>
                                        <span className="text-[13px] text-muted-foreground">tap a month to open it</span>
                                    </div>
                                    <div
                                        role="group"
                                        aria-label={`Spent each month, ${report.months[0].label} to ${monthLabel(listMonth)}`}
                                        className="grid grid-cols-6 gap-1.5 sm:gap-2"
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
                                                    className="min-w-0 flex flex-col items-center gap-1.5 rounded-lg pt-1 pb-1.5 hover:bg-[#F7F7F7]"
                                                >
                                                    <span className={`text-xs tabular-nums ${current ? "font-bold text-foreground" : "text-muted-foreground"}`}>
                                                        {compact(m.total)}
                                                    </span>
                                                    <div className="w-full px-1 flex items-end" style={{ height: CHART_HEIGHT }}>
                                                        <div
                                                            className={`m-grow-h w-full rounded-md ${current ? "bg-foreground" : "bg-[#D5D5D5]"}`}
                                                            style={{ height: grown ? Math.max(Math.round((m.total / chartMax) * CHART_HEIGHT), 3) : 3 }}
                                                        />
                                                    </div>
                                                    <span className={`text-[13px] text-foreground ${current ? "font-bold" : "font-medium"}`}>{m.label}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </section>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* The month's business expenses beside the money we took for ourselves */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-6 items-start">
            {/* The month's expenses, one line each */}
            <section aria-labelledby="month-expenses" {...rise(loading ? 3 : 10)} className="m-rise m-card min-w-0 rounded-[20px] border border-border bg-card overflow-hidden">
                <div className="px-5 sm:px-6 pt-5 pb-4 flex flex-wrap items-end justify-between gap-3 border-b border-border">
                    <div className="flex flex-col gap-0.5">
                        <h2 id="month-expenses" className="text-[13px] font-semibold text-muted-foreground">
                            Spent in {listMonthName}
                        </h2>
                        <span className="text-[26px] leading-tight font-bold tracking-[-0.02em] text-foreground tabular-nums">{rwf(shownTotal)}</span>
                    </div>
                    {report.lines.length > 0 && (
                        <span className="text-[13px] text-muted-foreground">{plural(report.lines.length, "expense")} · largest first</span>
                    )}
                </div>

                {loading ? (
                    <div aria-label="Loading the expenses" className="px-5 sm:px-6 py-4 flex flex-col gap-3">
                        {[0, 1, 2].map((i) => (
                            <Skeleton key={i} className="h-14 rounded-xl" />
                        ))}
                    </div>
                ) : report.lines.length === 0 ? (
                    <p className="px-5 sm:px-6 py-5 text-sm text-muted-foreground">
                        {expenses.length === 0 ? "No expenses recorded yet." : `No expenses recorded in ${listMonthName}.`}
                    </p>
                ) : (
                    <ul key={`${listMonth}:${view}:${currentPage}`}>
                        {visible.map((line, i) => {
                            const counted = amountFor(line, view)
                            const day = parseISO(line.date)
                            return (
                                <li
                                    key={line.key}
                                    className={`m-row border-b border-[#EBEBEB] last:border-b-0 ${leaving === line.key ? "m-fold-away" : pageDir === "next" ? "m-in-next" : "m-in-prev"}`}
                                    style={{ animationDelay: leaving === line.key ? undefined : `${i * 40}ms` }}
                                >
                                    <div className="px-4 sm:px-6 py-3 flex items-center gap-3 sm:gap-4">
                                        {/* The date as a small calendar leaf */}
                                        <div aria-hidden="true" className="w-12 shrink-0 rounded-xl bg-[#F7F7F7] py-1.5 flex flex-col items-center leading-none">
                                            <span className="text-[17px] font-bold text-foreground">{format(day, "d")}</span>
                                            <span className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{format(day, "MMM")}</span>
                                        </div>
                                        <div className="min-w-0 flex-1 flex flex-col gap-1">
                                            <span className="text-[15px] font-semibold text-foreground [overflow-wrap:anywhere]">
                                                {line.category}
                                                {line.note && <span className="font-normal text-muted-foreground"> · {line.note}</span>}
                                            </span>
                                            <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-muted-foreground">
                                                <span className="sr-only">{dayLabel(line.date)}, </span>
                                                <span className="inline-flex items-center gap-1.5">
                                                    <span aria-hidden="true" className="flex -space-x-1">
                                                        {(line.house === ALL_HOUSES ? houses.map((h) => h.slug) : [line.house]).map((slug) => (
                                                            <span key={slug} className="w-2.5 h-2.5 rounded-full ring-2 ring-card" style={{ background: houseColor(slug) }} />
                                                        ))}
                                                    </span>
                                                    {houseLabel(line.house)}
                                                </span>
                                                {view !== ALL_HOUSES && line.house === ALL_HOUSES && <span>{rwf(counted)} for {houseLabel(view)}</span>}
                                            </span>
                                        </div>
                                        <div className="shrink-0 flex flex-col items-end gap-0.5 tabular-nums">
                                            <span className="text-[15px] font-bold text-foreground whitespace-nowrap">{rwf(line.amountRwf)}</span>
                                            {report.total > 0 && <span className="text-[13px] text-muted-foreground">{pct(counted / report.total)}</span>}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(line)}
                                            disabled={leaving !== null}
                                            aria-label={`Delete ${line.category} expense of ${rwf(line.amountRwf)}`}
                                            className="m-quiet w-11 h-11 -mr-2 shrink-0 rounded-full flex items-center justify-center text-[#6A6A6A] hover:text-foreground hover:bg-muted"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                )}
                {pageCount > 1 && (
                    <nav aria-label="Pages of expenses" className="px-5 sm:px-6 py-3 border-t border-border flex flex-wrap items-center justify-between gap-3">
                        <span className="text-[13px] text-muted-foreground tabular-nums">
                            {firstShown + 1}–{firstShown + visible.length} of {report.lines.length}
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                aria-label="Previous page"
                                className="w-10 h-10 rounded-full flex items-center justify-center text-foreground hover:bg-[#F2F2F2] disabled:text-[#B0B0B0] disabled:hover:bg-transparent"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <div className="relative flex gap-1">
                                {/* The dark pill slides to the page shown */}
                                <span
                                    aria-hidden="true"
                                    className="m-thumb absolute left-0 top-0 w-10 h-10 rounded-full bg-foreground shadow-[0_6px_14px_-6px_rgba(0,0,0,0.45)]"
                                    style={{ transform: `translateX(${(currentPage - 1) * 44}px)` }}
                                />
                                {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                                    <button
                                        key={n}
                                        type="button"
                                        onClick={() => goToPage(n)}
                                        aria-current={n === currentPage ? "page" : undefined}
                                        aria-label={`Page ${n}`}
                                        className={`relative w-10 h-10 rounded-full text-sm font-semibold tabular-nums ${n === currentPage ? "text-background" : "text-foreground hover:bg-[#F2F2F2]"}`}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage === pageCount}
                                aria-label="Next page"
                                className="w-10 h-10 rounded-full flex items-center justify-center text-foreground hover:bg-[#F2F2F2] disabled:text-[#B0B0B0] disabled:hover:bg-transparent"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </nav>
                )}
            </section>

            <PersonalCard
                month={listMonth}
                expenses={personal.expenses}
                stipends={personal.stipends}
                loading={personalLoading}
                businessTotal={report.total}
                revenue={report.revenue}
                showTotals={view === ALL_HOUSES && !loading}
                riseIndex={loading ? 4 : 11}
                onChanged={fetchPersonal}
            />
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
                <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
                <DialogPrimitive.Content
                    aria-describedby={undefined}
                    // Escape closes an open month list first, not the whole dialog
                    onEscapeKeyDown={(e) => document.querySelector('[role="listbox"]') && e.preventDefault()}
                    className="fixed left-1/2 top-1/2 z-[60] w-[calc(100%-2rem)] max-w-[520px] max-h-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-card p-6 sm:p-7 shadow-xl flex flex-col gap-5 outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 duration-200"
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

// An expense line being edited from "Where it goes"
interface ExpenseDraft {
    key: string
    category: ExpenseCategory
    note: string
    amount: string
    date: string
}

/** Rename, move to another category, change the amount or the date of one expense line. */
function EditExpenseForm({
    line,
    value,
    onChange,
    onCancel,
    onSave,
    saving,
    today,
}: {
    line: ExpenseLine
    value: ExpenseDraft
    onChange: (next: ExpenseDraft) => void
    onCancel: () => void
    onSave: () => void
    saving: boolean
    today: string
}) {
    const amount = Math.round(Number(value.amount))
    const split = line.ids.length > 1
    const shares = split && amount > 0 ? splitEvenly(amount, line.ids.length) : []
    const changed =
        value.category !== line.category || value.note.trim() !== line.note || amount !== line.amountRwf || value.date !== line.date
    const valid = amount > 0 && /^\d{4}-\d{2}-\d{2}$/.test(value.date) && value.date <= today && shares.every((s) => s > 0)
    const field = "rounded-xl border border-[#B0B0B0] bg-card px-3.5 py-2.5 flex flex-col gap-0.5 focus-within:border-foreground focus-within:ring-1 focus-within:ring-foreground"
    const input = "w-full bg-transparent text-[16px] text-foreground placeholder:text-[#8A8A8A] outline-none"

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault()
                if (changed && valid && !saving) onSave()
            }}
            className="p-3.5 rounded-xl bg-card flex flex-col gap-3.5"
        >
            <label className={field}>
                <span className="text-[13px] font-semibold text-muted-foreground">Name</span>
                <input
                    type="text"
                    value={value.note}
                    onChange={(e) => onChange({ ...value, note: e.target.value })}
                    placeholder="e.g. plumber"
                    maxLength={200}
                    autoComplete="off"
                    className={input}
                />
            </label>

            <div className="flex flex-col gap-2">
                <span className="text-[13px] font-semibold text-muted-foreground">Category</span>
                <div className="flex flex-wrap gap-1.5">
                    {EXPENSE_CATEGORIES.map((c) => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => onChange({ ...value, category: c })}
                            aria-pressed={value.category === c}
                            className={`min-h-10 px-3.5 rounded-full border text-sm font-semibold ${value.category === c
                                ? "border-foreground bg-foreground text-background"
                                : "border-[#B0B0B0] bg-card text-foreground hover:bg-[#F7F7F7]"
                                }`}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2.5">
                <label className={field}>
                    <span className="text-[13px] font-semibold text-muted-foreground">Amount, RWF</span>
                    <input
                        type="number"
                        min="1"
                        inputMode="numeric"
                        value={value.amount}
                        onChange={(e) => onChange({ ...value, amount: e.target.value })}
                        className={`${input} tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                    />
                </label>
                <label className={field}>
                    <span className="text-[13px] font-semibold text-muted-foreground">Date</span>
                    <input
                        type="date"
                        value={value.date}
                        max={today}
                        onChange={(e) => onChange({ ...value, date: e.target.value })}
                        className={input}
                    />
                </label>
            </div>

            {(split || line.key.startsWith("PW-")) && (
                <div className="flex flex-col gap-1 text-[13px] text-muted-foreground">
                    {split && shares.length > 0 && (
                        <p>
                            Split between the houses:{" "}
                            {shares.every((s) => s === shares[0])
                                ? `${rwf(shares[0])} each`
                                : shares.map((s, i) => `${rwf(s)} for ${houses[i].name}`).join(", ")}
                            .
                        </p>
                    )}
                    {line.key.startsWith("PW-") && <p>Added by Pennywise. If it changes there, Pennywise sends it again and this edit is replaced.</p>}
                </div>
            )}

            <div className="flex flex-wrap justify-end gap-2">
                <button type="button" onClick={onCancel} className="min-h-11 px-5 rounded-full border border-[#B0B0B0] bg-card text-sm font-semibold text-foreground hover:bg-[#F7F7F7]">
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={!changed || !valid || saving}
                    className="min-h-11 px-5 rounded-full bg-foreground text-background text-sm font-bold flex items-center gap-2 hover:bg-foreground/85 disabled:opacity-45"
                >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save changes
                </button>
            </div>
        </form>
    )
}
