"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { Loader2, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Collapse, Skeleton, rise, undoable } from "@/components/admin-motion"
import { forgetPersonal } from "@/lib/admin-data"
import { MONTHLY_STIPEND_RWF } from "@/lib/earnings"
import { stipendForMonth, type PersonalExpense, type StipendMonth } from "@/lib/personal"

const rwf = (n: number) => `${Math.round(n).toLocaleString("en-US")} RWF`
const entries = (n: number) => `${n} ${n === 1 ? "entry" : "entries"}`

/**
 * "Taken for personal use": the month's stipend (changeable for that month)
 * and every personal expense dated in it. Business totals never include it.
 */
export function PersonalCard({
    month,
    expenses,
    stipends,
    loading,
    businessTotal,
    revenue,
    showTotals,
    riseIndex,
    onChanged,
}: {
    month: string // yyyy-MM
    expenses: PersonalExpense[]
    stipends: StipendMonth[]
    loading: boolean
    businessTotal: number
    revenue: number
    // The business figures are for every house (not one), so they can be added up
    showTotals: boolean
    riseIndex: number
    onChanged: () => void
}) {
    const [hidden, setHidden] = useState<string[]>([])
    // The stipend amount being typed while it is edited; null when closed
    const [draft, setDraft] = useState<string | null>(null)
    const [savingStipend, setSavingStipend] = useState(false)

    const monthName = format(parseISO(`${month}-01`), "MMMM")
    const lines = expenses.filter((e) => e.date.startsWith(month) && !hidden.includes(e.id))
    const stipend = stipendForMonth(month, stipends)
    const changed = stipends.some((s) => s.month === month)
    const total = stipend + lines.reduce((sum, e) => sum + e.amountRwf, 0)
    const count = lines.length + (stipend > 0 ? 1 : 0)
    const draftAmount = draft === null || draft.trim() === "" ? NaN : Number(draft)
    const draftValid = Number.isFinite(draftAmount) && draftAmount >= 0 && Math.round(draftAmount) !== stipend

    const saveStipend = async (amountRwf: number | null) => {
        setSavingStipend(true)
        try {
            const res = await fetch("/api/personal-expenses", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ month, amountRwf }),
            })
            if (!res.ok) throw new Error("Request failed")
            forgetPersonal()
            toast.success(
                amountRwf === null
                    ? `Stipend back to ${rwf(MONTHLY_STIPEND_RWF)} for ${monthName}`
                    : amountRwf === 0
                        ? `No stipend in ${monthName}`
                        : `Stipend for ${monthName} set to ${rwf(amountRwf)}`
            )
            setDraft(null)
            onChanged()
        } catch {
            toast.error("Couldn't change the stipend", { description: "Nothing was changed. Try again." })
        } finally {
            setSavingStipend(false)
        }
    }

    // Folds the line away at once; the delete goes out when the Undo toast runs out
    const remove = (line: PersonalExpense) => {
        setHidden((prev) => [...prev, line.id])
        const putBack = () => setHidden((prev) => prev.filter((id) => id !== line.id))
        undoable({
            title: "Personal expense deleted",
            description: `${line.note || "Personal"} · ${rwf(line.amountRwf)}`,
            undo: putBack,
            send: async () => {
                try {
                    const res = await fetch(`/api/personal-expenses?id=${encodeURIComponent(line.id)}`, { method: "DELETE", keepalive: true })
                    if (!res.ok && res.status !== 404) throw new Error("Request failed")
                    forgetPersonal()
                    onChanged()
                } catch {
                    putBack()
                    toast.error("Couldn't delete the personal expense", { description: "It is back in the list. Try again." })
                }
            },
        })
    }

    const leaf = (date: string) => {
        const day = parseISO(date)
        return (
            <div aria-hidden="true" className="w-12 shrink-0 rounded-xl bg-[#F7F7F7] py-1.5 flex flex-col items-center leading-none">
                <span className="text-[17px] font-bold text-foreground">{format(day, "d")}</span>
                <span className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{format(day, "MMM")}</span>
            </div>
        )
    }

    return (
        <section aria-labelledby="personal-money" {...rise(riseIndex)} className="m-rise m-card min-w-0 rounded-[20px] border border-border bg-card overflow-hidden">
            <div className="px-5 sm:px-6 pt-5 pb-4 flex flex-col gap-0.5 border-b border-border">
                <h2 id="personal-money" className="text-[13px] font-semibold text-muted-foreground">
                    Taken for personal use
                </h2>
                <span className="text-[26px] leading-tight font-bold tracking-[-0.02em] text-foreground tabular-nums">{rwf(total)}</span>
                <span className="text-[13px] text-muted-foreground">
                    {entries(count)}
                    {showTotals && revenue > 0 && ` · ${Math.round((total / revenue) * 100)}% of revenue`}
                </span>
            </div>

            {loading ? (
                <div aria-label="Loading personal money" className="px-5 sm:px-6 py-4 flex flex-col gap-3">
                    {[0, 1].map((i) => (
                        <Skeleton key={i} className="h-14 rounded-xl" />
                    ))}
                </div>
            ) : (
                <ul>
                    {/* The stipend, first line every month */}
                    <li className="border-b border-[#EBEBEB] last:border-b-0">
                        <div className="px-4 sm:px-6 py-3 flex items-center gap-3 sm:gap-4">
                            {leaf(`${month}-01`)}
                            <div className="min-w-0 flex-1 flex flex-col items-start gap-1">
                                <span className="text-[15px] font-semibold text-foreground whitespace-nowrap">Monthly stipend</span>
                                <span className="px-2 py-0.5 rounded-full border border-[#B0B0B0] text-xs font-semibold text-foreground whitespace-nowrap">
                                    {!changed ? "Every month" : stipend === 0 ? "None this month" : "Changed"}
                                    {changed && <span className="sr-only"> for {monthName}</span>}
                                </span>
                            </div>
                            <span className="shrink-0 text-[15px] font-bold text-foreground tabular-nums whitespace-nowrap">{rwf(stipend)}</span>
                            <button
                                type="button"
                                onClick={() => setDraft(draft === null ? String(stipend) : null)}
                                aria-expanded={draft !== null}
                                aria-label={`Change the stipend for ${monthName}`}
                                className={`m-quiet w-11 h-11 -mr-2 shrink-0 rounded-full flex items-center justify-center hover:text-foreground hover:bg-muted ${draft !== null ? "bg-muted text-foreground" : "text-[#6A6A6A]"}`}
                            >
                                <Pencil className="h-4 w-4" />
                            </button>
                        </div>
                        <Collapse open={draft !== null}>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault()
                                    if (draftValid && !savingStipend) saveStipend(Math.round(draftAmount))
                                }}
                                className="mx-4 sm:mx-6 mb-4 p-3.5 rounded-xl bg-[#F7F7F7] flex flex-col gap-3"
                            >
                                <label className="rounded-xl border border-[#B0B0B0] bg-card px-3.5 py-2.5 flex flex-col gap-0.5 focus-within:border-foreground focus-within:ring-1 focus-within:ring-foreground">
                                    <span className="text-[13px] font-semibold text-muted-foreground">Stipend for {monthName}, RWF (0 if none)</span>
                                    <input
                                        type="number"
                                        min="0"
                                        inputMode="numeric"
                                        value={draft ?? ""}
                                        onChange={(e) => setDraft(e.target.value)}
                                        className="w-full bg-transparent text-[16px] text-foreground outline-none tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                    />
                                </label>
                                <div className="flex flex-wrap justify-end gap-2">
                                    {changed && (
                                        <button
                                            type="button"
                                            onClick={() => saveStipend(null)}
                                            disabled={savingStipend}
                                            className="min-h-11 px-4 rounded-full border border-[#B0B0B0] bg-card text-sm font-semibold text-foreground hover:bg-white disabled:opacity-45"
                                        >
                                            Back to {rwf(MONTHLY_STIPEND_RWF)}
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setDraft(null)}
                                        className="min-h-11 px-4 rounded-full border border-[#B0B0B0] bg-card text-sm font-semibold text-foreground hover:bg-white"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!draftValid || savingStipend}
                                        className="min-h-11 px-5 rounded-full bg-foreground text-background text-sm font-bold flex items-center gap-2 hover:bg-foreground/85 disabled:opacity-45"
                                    >
                                        {savingStipend && <Loader2 className="h-4 w-4 animate-spin" />}
                                        Save
                                    </button>
                                </div>
                            </form>
                        </Collapse>
                    </li>

                    {lines.map((line) => (
                        <li key={line.id} className="m-row border-b border-[#EBEBEB] last:border-b-0">
                            <div className="px-4 sm:px-6 py-3 flex items-center gap-3 sm:gap-4">
                                {leaf(line.date)}
                                <span className="min-w-0 flex-1 text-[15px] font-semibold text-foreground [overflow-wrap:anywhere]">
                                    {line.note || <span className="font-normal text-muted-foreground">Personal</span>}
                                </span>
                                <span className="shrink-0 text-[15px] font-bold text-foreground tabular-nums whitespace-nowrap">{rwf(line.amountRwf)}</span>
                                <button
                                    type="button"
                                    onClick={() => remove(line)}
                                    aria-label={`Delete ${line.note || "personal expense"} of ${rwf(line.amountRwf)}`}
                                    className="m-quiet w-11 h-11 -mr-2 shrink-0 rounded-full flex items-center justify-center text-[#6A6A6A] hover:text-foreground hover:bg-muted"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {showTotals && !loading && (
                <div className="px-5 sm:px-6 py-4 bg-[#F7F7F7] flex flex-col gap-0.5">
                    <span className="text-[13px] font-semibold text-muted-foreground">All money out in {monthName}</span>
                    <span className="text-[15px] text-foreground tabular-nums">
                        <strong>{rwf(businessTotal + total)}</strong>
                        <span className="text-muted-foreground">
                            {" "}
                            = {rwf(businessTotal)} business + {rwf(total)} personal
                        </span>
                    </span>
                </div>
            )}
        </section>
    )
}
