import { NextRequest, NextResponse } from "next/server"
import { readData, writeData } from "@/lib/storage"

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

export async function GET() {
    const pricing = await readData<PricingData>("prices.json", DEFAULT_PRICING)
    return NextResponse.json(pricing)
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json()
        const { slug, pricePerNight, cleaningFee, serviceFee, airbnbPricePerNight } = body

        if (!slug || typeof slug !== "string") {
            return NextResponse.json({ error: "Invalid slug" }, { status: 400 })
        }

        const pricing = await readData<PricingData>("prices.json", DEFAULT_PRICING)

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

        await writeData("prices.json", pricing)

        return NextResponse.json({ success: true, pricing: pricing[slug] })
    } catch {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }
}
