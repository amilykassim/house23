import { NextRequest, NextResponse } from "next/server"
import { transaction } from "@/lib/db"
import { deleteExpense, insertExpense, listExpenses } from "@/lib/store"
import { houses } from "@/lib/houses"
import { ALL_HOUSES, EXPENSE_CATEGORIES, splitEvenly, type ExpenseCategory } from "@/lib/expenses"

export const dynamic = "force-dynamic"

// Expenses are back-office data: every method needs the admin session.
function unauthorized(request: NextRequest) {
    return request.cookies.get("admin_auth")?.value !== "authenticated"
        ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        : null
}

export async function GET(request: NextRequest) {
    const denied = unauthorized(request)
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
    const denied = unauthorized(request)
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

export async function DELETE(request: NextRequest) {
    const denied = unauthorized(request)
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
