import { NextRequest, NextResponse } from "next/server"
import { getHouseSettings, setHouseSetting } from "@/lib/store"

export const dynamic = "force-dynamic"

// Maps house slug -> ordered array of photo src paths
export type PhotoOrderData = Record<string, string[]>

export async function GET() {
    const order: PhotoOrderData = await getHouseSettings<string[]>("photo-order")
    return NextResponse.json(order)
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json()
        const { slug, photos } = body

        if (!slug || typeof slug !== "string") {
            return NextResponse.json({ error: "Invalid slug" }, { status: 400 })
        }

        if (!Array.isArray(photos) || !photos.every((p: unknown) => typeof p === "string")) {
            return NextResponse.json({ error: "Invalid photos array" }, { status: 400 })
        }

        await setHouseSetting("photo-order", slug, photos)

        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }
}
