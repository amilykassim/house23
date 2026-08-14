"use client"

// ⚠️ TEMPORARY: Dashboard panel for testing Resend delivery.
// Delete this file (and app/api/test-email/route.ts) when done testing.

import { useState } from "react"
import { Mail, Send, CheckCircle2, XCircle } from "lucide-react"

type Result =
    | { ok: true; id?: string; to: string; from: string }
    | { ok: false; error: string }

export function TestEmailPanel() {
    const [email, setEmail] = useState("")
    const [sending, setSending] = useState(false)
    const [result, setResult] = useState<Result | null>(null)

    const handleSend = async () => {
        if (!email.trim() || sending) return
        setSending(true)
        setResult(null)
        try {
            const res = await fetch("/api/test-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim() }),
            })
            const data = await res.json()
            setResult(
                res.ok
                    ? { ok: true, id: data.id, to: data.to, from: data.from }
                    : { ok: false, error: data.error || `Request failed (${res.status})` },
            )
        } catch (err) {
            setResult({ ok: false, error: err instanceof Error ? err.message : "Network error" })
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <h2 className="text-base font-semibold text-foreground">Test Email</h2>
                <span className="ml-auto text-[10px] font-medium uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                    Temporary
                </span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
                Sends the <strong>booking confirmed</strong> template with sample data through Resend.
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="you@example.com"
                    className="flex-1 h-9 rounded-lg border border-border bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] transition-[color,box-shadow]"
                />
                <button
                    onClick={handleSend}
                    disabled={sending || !email.trim()}
                    className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg text-sm font-medium bg-foreground text-background hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                    {sending ? (
                        <>
                            <span className="w-3.5 h-3.5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                            Sending
                        </>
                    ) : (
                        <>
                            <Send className="h-3.5 w-3.5" />
                            Send test
                        </>
                    )}
                </button>
            </div>

            {result && (
                <div
                    className={`mt-3 flex gap-2 p-3 rounded-lg border text-xs ${result.ok
                        ? "bg-green-500/5 border-green-500/20 text-green-700 dark:text-green-400"
                        : "bg-red-500/5 border-red-500/20 text-red-700 dark:text-red-400"
                        }`}
                >
                    {result.ok ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                    ) : (
                        <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-0.5 min-w-0">
                        {result.ok ? (
                            <>
                                <p className="font-semibold">Resend accepted the email</p>
                                <p className="opacity-80 break-all">
                                    {result.from} → {result.to}
                                </p>
                                {result.id && (
                                    <p className="opacity-80 font-mono break-all">id: {result.id}</p>
                                )}
                            </>
                        ) : (
                            <>
                                <p className="font-semibold">Send failed</p>
                                <p className="opacity-80 break-words">{result.error}</p>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
