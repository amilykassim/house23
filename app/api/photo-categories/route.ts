import { NextRequest, NextResponse } from "next/server"
import { getHouseSettings, setHouseSetting } from "@/lib/store"

export const dynamic = "force-dynamic"

// Maps house slug -> { photoSrc -> category }
export type PhotoCategoryData = Record<string, Record<string, string>>

export async function GET() {
    const categories: PhotoCategoryData = await getHouseSettings<Record<string, string>>("photo-categories")
    return NextResponse.json(categories)
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json()
        const { slug, categories } = body

        if (!slug || typeof slug !== "string") {
            return NextResponse.json({ error: "Invalid slug" }, { status: 400 })
        }

        if (
            !categories ||
            typeof categories !== "object" ||
            Array.isArray(categories)
        ) {
            return NextResponse.json({ error: "Invalid categories object" }, { status: 400 })
        }

        await setHouseSetting("photo-categories", slug, categories)

        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }
}
