import { NextRequest, NextResponse } from "next/server"
import { isValid, parseISO } from "date-fns"
import { transaction } from "@/lib/db"
import { deleteExpensesByPrefix, insertExpense } from "@/lib/store"
import { houses } from "@/lib/houses"
import { ALL_HOUSES, EXPENSE_CATEGORIES, splitEvenly, type ExpenseCategory } from "@/lib/expenses"
import { hasHookKey, hookNoDatabase, hookNotFound } from "@/lib/hook-auth"

export const dynamic = "force-dynamic"

// Pennywise mirrors its transactions here. Each one is stored under
// "PW-<pennywise id>"; one for all houses becomes one row per house,
// "PW-<id>-1", "PW-<id>-2", exactly like an expense added in the admin panel.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const rowId = (pennywiseId: string) => `PW-${pennywiseId.toLowerCase()}`

type HookExpense = { id: string; house: string; category: ExpenseCategory; amountRwf: number; date: string; note: string }

// The expense as Pennywise sends it, or a sentence saying what is wrong
function readHookExpense(body: any): HookExpense | string {
    const id = typeof body?.id === "string" ? body.id : ""
    if (!UUID.test(id)) return "The id must be a UUID"

    const house = typeof body?.house === "string" ? body.house : ""
    if (house !== ALL_HOUSES && !houses.some((h) => h.slug === house)) {
        return `The house must be one of ${houses.map((h) => h.slug).join(", ")} or "${ALL_HOUSES}"`
    }

    const category = body?.category as ExpenseCategory
    if (!EXPENSE_CATEGORIES.includes(category)) {
        return `The category must be one of ${EXPENSE_CATEGORIES.join(", ")}`
    }

    const amountRwf = Math.round(Number(body?.amount))
    if (!(amountRwf > 0)) return "The amount must be a positive number of RWF"
    if (house === ALL_HOUSES && splitEvenly(amountRwf, houses.length).some((share) => !(share > 0))) {
        return "The amount is too small to split between the houses"
    }

    const date = typeof body?.day === "string" ? body.day : ""
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !isValid(parseISO(date))) return "The day must be a date as YYYY-MM-DD"

    const note = typeof body?.note === "string" ? body.note.trim().slice(0, 200) : ""
    return { id: rowId(id), house, category, amountRwf, date, note }
}

/** Upsert: the rows of this expense are replaced in one transaction. */
export async function POST(request: NextRequest) {
    if (!hasHookKey(request)) return hookNotFound()
    if (!process.env.DATABASE_URL) return hookNoDatabase()

    let body: unknown
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ ok: false, error: "The body must be JSON" }, { status: 400 })
    }
    const parsed = readHookExpense(body)
    if (typeof parsed === "string") {
        return NextResponse.json({ ok: false, error: parsed }, { status: 400 })
    }

    try {
        await transaction(async (tx) => {
            await deleteExpensesByPrefix(parsed.id, tx)
            const slugs = parsed.house === ALL_HOUSES ? houses.map((h) => h.slug) : [parsed.house]
            const shares = splitEvenly(parsed.amountRwf, slugs.length)
            for (const [i, slug] of slugs.entries()) {
                await insertExpense(
                    {
                        id: `${parsed.id}${slugs.length > 1 ? `-${i + 1}` : ""}`,
                        house: slug,
                        category: parsed.category,
                        amountRwf: shares[i],
                        date: parsed.date,
                        note: parsed.note,
                    },
                    tx
                )
            }
        })
    } catch (error) {
        console.error("[hooks/expense POST]", error)
        return NextResponse.json({ ok: false, error: "The expense could not be saved" }, { status: 500 })
    }

    return NextResponse.json({ ok: true, id: parsed.id })
}

/** Removes the expense and every per-house share of it; fine when there is none. */
export async function DELETE(request: NextRequest) {
    if (!hasHookKey(request)) return hookNotFound()
    if (!process.env.DATABASE_URL) return hookNoDatabase()

    const id = new URL(request.url).searchParams.get("id") ?? ""
    if (!UUID.test(id)) {
        return NextResponse.json({ ok: false, error: "The id must be a UUID" }, { status: 400 })
    }

    try {
        await deleteExpensesByPrefix(rowId(id))
    } catch (error) {
        console.error("[hooks/expense DELETE]", error)
        return NextResponse.json({ ok: false, error: "The expense could not be deleted" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
}
