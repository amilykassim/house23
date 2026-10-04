export const EXPENSE_CATEGORIES = [
    "Cleaning",
    "Repairs",
    "Electricity",
    "Water",
    "Internet",
    "Supplies",
    "Other",
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

// An expense belongs to one house, or to all of them (e.g. shared internet).
export const ALL_HOUSES = "all"

export interface Expense {
    id: string
    house: string // house slug or ALL_HOUSES
    category: ExpenseCategory
    amountRwf: number
    date: string // yyyy-MM-dd
    note: string
    createdAt: string
}
