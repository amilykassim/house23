"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { CheckCircle2, Loader2, Minus, Plus, Send, XCircle } from "lucide-react"
import { houses } from "@/lib/houses"
import { SegmentedControl } from "@/components/segmented-control"
import { DateRangePicker, dayLabel } from "@/components/date-range-picker"
import { ADMIN_NIGHTLY_PRICE_RWF, USD_TO_RWF } from "@/lib/currency"
import { REJECTION_REASONS, type RejectionReason } from "@/lib/rejection-reasons"
import type { ManualEmailTemplate } from "@/lib/manual-email"

const TEMPLATES: { id: ManualEmailTemplate; label: string; short: string }[] = [
    { id: "request", label: "Request", short: "request email" },
    { id: "confirmed", label: "Confirmed", short: "confirmation" },
    { id: "declined", label: "Not confirmed", short: "not-confirmed email" },
]

type Preview =
    | { state: "loading" }
    // `key` is the form the preview was built from; sending needs it to match
    | { state: "ok"; key: string; subject: string; html: string; from: string }
    | { state: "error"; error: string }

type SendResult =
    | { ok: true; id?: string; to: string; label: string; accessCode?: { code: string; added: boolean } }
    | { ok: false; error: string }

const fieldClass =
    "rounded-2xl border border-[#B0B0B0] bg-card px-5 py-[14px] flex flex-col gap-0.5 focus-within:border-foreground focus-within:ring-1 focus-within:ring-foreground"
const inputClass =
    "w-full bg-transparent text-[17px] leading-7 text-foreground placeholder:text-[#B0B0B0] outline-none"
const roundButton =
    "h-10 w-10 rounded-full border border-[#B0B0B0] flex items-center justify-center text-foreground hover:bg-[#F7F7F7] disabled:opacity-40 disabled:hover:bg-transparent"

function nightsBetween(start: string | null, end: string | null): number {
    if (!start || !end) return 0
    return Math.max(0, Math.round((Date.parse(end + "T00:00:00Z") - Date.parse(start + "T00:00:00Z")) / 86_400_000))
}

export default function SendEmailPage() {
    const [template, setTemplate] = useState<ManualEmailTemplate>("confirmed")
    const [email, setEmail] = useState("")
    const [guestName, setGuestName] = useState("")
    const [house, setHouse] = useState(houses[0].slug)
    const [checkIn, setCheckIn] = useState<string | null>(null)
    const [checkOut, setCheckOut] = useState<string | null>(null)
    const [guests, setGuests] = useState(2)
    const [phone, setPhone] = useState("")
    const [reason, setReason] = useState<RejectionReason>("dates_unavailable")
    const [bookingId, setBookingId] = useState("")
    const [amount, setAmount] = useState("")

    const [preview, setPreview] = useState<Preview>({ state: "loading" })
    const [phase, setPhase] = useState<"idle" | "confirm" | "sending">("idle")
    const [result, setResult] = useState<SendResult | null>(null)
    const frameRef = useRef<HTMLIFrameElement>(null)
    // One idempotency key per email: reused while retrying the same form, so a
    // send whose answer was lost isn't delivered twice; dropped after a success
    const sendKey = useRef<{ form: string; key: string } | null>(null)

    const maxGuests = houses.find((h) => h.slug === house)?.guests ?? 1
    const nights = nightsBetween(checkIn, checkOut)
    const paidRwf = Number(amount) || 0
    const accessCode = phone.replace(/\D/g, "").slice(-4)
    const current = TEMPLATES.find((t) => t.id === template)!

    const payload = useMemo(
        () => ({
            template,
            email: email.trim(),
            guestName,
            house,
            checkIn,
            checkOut,
            guests,
            phone,
            reason,
            bookingId,
            totalRwf: amount,
        }),
        [template, email, guestName, house, checkIn, checkOut, guests, phone, reason, bookingId, amount],
    )
    const formKey = useMemo(() => JSON.stringify(payload), [payload])

    // Any edit cancels a pending "Yes, send" so the confirmation always matches the form
    useEffect(() => {
        setPhase((p) => (p === "confirm" ? "idle" : p))
    }, [payload])

    // Live preview, rendered by the server from the real templates. A request
    // made stale by a later edit is left to finish and its answer ignored; it is
    // not aborted, because extensions that wrap fetch report the abort as an
    // unhandled AbortError.
    useEffect(() => {
        let stale = false
        setPreview((p) => (p.state === "ok" ? p : { state: "loading" }))
        const timer = setTimeout(async () => {
            try {
                const res = await fetch("/api/manual-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...payload, action: "preview" }),
                })
                const data = await res.json()
                if (stale) return
                setPreview(
                    res.ok
                        ? { state: "ok", key: formKey, subject: data.subject, html: data.html, from: data.from }
                        : { state: "error", error: data.error || `Preview failed (${res.status})` },
                )
            } catch {
                if (!stale) setPreview({ state: "error", error: "Couldn't load the preview" })
            }
        }, 300)
        return () => {
            stale = true
            clearTimeout(timer)
        }
    }, [payload, formKey])

    const pickHouse = (slug: string) => {
        setHouse(slug)
        const max = houses.find((h) => h.slug === slug)?.guests ?? 1
        setGuests((n) => Math.min(n, max))
    }

    const send = async () => {
        setPhase("sending")
        setResult(null)
        if (sendKey.current?.form !== formKey) sendKey.current = { form: formKey, key: crypto.randomUUID() }
        try {
            const res = await fetch("/api/manual-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...payload, action: "send", idempotencyKey: sendKey.current.key }),
            })
            const data = await res.json()
            if (res.ok) sendKey.current = null
            setResult(
                res.ok
                    ? { ok: true, id: data.id, to: data.to, label: current.short, accessCode: data.accessCode }
                    : { ok: false, error: data.error || `Request failed (${res.status})` },
            )
        } catch (err) {
            setResult({ ok: false, error: err instanceof Error ? err.message : "Network error" })
        } finally {
            setPhase("idle")
        }
    }

    // Only what the preview shows can be sent: an edit disables Send until it catches up
    const previewIsCurrent = preview.state === "ok" && preview.key === formKey
    const canSend = previewIsCurrent && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

    return (
        // zoom matches Add booking's slightly smaller scale
        <div className="[zoom:0.88] px-4 sm:px-6 pt-7 sm:pt-12 pb-14 max-w-[1200px] mx-auto flex flex-col gap-6 sm:gap-8">
            <div className="flex flex-col gap-1.5">
                <h1 className="text-[28px] sm:text-[34px] leading-tight font-bold tracking-[-0.02em] text-foreground">
                    Send an email
                </h1>
                <p className="text-[15px] text-muted-foreground">
                    Send a guest email by hand. Nothing changes in bookings; only the email goes out.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-6 lg:gap-8 items-start">
                {/* Form */}
                <div className="flex flex-col gap-5 min-w-0">
                    <div className="flex flex-col gap-2">
                        <span className="text-[13px] font-semibold text-muted-foreground">Email</span>
                        <SegmentedControl
                            className="self-start max-w-full"
                            itemClassName="px-3 sm:px-4 whitespace-nowrap"
                            options={TEMPLATES.map((t) => ({ id: t.id, label: t.label }))}
                            value={template}
                            onChange={setTemplate}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className={fieldClass}>
                            <span className="text-[13px] font-semibold text-muted-foreground">Guest email</span>
                            <input
                                id="guest-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="guest@example.com"
                                autoComplete="off"
                                className={inputClass}
                            />
                        </label>
                        <label className={fieldClass}>
                            <span className="text-[13px] font-semibold text-muted-foreground">Guest name</span>
                            <input
                                id="guest-name"
                                type="text"
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                                placeholder="As it should read in the email"
                                autoComplete="off"
                                maxLength={100}
                                className={inputClass}
                            />
                        </label>
                    </div>

                    <SegmentedControl
                        className="self-start"
                        itemClassName="px-[22px]"
                        options={houses.map((h) => ({ id: h.slug, label: h.name }))}
                        value={house}
                        onChange={pickHouse}
                    />

                    <DateRangePicker
                        startLabel="Check-in"
                        endLabel="Check-out"
                        start={checkIn}
                        end={checkOut}
                        onChange={(start, end) => {
                            setCheckIn(start)
                            setCheckOut(end)
                        }}
                        summary={
                            <p className="text-[15px] text-muted-foreground">
                                {nights > 0 && checkIn && checkOut
                                    ? `${dayLabel(checkIn)} to ${dayLabel(checkOut)} · ${nights} night${nights === 1 ? "" : "s"}`
                                    : "Tap a card to pick the dates."}
                            </p>
                        }
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-[#B0B0B0] bg-card px-5 py-[14px] flex items-center justify-between gap-3">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[13px] font-semibold text-muted-foreground">Guests</span>
                                <span className="text-[17px] leading-7 text-foreground" aria-live="polite">
                                    {guests}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    aria-label="One guest fewer"
                                    onClick={() => setGuests((n) => Math.max(1, n - 1))}
                                    disabled={guests <= 1}
                                    className={roundButton}
                                >
                                    <Minus className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    aria-label="One guest more"
                                    onClick={() => setGuests((n) => Math.min(maxGuests, n + 1))}
                                    disabled={guests >= maxGuests}
                                    className={roundButton}
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                        <label className={fieldClass}>
                            <span className="text-[13px] font-semibold text-muted-foreground">Booking reference</span>
                            <input
                                id="booking-id"
                                type="text"
                                value={bookingId}
                                onChange={(e) => setBookingId(e.target.value)}
                                placeholder="BK-014"
                                autoComplete="off"
                                maxLength={32}
                                className={inputClass}
                            />
                        </label>
                    </div>

                    {template === "confirmed" && (
                        <label className={fieldClass}>
                            <span className="text-[13px] font-semibold text-muted-foreground">Guest phone</span>
                            <input
                                id="guest-phone"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+250 788 000 000"
                                autoComplete="off"
                                maxLength={40}
                                className={inputClass}
                            />
                            <span className="text-[13px] text-muted-foreground">
                                {accessCode.length === 4
                                    ? `Sending also saves ${accessCode} as a house guide access code.`
                                    : "The last 4 digits become the house guide access code."}
                            </span>
                        </label>
                    )}

                    {template === "declined" ? (
                        <label className={fieldClass}>
                            <span className="text-[13px] font-semibold text-muted-foreground">Reason</span>
                            <select
                                id="decline-reason"
                                value={reason}
                                onChange={(e) => setReason(e.target.value as RejectionReason)}
                                className={`${inputClass} -ml-1`}
                            >
                                {(Object.keys(REJECTION_REASONS) as RejectionReason[]).map((r) => (
                                    <option key={r} value={r}>
                                        {REJECTION_REASONS[r].label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <label className={fieldClass}>
                                <span className="text-[13px] font-semibold text-muted-foreground">
                                    {template === "confirmed" ? "Total paid" : "Total"}
                                </span>
                                <input
                                    id="total-rwf"
                                    type="number"
                                    min="0"
                                    inputMode="numeric"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0"
                                    className={`${inputClass} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                                />
                                <span className="text-[13px] text-muted-foreground">
                                    {paidRwf > 0
                                        ? `RWF · shown as $${Math.round((paidRwf / USD_TO_RWF) * 100) / 100} in the email`
                                        : "RWF"}
                                </span>
                            </label>
                            <div>
                                <button
                                    type="button"
                                    onClick={() => nights > 0 && setAmount(String(nights * ADMIN_NIGHTLY_PRICE_RWF))}
                                    disabled={nights === 0}
                                    className="min-h-11 px-4 rounded-full border border-[#B0B0B0] bg-card text-sm font-semibold text-foreground hover:bg-[#F7F7F7] disabled:hover:bg-card"
                                >
                                    {nights > 0
                                        ? `Use the set price · ${nights} × ${ADMIN_NIGHTLY_PRICE_RWF.toLocaleString("en-US")} RWF`
                                        : "Pick the dates to see the set price"}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="border-t border-[#EBEBEB] pt-5 flex flex-col gap-3">
                        {phase === "confirm" ? (
                            <div className="rounded-2xl bg-muted p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                                <p className="flex-1 min-w-0 text-[15px] text-foreground break-words">
                                    Send the <strong>{current.short}</strong> to <strong>{email.trim()}</strong>?
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPhase("idle")}
                                        className="min-h-11 px-4 rounded-full border border-[#B0B0B0] bg-card text-sm font-semibold text-foreground hover:bg-[#F7F7F7]"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={send}
                                        className="min-h-11 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90"
                                    >
                                        Yes, send
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setPhase("confirm")}
                                    disabled={!canSend || phase === "sending"}
                                    className="min-h-12 px-6 rounded-full bg-foreground text-background text-[15px] font-semibold inline-flex items-center gap-2 hover:opacity-90 disabled:opacity-40"
                                >
                                    {phase === "sending" ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                    {phase === "sending" ? "Sending" : `Send ${current.short}`}
                                </button>
                                <span className="text-[13px] text-muted-foreground">
                                    {canSend
                                        ? "You'll confirm before it goes."
                                        : preview.state === "error"
                                            ? preview.error
                                            : !previewIsCurrent
                                                ? "Updating the preview…"
                                                : "Add a valid guest email to send."}
                                </span>
                            </div>
                        )}

                        {result && (
                            <div
                                role="status"
                                className={`flex gap-2.5 p-4 rounded-2xl border text-sm ${result.ok
                                    ? "bg-green-500/5 border-green-500/20 text-green-700"
                                    : "bg-red-500/5 border-red-500/20 text-red-700"
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
                                            <p className="font-semibold break-words">
                                                Sent the {result.label} to {result.to}
                                            </p>
                                            {result.accessCode && (
                                                <p className="opacity-80">
                                                    {result.accessCode.added
                                                        ? `Access code ${result.accessCode.code} saved under Listing.`
                                                        : `Access code ${result.accessCode.code} was already saved.`}
                                                </p>
                                            )}
                                            {result.id && <p className="opacity-80 font-mono text-xs break-all">Resend id {result.id}</p>}
                                        </>
                                    ) : (
                                        <>
                                            <p className="font-semibold">Not sent</p>
                                            <p className="opacity-80 break-words">{result.error}</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Preview */}
                <div className="lg:sticky lg:top-24 rounded-2xl border border-[#DDDDDD] overflow-hidden bg-card min-w-0">
                    <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-muted text-[13px]">
                        <span className="font-semibold text-foreground">Preview</span>
                        <span className="text-muted-foreground">What the guest receives</span>
                    </div>
                    <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 px-4 py-3 border-b border-[#EBEBEB] text-[13px]">
                        <dt className="text-muted-foreground">From</dt>
                        <dd className="break-words">{preview.state === "ok" ? preview.from : "…"}</dd>
                        <dt className="text-muted-foreground">To</dt>
                        <dd className="break-words">{email.trim() || "…"}</dd>
                        <dt className="text-muted-foreground">Subject</dt>
                        <dd className="font-semibold break-words">{preview.state === "ok" ? preview.subject : "…"}</dd>
                    </dl>
                    {preview.state === "ok" ? (
                        <iframe
                            ref={frameRef}
                            title="Email preview"
                            // No scripts run in the preview; same-origin only so its height can be measured
                            sandbox="allow-same-origin"
                            srcDoc={preview.html}
                            onLoad={() => {
                                const doc = frameRef.current?.contentDocument
                                if (doc && frameRef.current) frameRef.current.style.height = `${doc.documentElement.scrollHeight}px`
                            }}
                            className="block w-full h-[720px] bg-[#efece4]"
                        />
                    ) : (
                        <div className="h-[420px] bg-[#efece4] flex items-center justify-center p-8 text-center text-[15px] text-[#7d766a]">
                            {preview.state === "loading" ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <p>
                                    The preview shows once the details are in.
                                    <br />
                                    <span className="font-semibold">{preview.error}</span>
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
