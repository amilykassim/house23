import { NextRequest, NextResponse } from "next/server"
import { readData, writeData } from "@/lib/storage"
import { houses } from "@/lib/houses"
import { ALL_HOUSES, EXPENSE_CATEGORIES, type Expense, type ExpenseCategory } from "@/lib/expenses"

export const dynamic = "force-dynamic"

const FILE = "expenses.json"

// Expenses are back-office data: every method needs the admin session.
function unauthorized(request: NextRequest) {
    return request.cookies.get("admin_auth")?.value !== "authenticated"
        ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        : null
}

export async function GET(request: NextRequest) {
    const denied = unauthorized(request)
    if (denied) return denied

    const expenses = await readData<Expense[]>(FILE, [])
    // Newest first: by expense date, then by when it was recorded
    expenses.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
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

    const expenses = await readData<Expense[]>(FILE, [])
    const expense: Expense = {
        id: `EX-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        house,
        category,
        amountRwf,
        date,
        note: typeof body.note === "string" ? body.note.trim().slice(0, 200) : "",
        createdAt: new Date().toISOString(),
    }
    expenses.push(expense)
    await writeData(FILE, expenses)

    return NextResponse.json({ expense }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
    const denied = unauthorized(request)
    if (denied) return denied

    const id = new URL(request.url).searchParams.get("id")
    if (!id) {
        return NextResponse.json({ error: "Missing expense id" }, { status: 400 })
    }

    const expenses = await readData<Expense[]>(FILE, [])
    const remaining = expenses.filter((e) => e.id !== id)
    if (remaining.length === expenses.length) {
        return NextResponse.json({ error: "Expense not found" }, { status: 404 })
    }
    await writeData(FILE, remaining)

    return NextResponse.json({ success: true })
}
