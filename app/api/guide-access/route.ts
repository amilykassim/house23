import { NextRequest, NextResponse } from "next/server"
import { readData, writeData } from "@/lib/storage"
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

async function readAccess(): Promise<GuideAccessEntry[]> {
    return readData<GuideAccessEntry[]>("guide-access.json", [])
}

async function writeAccess(data: GuideAccessEntry[]): Promise<void> {
    await writeData("guide-access.json", data)
}

/**
 * GET  — list all access codes (admin) or verify one code (guest)
 *   ?verify=1234  → { valid: true/false }
 *   (no query)    → { entries: [...] }
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const verify = searchParams.get("verify")

    const entries = await readAccess()

    if (verify) {
        const code = verify.replace(/\D/g, "").slice(-4)
        const entry = entries.find((e) => e.code === code)
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

    return NextResponse.json({ entries })
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

    const entries = await readAccess()

    // Prevent duplicates
    const exists = entries.find((e) => e.code === code)
    if (exists) {
        return NextResponse.json(
            { error: "This code already exists", existing: exists },
            { status: 409 }
        )
    }

    const entry: GuideAccessEntry = {
        code,
        label: label || "",
        source: source || "manual",
        bookingId: bookingId || undefined,
        createdAt: new Date().toISOString(),
    }

    entries.push(entry)
    await writeAccess(entries)

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

    const entries = await readAccess()
    const index = entries.findIndex((e) => e.code === code)

    if (index === -1) {
        return NextResponse.json({ error: "Code not found" }, { status: 404 })
    }

    if (label !== undefined) entries[index].label = label
    await writeAccess(entries)

    return NextResponse.json({ entry: entries[index] })
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

    let entries = await readAccess()

    if (deleteAll === "true") {
        await writeAccess([])
        return NextResponse.json({ deleted: entries.length })
    }

    if (multipleCodes) {
        const codesToDelete = new Set(multipleCodes.split(",").map((c) => c.trim()))
        const before = entries.length
        entries = entries.filter((e) => !codesToDelete.has(e.code))
        await writeAccess(entries)
        return NextResponse.json({ deleted: before - entries.length })
    }

    if (singleCode) {
        const before = entries.length
        entries = entries.filter((e) => e.code !== singleCode)
        if (entries.length === before) {
            return NextResponse.json({ error: "Code not found" }, { status: 404 })
        }
        await writeAccess(entries)
        return NextResponse.json({ deleted: 1 })
    }

    return NextResponse.json({ error: "Provide code, codes, or all=true" }, { status: 400 })
}
