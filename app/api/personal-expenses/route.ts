import { NextRequest, NextResponse } from "next/server"
import { isAdminRequest } from "@/lib/admin-session"
import {
    deletePersonalExpense,
    insertPersonalExpense,
    listPersonalExpenses,
    listStipendMonths,
    setStipendMonth,
} from "@/lib/store"
import { MONTHLY_STIPEND_RWF } from "@/lib/earnings"
import { readPersonalExpense, readStipendChange } from "@/lib/personal"

export const dynamic = "force-dynamic"

// Money we took from the business for ourselves: personal expenses and the
// monthly stipend. Back-office data: every method needs the admin session.
async function unauthorized(request: NextRequest) {
    return (await isAdminRequest(request)) ? null : NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

async function readJson(request: NextRequest): Promise<unknown | undefined> {
    try {
        return await request.json()
    } catch {
        return undefined
    }
}

/** { expenses (newest first), stipends (months changed), monthlyStipend }. */
export async function GET(request: NextRequest) {
    const denied = await unauthorized(request)
    if (denied) return denied

    const [expenses, stipends] = await Promise.all([listPersonalExpenses(), listStipendMonths()])
    return NextResponse.json({ expenses, stipends, monthlyStipend: MONTHLY_STIPEND_RWF })
}

/** Records one personal expense: { amountRwf, date, note }. */
export async function POST(request: NextRequest) {
    const denied = await unauthorized(request)
    if (denied) return denied

    const parsed = readPersonalExpense(await readJson(request))
    if (typeof parsed === "string") return NextResponse.json({ error: parsed }, { status: 400 })

    const id = `PE-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
    const expense = await insertPersonalExpense({ id, ...parsed })
    return NextResponse.json({ expense }, { status: 201 })
}

/** Changes one month's stipend: { month, amountRwf } (0 = none; null = back to the standard amount). */
export async function PUT(request: NextRequest) {
    const denied = await unauthorized(request)
    if (denied) return denied

    const parsed = readStipendChange(await readJson(request))
    if (typeof parsed === "string") return NextResponse.json({ error: parsed }, { status: 400 })

    await setStipendMonth(parsed.month, parsed.amountRwf)
    return NextResponse.json({ stipends: await listStipendMonths() })
}

export async function DELETE(request: NextRequest) {
    const denied = await unauthorized(request)
    if (denied) return denied

    const id = new URL(request.url).searchParams.get("id")
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
    if (!(await deletePersonalExpense(id))) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ success: true })
}
