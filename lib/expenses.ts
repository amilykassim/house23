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

export interface Expense {
    id: string
    house: string // house slug or ALL_HOUSES
    category: ExpenseCategory
    amountRwf: number
    date: string // yyyy-MM-dd
    note: string
    createdAt: string
}
