import { NextRequest, NextResponse } from "next/server"
import { isAdminRequest } from "@/lib/admin-session"
import { transaction } from "@/lib/db"
import { isValid, parseISO } from "date-fns"
import { deleteExpense, getExpensesForUpdate, insertExpense, listExpenses, updateExpense } from "@/lib/store"
import { houses } from "@/lib/houses"
import { ALL_HOUSES, EXPENSE_CATEGORIES, planExpenseEdit, splitEvenly, type ExpenseCategory } from "@/lib/expenses"

export const dynamic = "force-dynamic"

// Expenses are back-office data: every method needs the admin session.
async function unauthorized(request: NextRequest) {
    return (await isAdminRequest(request)) ? null : NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

export async function GET(request: NextRequest) {
    const denied = await unauthorized(request)
    if (denied) return denied

    // Newest first: by expense date, then by when it was recorded
    const expenses = await listExpenses()
    return NextResponse.json({ expenses })
}

type NewExpense = { house: string; category: ExpenseCategory; amountRwf: number; date: string; note: string }

// One expense as sent by the admin form, or the reason it can't be saved
function readExpense(body: any): NewExpense | string {
    const house = typeof body?.house === "string" ? body.house : ""
    const category = body?.category as ExpenseCategory
    const amountRwf = Math.round(Number(body?.amountRwf))
    const date = typeof body?.date === "string" ? body.date : ""

    const validHouse = house === ALL_HOUSES || houses.some((h) => h.slug === house)
    if (!validHouse || !EXPENSE_CATEGORIES.includes(category) || !(amountRwf > 0) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return "Missing or invalid fields"
    }
    if (house === ALL_HOUSES && splitEvenly(amountRwf, houses.length).some((share) => !(share > 0))) {
        return "The amount is too small to split between the houses"
    }
    const note = typeof body.note === "string" ? body.note.trim().slice(0, 200) : ""
    return { house, category, amountRwf, date, note }
}

const MAX_BATCH = 100

// Saves one expense, or several at once as { items: [...] } (copying a month):
// either all of them are saved or none.
export async function POST(request: NextRequest) {
    const denied = await unauthorized(request)
    if (denied) return denied

    const body = await request.json()
    const batch = Array.isArray(body?.items)
    const items: unknown[] = batch ? body.items : [body]
    if (items.length === 0 || items.length > MAX_BATCH) {
        return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 })
    }
    const parsed = items.map(readExpense)
    const invalid = parsed.find((p): p is string => typeof p === "string")
    if (invalid) {
        return NextResponse.json({ error: invalid }, { status: 400 })
    }

    const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
    const expenses = await transaction(async (tx) => {
        const saved = []
        for (const [n, item] of (parsed as NewExpense[]).entries()) {
            // One for all houses is split evenly: one expense per house
            const slugs = item.house === ALL_HOUSES ? houses.map((h) => h.slug) : [item.house]
            const shares = splitEvenly(item.amountRwf, slugs.length)
            const base = `EX-${stamp}${batch ? `c${n + 1}` : ""}`
            for (const [i, slug] of slugs.entries()) {
                saved.push(
                    await insertExpense(
                        {
                            id: `${base}${slugs.length > 1 ? `-${i + 1}` : ""}`,
                            house: slug,
                            category: item.category,
                            amountRwf: shares[i],
                            date: item.date,
                            note: item.note,
                        },
                        tx
                    )
                )
            }
        }
        return saved
    })

    return NextResponse.json({ expense: expenses[0], expenses }, { status: 201 })
}

const MAX_IDS = 10

// Changes one expense line: { ids, category, note, amountRwf, date }. `ids`
// are the stored rows behind the line (one per house when it was split);
// they all change together, or none does.
export async function PATCH(request: NextRequest) {
    const denied = await unauthorized(request)
    if (denied) return denied

    let body: any
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 })
    }
    const ids: unknown = body?.ids
    const category = body?.category as ExpenseCategory
    const amountRwf = Math.round(Number(body?.amountRwf))
    const date = typeof body?.date === "string" ? body.date : ""
    const validIds =
        Array.isArray(ids) &&
        ids.length > 0 &&
        ids.length <= MAX_IDS &&
        ids.every((id) => typeof id === "string" && id.length > 0) &&
        new Set(ids).size === ids.length
    if (!validIds || !EXPENSE_CATEGORIES.includes(category) || !(amountRwf > 0) || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !isValid(parseISO(date))) {
        return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 })
    }
    const note = typeof body.note === "string" ? body.note.trim().slice(0, 200) : ""
    const edit = { category, note, amountRwf, date }

    const result = await transaction(async (tx) => {
        const rows = await getExpensesForUpdate(ids as string[], tx)
        if (rows.length !== (ids as string[]).length) return { status: 404, error: "Expense not found" }
        const plan = planExpenseEdit(rows, edit, houses.map((h) => h.slug))
        if (typeof plan === "string") return { status: 400, error: plan }
        const expenses = []
        for (const row of plan) expenses.push(await updateExpense(row, tx))
        return { status: 200, expenses }
    })

    return result.status === 200
        ? NextResponse.json({ expenses: result.expenses })
        : NextResponse.json({ error: result.error }, { status: result.status })
}

export async function DELETE(request: NextRequest) {
    const denied = await unauthorized(request)
    if (denied) return denied

    const id = new URL(request.url).searchParams.get("id")
    if (!id) {
        return NextResponse.json({ error: "Missing expense id" }, { status: 400 })
    }

    if (!(await deleteExpense(id))) {
        return NextResponse.json({ error: "Expense not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
}
