import { NextRequest, NextResponse } from "next/server"
import { getHouseSettings, setHouseSetting } from "@/lib/store"

export const dynamic = "force-dynamic"

export interface HousePricing {
    pricePerNight: number
    cleaningFee: number
    serviceFee: number
    airbnbPricePerNight: number
}

export type PricingData = Record<string, HousePricing>

const DEFAULT_PRICING: PricingData = {
    "house-23": {
        pricePerNight: 51,
        cleaningFee: 10,
        serviceFee: 0,
        airbnbPricePerNight: 61,
    },
    "house-22": {
        pricePerNight: 51,
        cleaningFee: 10,
        serviceFee: 0,
        airbnbPricePerNight: 51,
    },
}

// Saved prices, or the defaults until any have been saved
async function readPricing(): Promise<PricingData> {
    const pricing = await getHouseSettings<HousePricing>("prices")
    return Object.keys(pricing).length > 0 ? pricing : DEFAULT_PRICING
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
