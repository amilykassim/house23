import { isValid, parseISO } from "date-fns"
import { MONTHLY_STIPEND_RWF, stipendForPeriod } from "@/lib/earnings"

// Money we took from the business for our own life: the monthly stipend plus
// anything else recorded as personal. Never part of the business expenses.

export interface PersonalExpense {
    id: string // "PE-..."
    amountRwf: number
    date: string // yyyy-MM-dd
    note: string
    createdAt: string
}

/** The stipend changed for one month; 0 means none was taken. */
export interface StipendMonth {
    month: string // yyyy-MM
    amountRwf: number
}

const DAY = /^\d{4}-\d{2}-\d{2}$/
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/
export const isMonthKey = (month: unknown): month is string => typeof month === "string" && MONTH.test(month)

/** The stipend for a month ("yyyy-MM"): its changed amount, else the standard one. */
export function stipendForMonth(month: string, changed: StipendMonth[]): number {
    return changed.find((s) => s.month === month)?.amountRwf ?? MONTHLY_STIPEND_RWF
}

/**
 * Personal money inside a period (inclusive dates, "yyyy-MM-dd"): the
 * stipend (a part month counts for its share of the days) plus every
 * personal expense dated in it. Whole RWF.
 */
export function personalForPeriod(
    start: string,
    end: string,
    entries: Pick<PersonalExpense, "amountRwf" | "date">[],
    changed: StipendMonth[]
): { stipend: number; entries: number; count: number; total: number } {
    if (end < start) return { stipend: 0, entries: 0, count: 0, total: 0 }
    const stipend = stipendForPeriod(parseISO(start), parseISO(end), (month) => stipendForMonth(month, changed))
    const dated = entries.filter((e) => e.date >= start && e.date <= end)
    const sum = dated.reduce((total, e) => total + e.amountRwf, 0)
    return { stipend, entries: sum, count: dated.length, total: stipend + sum }
}

/** A personal expense as sent by the admin form, or the reason it can't be saved. */
export function readPersonalExpense(body: any): { amountRwf: number; date: string; note: string } | string {
    const amountRwf = Math.round(Number(body?.amountRwf))
    const date = typeof body?.date === "string" ? body.date : ""
    if (!(amountRwf > 0) || !Number.isSafeInteger(amountRwf) || amountRwf > 2_147_483_647) return "The amount must be a positive number of RWF"
    if (!DAY.test(date) || !isValid(parseISO(date))) return "The date must be given as YYYY-MM-DD"
    const note = typeof body?.note === "string" ? body.note.trim().slice(0, 200) : ""
    return { amountRwf, date, note }
}

/**
 * A change to one month's stipend: a whole number of RWF (0 = none that
 * month), or null to go back to the standard amount.
 */
export function readStipendChange(body: any): { month: string; amountRwf: number | null } | string {
    if (!isMonthKey(body?.month)) return "The month must be given as YYYY-MM"
    if (body?.amountRwf === null) return { month: body.month, amountRwf: null }
    const raw = Number(body?.amountRwf)
    const amountRwf = Math.round(raw)
    if (body?.amountRwf === "" || !Number.isFinite(raw) || amountRwf < 0 || amountRwf > 2_147_483_647) {
        return "The amount must be 0 or a positive number of RWF"
    }
    return { month: body.month, amountRwf }
}
