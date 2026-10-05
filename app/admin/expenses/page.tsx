"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { format, parseISO, startOfMonth } from "date-fns"
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { houses } from "@/lib/houses"
import { ALL_HOUSES, EXPENSE_CATEGORIES, splitEvenly, type Expense, type ExpenseCategory } from "@/lib/expenses"
import { SegmentedControl } from "@/components/segmented-control"
import { forgetExpenses, loadExpenses } from "@/lib/admin-data"
import { CalendarPanel, dayKey, dayLabel, monthCells } from "@/components/date-range-picker"

const HOUSE_OPTIONS = [
    ...houses.map((h) => ({ id: h.slug, label: h.name })),
    ...(houses.length > 1 ? [{ id: ALL_HOUSES, label: houses.length === 2 ? "Both houses" : "All houses" }] : []),
]
const houseLabel = (id: string) => HOUSE_OPTIONS.find((h) => h.id === id)?.label ?? id
const rwf = (n: number) => `${Math.round(n).toLocaleString("en-US")} RWF`
const RECENT_COUNT = 3

export default function AdminExpensesPage() {
    const today = dayKey(new Date())
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [loading, setLoading] = useState(true)
    const [house, setHouse] = useState(houses[0].slug)
    const [category, setCategory] = useState<ExpenseCategory>(EXPENSE_CATEGORIES[0])
    const [amount, setAmount] = useState("")
    const [date, setDate] = useState(today)
    const [note, setNote] = useState("")
    const [calendarOpen, setCalendarOpen] = useState(false)
    const [month, setMonth] = useState(() => startOfMonth(new Date()))
    const [saving, setSaving] = useState(false)
    const [showAll, setShowAll] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
    const [deleting, setDeleting] = useState<string | null>(null)

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
    const monthTotal = useMemo(
        () => expenses.filter((e) => e.date.startsWith(monthKey)).reduce((sum, e) => sum + e.amountRwf, 0),
        [expenses, monthKey]
    )
    const visible = showAll ? expenses : expenses.slice(0, RECENT_COUNT)

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
            fetchExpenses()
        } catch {
            toast.error("Couldn't save the expense", { description: "Nothing was recorded. Try again." })
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        setDeleting(id)
        try {
            const res = await fetch(`/api/expenses?id=${encodeURIComponent(id)}`, { method: "DELETE" })
            if (!res.ok) throw new Error("Request failed")
            forgetExpenses()
            setExpenses((prev) => prev.filter((e) => e.id !== id))
            toast.success("Expense deleted")
        } catch {
            toast.error("Couldn't delete the expense")
        } finally {
            setDeleting(null)
            setConfirmDelete(null)
        }
    }

    const fieldCard = "min-w-0 rounded-2xl border-2 bg-card px-3.5 sm:px-[17px] py-[15px] flex flex-col gap-1.5"

    return (
        // zoom scales the whole page down a notch on every screen size
        <div className="[zoom:0.88] px-4 pt-7 sm:pt-12 pb-14 max-w-[592px] mx-auto flex flex-col gap-6 sm:gap-7">
            <h1 className="text-[28px] sm:text-[34px] leading-tight font-bold tracking-[-0.02em] text-foreground">
                Add an expense
            </h1>

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

            {/* This month + recent expenses */}
            <div className="rounded-[20px] bg-[#F7F7F7] p-5 flex flex-col gap-3">
                <div className="flex justify-between items-baseline gap-4">
                    <span className="text-[13px] font-semibold text-muted-foreground">
                        Spent in {format(new Date(), "MMMM")}
                    </span>
                    <span className="text-xl font-bold text-foreground">{rwf(monthTotal)}</span>
                </div>
                {loading ? (
                    <p className="text-sm text-muted-foreground">Loading…</p>
                ) : expenses.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No expenses recorded yet.</p>
                ) : (
                    visible.map((e) => (
                        <div key={e.id} className="flex flex-col gap-2">
                            <div className="flex justify-between items-center gap-4 text-sm">
                                <span className="min-w-0 text-muted-foreground">
                                    {e.category}
                                    {e.note ? ` (${e.note})` : ""} · {houseLabel(e.house)} · {dayLabel(e.date)}
                                </span>
                                <span className="flex items-center gap-1 shrink-0">
                                    <span className="font-semibold text-foreground whitespace-nowrap">{rwf(e.amountRwf)}</span>
                                    {showAll && (
                                        <button
                                            type="button"
                                            onClick={() => setConfirmDelete(confirmDelete === e.id ? null : e.id)}
                                            aria-label={`Delete ${e.category} expense of ${rwf(e.amountRwf)}`}
                                            className="w-11 h-11 -my-2 -mr-2 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </span>
                            </div>
                            {confirmDelete === e.id && (
                                <div className="flex items-center justify-end gap-2 text-sm">
                                    <span className="text-muted-foreground">Delete this expense?</span>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(e.id)}
                                        disabled={deleting === e.id}
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
                {expenses.length > 0 && (
                    <button
                        type="button"
                        onClick={() => {
                            setShowAll((all) => !all)
                            setConfirmDelete(null)
                        }}
                        className="self-start min-h-9 text-sm font-semibold text-foreground underline"
                    >
                        {showAll ? "Show fewer" : `See all expenses (${expenses.length})`}
                    </button>
                )}
            </div>
        </div>
    )
}
