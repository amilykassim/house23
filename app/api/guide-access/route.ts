import { NextRequest, NextResponse } from "next/server"
import {
    addGuideAccess,
    deleteGuideAccess,
    findGuideAccess,
    listGuideAccess,
    setGuideAccessLabel,
} from "@/lib/store"
import { sendAdminGuideAccessNotification } from "@/lib/email"

export const dynamic = "force-dynamic"

export interface GuideAccessEntry {
    /** Last 4 digits of the phone number */
    code: string
    /** Optional label (e.g. guest name or "Auto: BK-001") */
    label: string
    /** "manual" = added by admin, "booking" = auto-added from an accepted booking */
    source: "manual" | "booking"
    /** If source is "booking", the booking ID */
    bookingId?: string
    /** ISO timestamp of when this was added */
    createdAt: string
}

/**
 * GET  — list all access codes (admin) or verify one code (guest)
 *   ?verify=1234  → { valid: true/false }
 *   (no query)    → { entries: [...] }
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const verify = searchParams.get("verify")

    if (verify) {
        const code = verify.replace(/\D/g, "").slice(-4)
        const entry = await findGuideAccess(code)
        if (entry) {
            // Notify admin that a guest accessed WiFi details (fire and forget)
            sendAdminGuideAccessNotification({
                guestName: entry.label || "Unknown Guest",
                code: entry.code,
            }).catch(() => {})
            return NextResponse.json({ valid: true, name: entry.label })
        }
        return NextResponse.json({ valid: false })
    }

    return NextResponse.json({ entries: await listGuideAccess() })
}

/**
 * POST — add a new access code
 * Body: { code: "1234", label?: "Guest Name" }
 */
export async function POST(request: NextRequest) {
    const body = await request.json()
    const { code, label, source, bookingId } = body as {
        code?: string
        label?: string
        source?: "manual" | "booking"
        bookingId?: string
    }

    if (!code || !/^\d{4}$/.test(code)) {
        return NextResponse.json(
            { error: "Code must be exactly 4 digits" },
            { status: 400 }
        )
    }

    const entry = await addGuideAccess({
        code,
        label: label || "",
        source: source === "booking" ? "booking" : "manual",
        bookingId: bookingId || undefined,
    })

    // Prevent duplicates
    if (!entry) {
        return NextResponse.json(
            { error: "This code already exists", existing: await findGuideAccess(code) },
            { status: 409 }
        )
    }

    return NextResponse.json({ entry }, { status: 201 })
}

/**
 * PATCH — update an existing entry (label)
 * Body: { code: "1234", label: "New Name" }
 */
export async function PATCH(request: NextRequest) {
    const body = await request.json()
    const { code, label } = body as { code: string; label?: string }

    if (!code) {
        return NextResponse.json({ error: "Missing code" }, { status: 400 })
    }

    const entry =
        label !== undefined ? await setGuideAccessLabel(code, String(label)) : await findGuideAccess(code)

    if (!entry) {
        return NextResponse.json({ error: "Code not found" }, { status: 404 })
    }

    return NextResponse.json({ entry })
}

/**
 * DELETE — remove one or more access codes
 * Query: ?code=1234          → delete single
 *        ?codes=1234,5678    → delete multiple
 *        ?all=true           → delete all
 */
export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const singleCode = searchParams.get("code")
    const multipleCodes = searchParams.get("codes")
    const deleteAll = searchParams.get("all")

    if (deleteAll === "true") {
        return NextResponse.json({ deleted: await deleteGuideAccess("all") })
    }

    if (multipleCodes) {
        const codesToDelete = multipleCodes.split(",").map((c) => c.trim())
        return NextResponse.json({ deleted: await deleteGuideAccess(codesToDelete) })
    }

    if (singleCode) {
        if ((await deleteGuideAccess([singleCode])) === 0) {
            return NextResponse.json({ error: "Code not found" }, { status: 404 })
        }
        return NextResponse.json({ deleted: 1 })
    }

    return NextResponse.json({ error: "Provide code, codes, or all=true" }, { status: 400 })
}
