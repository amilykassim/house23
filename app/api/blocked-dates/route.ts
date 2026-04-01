import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const DATA_FILE = path.join(process.cwd(), "data", "blocked-dates.json")

function readBlockedDates(): Record<string, string[]> {
    try {
        const raw = fs.readFileSync(DATA_FILE, "utf-8")
        return JSON.parse(raw)
    } catch {
        return {}
    }
}

function writeBlockedDates(data: Record<string, string[]>) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const house = searchParams.get("house")

    const data = readBlockedDates()

    if (house) {
        return NextResponse.json({ dates: data[house] || [] })
    }

    return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
    const body = await request.json()
    const { house, dates, action } = body as {
        house: string
        dates: string[]
        action: "block" | "unblock"
    }

    if (!house || !dates || !action) {
        return NextResponse.json(
            { error: "Missing required fields: house, dates, action" },
            { status: 400 }
        )
    }

    const data = readBlockedDates()
    const current = new Set(data[house] || [])

    if (action === "block") {
        dates.forEach((d) => current.add(d))
    } else {
        dates.forEach((d) => current.delete(d))
    }

    data[house] = Array.from(current).sort()
    writeBlockedDates(data)

    return NextResponse.json({ dates: data[house] })
}
