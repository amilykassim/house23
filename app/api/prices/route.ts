import { NextRequest, NextResponse } from "next/server"
import { getHouseSettings, setHouseSetting } from "@/lib/store"
import { resolvePricing, type HousePricing, type PricingData } from "@/lib/pricing"

export const dynamic = "force-dynamic"

export type { HousePricing, PricingData }

// Saved prices over the defaults (lib/pricing.ts) for any house not yet saved
async function readPricing(): Promise<PricingData> {
    const pricing = await getHouseSettings<HousePricing>("prices")
    return resolvePricing(pricing)
}

export async function GET() {
    const pricing = await readPricing()
    return NextResponse.json(pricing)
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json()
        const { slug, pricePerNight, cleaningFee, serviceFee, airbnbPricePerNight } = body

        if (!slug || typeof slug !== "string") {
            return NextResponse.json({ error: "Invalid slug" }, { status: 400 })
        }

        const pricing = await readPricing()

        if (!pricing[slug]) {
            return NextResponse.json({ error: "House not found" }, { status: 404 })
        }

        // Update only provided fields
        if (typeof pricePerNight === "number" && pricePerNight >= 0) {
            pricing[slug].pricePerNight = pricePerNight
        }
        if (typeof cleaningFee === "number" && cleaningFee >= 0) {
            pricing[slug].cleaningFee = cleaningFee
        }
        if (typeof serviceFee === "number" && serviceFee >= 0) {
            pricing[slug].serviceFee = serviceFee
        }
        if (typeof airbnbPricePerNight === "number" && airbnbPricePerNight >= 0) {
            pricing[slug].airbnbPricePerNight = airbnbPricePerNight
        }

        await setHouseSetting("prices", slug, pricing[slug])

        return NextResponse.json({ success: true, pricing: pricing[slug] })
    } catch {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }
}
