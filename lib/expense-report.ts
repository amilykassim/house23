import { addMonths, format, parseISO } from "date-fns"
import { ALL_HOUSES, type Expense, type ExpenseCategory } from "@/lib/expenses"
import { houses } from "@/lib/houses"
import { periodFor, summarizeEarnings, type EarningsBooking } from "@/lib/earnings"

// The figures behind the Expenses page, for one month and one view: every
// house together (ALL_HOUSES) or a single house. Pure functions, no React.

/** "yyyy-MM" of the month `step` months away. */
export const shiftMonth = (month: string, step: number) => format(addMonths(parseISO(`${month}-01`), step), "yyyy-MM")

// Months of history a category is compared against ("vs usual")
const USUAL_MONTHS = 3
// Within this much of the usual amount a category counts as "about usual"
const USUAL_TOLERANCE = 10
const CHART_MONTHS = 6
const TOP_LINES = 5

/**
 * What an expense counts for in a view: everything when every house is
 * shown; for one house, its own expenses plus an equal share of any still
 * recorded for all houses.
 */
export function amountFor(expense: Pick<Expense, "house" | "amountRwf">, view: string): number {
    if (view === ALL_HOUSES || expense.house === view) return expense.amountRwf
    return expense.house === ALL_HOUSES ? expense.amountRwf / houses.length : 0
}

const inMonth = (expense: Pick<Expense, "date">, month: string) => expense.date.startsWith(month)

export function spentInMonth(expenses: Expense[], month: string, view: string): number {
    return expenses.reduce((sum, e) => (inMonth(e, month) ? sum + amountFor(e, view) : sum), 0)
}

function spentByCategory(expenses: Expense[], month: string, view: string): Partial<Record<ExpenseCategory, number>> {
    const totals: Partial<Record<ExpenseCategory, number>> = {}
    for (const e of expenses) {
        if (!inMonth(e, month)) continue
        const amount = amountFor(e, view)
        if (amount > 0) totals[e.category] = (totals[e.category] || 0) + amount
    }
    return totals
}

/** How an amount compares with an earlier one. */
export interface Trend {
    kind: "up" | "down" | "same" | "first" // "first": nothing to compare with
    pct: number
}

export function trend(current: number, previous: number): Trend {
    if (!(previous > 0)) return { kind: "first", pct: 0 }
    const pct = Math.round(((current - previous) / previous) * 100)
    return { kind: pct > 0 ? "up" : pct < 0 ? "down" : "same", pct: Math.abs(pct) }
}

/** A category against its average over the months before that had it. */
export interface UsualNote {
    kind: "first" | "usual" | "up" | "down"
    pct: number
}

export function usualText(note: UsualNote): string {
    if (note.kind === "first") return "first time"
    if (note.kind === "usual") return "about usual"
    return `${note.kind} ${note.pct}% vs usual`
}

export interface CategoryRow {
    category: ExpenseCategory
    amount: number
    share: number // of the month's total, 0 to 1
    usual: UsualNote
}

// One line of a month's expenses, in the list, the top five and "copy a
// month". An expense split between all houses is one line again, not one per house.
export interface ExpenseLine {
    key: string
    ids: string[] // the stored expenses behind the line
    date: string
    house: string // house slug or ALL_HOUSES
    category: ExpenseCategory
    note: string
    amountRwf: number
}

/** Every line of a month, largest first, with the per-house shares of a split expense joined again. */
export function monthLines(expenses: Expense[], month: string): ExpenseLine[] {
    const groups = new Map<string, Expense[]>()
    for (const e of expenses) {
        if (!inMonth(e, month)) continue
        const key = e.id.replace(/-\d+$/, "")
        groups.set(key, [...(groups.get(key) ?? []), e])
    }
    const lines: ExpenseLine[] = []
    for (const [key, rows] of groups) {
        const shared =
            houses.length > 1 &&
            rows.length === houses.length &&
            houses.every((h) => rows.some((r) => r.house === h.slug)) &&
            rows.every((r) => r.category === rows[0].category && r.note === rows[0].note)
        if (shared) {
            const amountRwf = rows.reduce((sum, r) => sum + r.amountRwf, 0)
            lines.push({
                key,
                ids: rows.map((r) => r.id),
                date: rows[0].date,
                house: ALL_HOUSES,
                category: rows[0].category,
                note: rows[0].note,
                amountRwf,
            })
        } else {
            rows.forEach((r) =>
                lines.push({ key: r.id, ids: [r.id], date: r.date, house: r.house, category: r.category, note: r.note, amountRwf: r.amountRwf })
            )
        }
    }
    return lines.sort((a, b) => b.amountRwf - a.amountRwf)
}

/** The lines that concern a view: all of them, or one house's own and the shared ones. */
export function linesFor(lines: ExpenseLine[], view: string): ExpenseLine[] {
    return view === ALL_HOUSES ? lines : lines.filter((line) => line.house === view || line.house === ALL_HOUSES)
}

export interface TopLine {
    line: ExpenseLine
    amount: number // what the line counts for in the view
    share: number // of the month's total, 0 to 1
}

export interface HouseRow {
    slug: string
    name: string
    amount: number
    share: number // of the month's total, 0 to 1
    revenue: number
    nights: number
    perNight: number | null // null without a booked night
}

export interface MonthBar {
    key: string // "yyyy-MM"
    label: string // "Oct"
    total: number
}

export interface ExpenseReport {
    month: string
    total: number
    previousTotal: number
    change: Trend // against the month before
    revenue: number // confirmed earnings in the month, for the view
    nights: number // booked nights in the month, for the view
    categories: CategoryRow[] // largest first
    byHouse: HouseRow[] // in listing order; only meaningful when every house is shown
    top: TopLine[]
    months: MonthBar[] // the last six, ending with this one
    lines: ExpenseLine[] // the month's lines for the view, largest first
}

/**
 * Confirmed earnings and booked nights per house in a month, counted as on
 * the Insights page: a booking's total spread evenly over its nights.
 */
export function revenueInMonth(bookings: EarningsBooking[], month: string): Record<string, { total: number; nights: number }> {
    const slugs = houses.map((h) => h.slug)
    const summary = summarizeEarnings(bookings, periodFor("month", parseISO(`${month}-01`)), slugs)
    return Object.fromEntries(slugs.map((slug) => [slug, { total: summary.byHouse[slug]?.total || 0, nights: summary.byHouse[slug]?.nights || 0 }]))
}

export function expenseReport(expenses: Expense[], bookings: EarningsBooking[], month: string, view: string): ExpenseReport {
    const total = spentInMonth(expenses, month, view)
    const previousTotal = spentInMonth(expenses, shiftMonth(month, -1), view)

    const byCategory = spentByCategory(expenses, month, view)
    const history = Array.from({ length: USUAL_MONTHS }, (_, i) => spentByCategory(expenses, shiftMonth(month, -(i + 1)), view))
    const categories = (Object.keys(byCategory) as ExpenseCategory[])
        .map((category) => {
            const amount = byCategory[category] as number
            const before = history.map((m) => m[category] || 0).filter((v) => v > 0)
            let usual: UsualNote = { kind: "first", pct: 0 }
            if (before.length > 0) {
                const average = before.reduce((sum, v) => sum + v, 0) / before.length
                const pct = Math.round(((amount - average) / average) * 100)
                usual = Math.abs(pct) <= USUAL_TOLERANCE ? { kind: "usual", pct } : { kind: pct > 0 ? "up" : "down", pct: Math.abs(pct) }
            }
            return { category, amount, share: total > 0 ? amount / total : 0, usual }
        })
        .sort((a, b) => b.amount - a.amount)

    const revenueByHouse = revenueInMonth(bookings, month)
    const shown = view === ALL_HOUSES ? houses : houses.filter((h) => h.slug === view)
    const revenue = shown.reduce((sum, h) => sum + revenueByHouse[h.slug].total, 0)
    const nights = shown.reduce((sum, h) => sum + revenueByHouse[h.slug].nights, 0)

    const byHouse = houses.map((h) => {
        const amount = spentInMonth(expenses, month, h.slug)
        const { total: earned, nights: booked } = revenueByHouse[h.slug]
        return {
            slug: h.slug,
            name: h.name,
            amount,
            share: total > 0 ? amount / total : 0,
            revenue: earned,
            nights: booked,
            perNight: booked > 0 ? amount / booked : null,
        }
    })

    const lines = linesFor(monthLines(expenses, month), view)
    const top = lines
        .map((line) => {
            const amount = amountFor({ house: line.house, amountRwf: line.amountRwf }, view)
            return { line, amount, share: total > 0 ? amount / total : 0 }
        })
        .sort((a, b) => b.amount - a.amount)
        .slice(0, TOP_LINES)

    const months = Array.from({ length: CHART_MONTHS }, (_, i) => {
        const key = shiftMonth(month, i - (CHART_MONTHS - 1))
        return { key, label: format(parseISO(`${key}-01`), "MMM"), total: spentInMonth(expenses, key, view) }
    })

    return { month, total, previousTotal, change: trend(total, previousTotal), revenue, nights, categories, byHouse, top, months, lines }
}
