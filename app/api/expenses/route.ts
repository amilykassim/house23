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

export async function POST(request: NextRequest) {
    const denied = unauthorized(request)
    if (denied) return denied

    const body = await request.json()
    const house = typeof body.house === "string" ? body.house : ""
    const category = body.category as ExpenseCategory
    const amountRwf = Math.round(Number(body.amountRwf))
    const date = typeof body.date === "string" ? body.date : ""

    const validHouse = house === ALL_HOUSES || houses.some((h) => h.slug === house)
    if (!validHouse || !EXPENSE_CATEGORIES.includes(category) || !(amountRwf > 0) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 })
    }

    // One for all houses is split evenly: one expense per house
    const slugs = house === ALL_HOUSES ? houses.map((h) => h.slug) : [house]
    const shares = splitEvenly(amountRwf, slugs.length)
    if (shares.some((share) => !(share > 0))) {
        return NextResponse.json({ error: "The amount is too small to split between the houses" }, { status: 400 })
    }
    const note = typeof body.note === "string" ? body.note.trim().slice(0, 200) : ""
    const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

    const expenses = await transaction((tx) =>
        Promise.all(
            slugs.map((slug, i) =>
                insertExpense(
                    { id: `EX-${stamp}${slugs.length > 1 ? `-${i + 1}` : ""}`, house: slug, category, amountRwf: shares[i], date, note },
                    tx
                )
            )
        )
    )

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
