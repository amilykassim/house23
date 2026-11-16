import { addMonths, format, parseISO } from "date-fns"
import { ALL_HOUSES, type Expense, type ExpenseCategory } from "@/lib/expenses"
import { houses } from "@/lib/houses"
import { periodFor, shiftAnchor, summarizeEarnings, type EarningsBooking } from "@/lib/earnings"

// The figures behind the Expenses page, for one period (a week, month or
// year, cut as on the Insights page) and one view: every house together
// (ALL_HOUSES) or a single house. Pure functions, no React.

/** "yyyy-MM" of the month `step` months away. */
export const shiftMonth = (month: string, step: number) => format(addMonths(parseISO(`${month}-01`), step), "yyyy-MM")

export type SpanKind = "week" | "month" | "year"

/** A report period: inclusive days, "yyyy-MM-dd". */
export interface Span {
    kind: SpanKind
    start: string
    end: string
}

const dayKey = (d: Date) => format(d, "yyyy-MM-dd")

/** The week (Monday to Sunday), month or year holding a day. */
export function spanFor(kind: SpanKind, day: Date | string): Span {
    const period = periodFor(kind, typeof day === "string" ? parseISO(day) : day)
    return { kind, start: dayKey(period.start), end: dayKey(period.end) }
}

/** The span `step` periods away (-1: the one before). */
export const shiftSpan = (span: Span, step: number): Span => spanFor(span.kind, shiftAnchor(span.kind, parseISO(span.start), step))

/** The span of a month ("yyyy-MM"). */
export const monthSpan = (month: string): Span => spanFor("month", `${month}-01`)

/** Short name of a span: "November", "2026", "10 to 16 Nov". */
export function spanName(span: Span): string {
    const start = parseISO(span.start)
    if (span.kind === "month") return format(start, "MMMM")
    if (span.kind === "year") return format(start, "yyyy")
    const end = parseISO(span.end)
    if (start.getFullYear() !== end.getFullYear()) return `${format(start, "d MMM yyyy")} to ${format(end, "d MMM yyyy")}`
    return start.getMonth() === end.getMonth() ? `${format(start, "d")} to ${format(end, "d MMM")}` : `${format(start, "d MMM")} to ${format(end, "d MMM")}`
}

/** Label of a span's bar in the chart: "Oct", "2026", "10 Nov". */
export function spanBarLabel(span: Span): string {
    const start = parseISO(span.start)
    return span.kind === "month" ? format(start, "MMM") : span.kind === "year" ? format(start, "yyyy") : format(start, "d MMM")
}

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

const inSpan = (expense: Pick<Expense, "date">, span: Span) => expense.date >= span.start && expense.date <= span.end

export function spentInSpan(expenses: Expense[], span: Span, view: string): number {
    return expenses.reduce((sum, e) => (inSpan(e, span) ? sum + amountFor(e, view) : sum), 0)
}

export const spentInMonth = (expenses: Expense[], month: string, view: string): number => spentInSpan(expenses, monthSpan(month), view)

function spentByCategory(expenses: Expense[], span: Span, view: string): Partial<Record<ExpenseCategory, number>> {
    const totals: Partial<Record<ExpenseCategory, number>> = {}
    for (const e of expenses) {
        if (!inSpan(e, span)) continue
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

/** A category against its average over the periods before that had it. */
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
export const monthLines = (expenses: Expense[], month: string): ExpenseLine[] => spanLines(expenses, monthSpan(month))

/** Every line of a span, largest first, with the per-house shares of a split expense joined again. */
export function spanLines(expenses: Expense[], span: Span): ExpenseLine[] {
    const groups = new Map<string, Expense[]>()
    for (const e of expenses) {
        if (!inSpan(e, span)) continue
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
    key: string // the span's first day, "yyyy-MM-dd"; "yyyy-MM" for a month
    span: Span
    label: string // "Oct", "10 Nov", "2026"
    total: number
}

export interface ExpenseReport {
    month: string // "yyyy-MM" of the span's first day
    span: Span
    total: number
    previousTotal: number
    change: Trend // against the period before
    revenue: number // confirmed earnings in the period, for the view
    nights: number // booked nights in the period, for the view
    categories: CategoryRow[] // largest first
    byHouse: HouseRow[] // in listing order; only meaningful when every house is shown
    top: TopLine[]
    months: MonthBar[] // the last six periods, ending with this one
    lines: ExpenseLine[] // the period's lines for the view, largest first
}

/**
 * Confirmed earnings and booked nights per house in a period, counted as on
 * the Insights page: a booking's total spread evenly over its nights.
 */
export function revenueInSpan(bookings: EarningsBooking[], span: Span): Record<string, { total: number; nights: number }> {
    const slugs = houses.map((h) => h.slug)
    const summary = summarizeEarnings(bookings, periodFor(span.kind, parseISO(span.start)), slugs)
    return Object.fromEntries(slugs.map((slug) => [slug, { total: summary.byHouse[slug]?.total || 0, nights: summary.byHouse[slug]?.nights || 0 }]))
}

export const revenueInMonth = (bookings: EarningsBooking[], month: string) => revenueInSpan(bookings, monthSpan(month))

/** The report for a month ("yyyy-MM"). */
export const expenseReport = (expenses: Expense[], bookings: EarningsBooking[], month: string, view: string): ExpenseReport =>
    spanReport(expenses, bookings, monthSpan(month), view)

/** The report for any span: a week and a year are measured as a month is. */
export function spanReport(expenses: Expense[], bookings: EarningsBooking[], span: Span, view: string): ExpenseReport {
    const total = spentInSpan(expenses, span, view)
    const previousTotal = spentInSpan(expenses, shiftSpan(span, -1), view)

    const byCategory = spentByCategory(expenses, span, view)
    const history = Array.from({ length: USUAL_MONTHS }, (_, i) => spentByCategory(expenses, shiftSpan(span, -(i + 1)), view))
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

    const revenueByHouse = revenueInSpan(bookings, span)
    const shown = view === ALL_HOUSES ? houses : houses.filter((h) => h.slug === view)
    const revenue = shown.reduce((sum, h) => sum + revenueByHouse[h.slug].total, 0)
    const nights = shown.reduce((sum, h) => sum + revenueByHouse[h.slug].nights, 0)

    const byHouse = houses.map((h) => {
        const amount = spentInSpan(expenses, span, h.slug)
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

    const lines = linesFor(spanLines(expenses, span), view)
    const top = lines
        .map((line) => {
            const amount = amountFor({ house: line.house, amountRwf: line.amountRwf }, view)
            return { line, amount, share: total > 0 ? amount / total : 0 }
        })
        .sort((a, b) => b.amount - a.amount)
        .slice(0, TOP_LINES)

    const months = Array.from({ length: CHART_MONTHS }, (_, i) => {
        const bar = shiftSpan(span, i - (CHART_MONTHS - 1))
        return {
            key: bar.kind === "month" ? bar.start.slice(0, 7) : bar.start,
            span: bar,
            label: spanBarLabel(bar),
            total: spentInSpan(expenses, bar, view),
        }
    })

    const month = span.start.slice(0, 7)
    return { month, span, total, previousTotal, change: trend(total, previousTotal), revenue, nights, categories, byHouse, top, months, lines }
}
