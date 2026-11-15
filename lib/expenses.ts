export const EXPENSE_CATEGORIES = [
    "Cleaning",
    "Repairs",
    "Electricity",
    "Water",
    "Internet",
    "Supplies",
    "Rent",
    "Security",
    "Other",
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

// An expense belongs to one house. One recorded for all of them (e.g. shared
// internet) is saved as an equal share per house; older shared expenses are
// still stored whole under ALL_HOUSES.
export const ALL_HOUSES = "all"

/** Equal whole-RWF shares of an amount; any remainder goes to the first ones. */
export function splitEvenly(amountRwf: number, parts: number): number[] {
    const share = Math.floor(amountRwf / parts)
    const extra = amountRwf - share * parts
    return Array.from({ length: parts }, (_, i) => share + (i < extra ? 1 : 0))
}

/** What can change on an expense line: its category ("move"), note ("rename"), amount and date. */
export interface ExpenseEdit {
    category: ExpenseCategory
    note: string
    amountRwf: number
    date: string // yyyy-MM-dd
}

/** The id an expense's per-house shares have in common: "EX-abc-2" → "EX-abc". */
export const expenseGroupId = (id: string) => id.replace(/-\d+$/, "")

/**
 * The new values for each stored row of one expense line. A line split
 * between houses gets the new amount shared out again, in house order
 * (the first houses take any remainder, as when it was saved). Returns a
 * sentence instead when the rows are not one expense or can't take the amount.
 */
export function planExpenseEdit(
    rows: { id: string; house: string }[],
    edit: ExpenseEdit,
    houseOrder: string[]
): ({ id: string } & ExpenseEdit)[] | string {
    if (rows.length === 0) return "Expense not found"
    if (rows.length > 1) {
        const group = expenseGroupId(rows[0].id)
        const sameExpense = rows.every((r) => r.id !== group && expenseGroupId(r.id) === group)
        const oneEach = new Set(rows.map((r) => r.house)).size === rows.length && rows.every((r) => houseOrder.includes(r.house))
        if (!sameExpense || !oneEach) return "Those rows are not one expense"
    }
    const ordered = [...rows].sort((a, b) => houseOrder.indexOf(a.house) - houseOrder.indexOf(b.house))
    const shares = splitEvenly(edit.amountRwf, ordered.length)
    if (shares.some((share) => !(share > 0))) return "The amount is too small to split between the houses"
    return ordered.map((row, i) => ({ id: row.id, ...edit, amountRwf: shares[i] }))
}

export interface Expense {
    id: string
    house: string // house slug or ALL_HOUSES
    category: ExpenseCategory
    amountRwf: number
    date: string // yyyy-MM-dd
    note: string
    createdAt: string
}
