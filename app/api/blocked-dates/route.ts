import { NextRequest, NextResponse } from "next/server"
import { blockDates, getAllBlockedDates, getBlockedDates, unblockDates } from "@/lib/store"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const house = searchParams.get("house")

    if (house) {
        return NextResponse.json({ dates: await getBlockedDates(house) })
    }

    return NextResponse.json(await getAllBlockedDates())
}

export async function POST(request: NextRequest) {
    const body = await request.json()
    const { house, dates, action } = body as {
        house: string
        dates: string[]
        action: "block" | "unblock"
    }

    if (!house || !Array.isArray(dates) || !action) {
        return NextResponse.json(
            { error: "Missing required fields: house, dates, action" },
            { status: 400 }
        )
    }

    if (action === "block") {
        await blockDates(house, dates)
    } else {
        await unblockDates(house, dates)
    }

    return NextResponse.json({ dates: await getBlockedDates(house) })
}
