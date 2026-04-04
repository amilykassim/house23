import { NextRequest, NextResponse } from "next/server"
import { readData, writeData } from "@/lib/storage"

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const house = searchParams.get("house")

    const data = await readData<Record<string, string[]>>("blocked-dates.json", {})

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

    const data = await readData<Record<string, string[]>>("blocked-dates.json", {})
    const current = new Set(data[house] || [])

    if (action === "block") {
        dates.forEach((d) => current.add(d))
    } else {
        dates.forEach((d) => current.delete(d))
    }

    data[house] = Array.from(current).sort()
    await writeData("blocked-dates.json", data)

    return NextResponse.json({ dates: data[house] })
}
