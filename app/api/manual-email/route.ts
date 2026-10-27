// Admin-only: preview or send a guest email by hand (see /admin/emails).
// No booking is created or changed. A "confirmed" send also saves the guest's
// house guide access code, since the email tells them to use it.
import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { FROM_EMAIL } from "@/lib/email"
import { buildManualEmail, parseManualEmail } from "@/lib/manual-email"
import { addGuideAccess } from "@/lib/store"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
    const authCookie = request.cookies.get("admin_auth")
    if (!authCookie || authCookie.value !== "authenticated") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let body: Record<string, unknown>
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const action = body?.action
    if (action !== "preview" && action !== "send") {
        return NextResponse.json({ error: "Unknown action" }, { status: 400 })
    }

    // The page reuses one key while retrying the same email, so Resend delivers
    // it once even if an earlier attempt went through but its answer was lost
    const idempotencyKey = body.idempotencyKey
    if (idempotencyKey !== undefined && (typeof idempotencyKey !== "string" || !/^[A-Za-z0-9_-]{8,128}$/.test(idempotencyKey))) {
        return NextResponse.json({ error: "Invalid idempotency key" }, { status: 400 })
    }

    const parsed = parseManualEmail(body, { requireRecipient: action === "send" })
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })

    const to = parsed.data.guestEmail
    const { subject, html } = buildManualEmail(parsed.template, parsed.data)

    if (action === "preview") {
        return NextResponse.json({ subject, html, from: FROM_EMAIL, to })
    }

    if (!process.env.RESEND_API_KEY) {
        return NextResponse.json({ error: "RESEND_API_KEY is not set on the server" }, { status: 500 })
    }

    // Save the code before sending, so the guest never gets a code that doesn't
    // work. Same code as confirming on the dashboard: the phone's last 4 digits.
    let accessCode: { code: string; added: boolean } | undefined
    if (parsed.template === "confirmed") {
        const code = (parsed.data.guestPhone || "").replace(/\D/g, "").slice(-4)
        if (code.length === 4) {
            try {
                // Does nothing when the code already exists
                const added = await addGuideAccess({ code, label: parsed.data.guestName, source: "manual" })
                accessCode = { code, added: added !== null }
            } catch (err) {
                console.error("[manual-email] Failed to save access code:", err)
                return NextResponse.json(
                    { error: `Couldn't save access code ${code}, so nothing was sent. Try again.` },
                    { status: 500 },
                )
            }
        }
    }

    try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const { data, error } = await resend.emails.send(
            { from: FROM_EMAIL, to, subject, html },
            idempotencyKey ? { idempotencyKey } : undefined,
        )

        if (error) {
            // Resend reports API-level failures here rather than throwing
            return NextResponse.json({ error: `${error.name}: ${error.message}` }, { status: 502 })
        }

        return NextResponse.json({ success: true, id: data?.id, to, from: FROM_EMAIL, subject, accessCode })
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
