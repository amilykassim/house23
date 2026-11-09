import { houses } from "@/lib/houses"

// The prices the admin sets on the Pricing panel (/admin/listing), saved per
// house under the "prices" key of house_settings. Every public price label
// should come from here (via /api/prices) rather than from lib/houses.ts, whose
// numbers are only the fallback until the first save and for server rendering.

export interface HousePricing {
    pricePerNight: number
    cleaningFee: number
    serviceFee: number
    airbnbPricePerNight: number
}

export type PricingData = Record<string, HousePricing>

// What Airbnb lists each house at, until the admin saves a figure
const DEFAULT_AIRBNB_PRICE: Record<string, number> = {
    "house-23": 61,
    "house-22": 51,
}

// Defaults derived from lib/houses.ts so the two never disagree
export const DEFAULT_PRICING: PricingData = Object.fromEntries(
    houses.map((house) => [
        house.slug,
        {
            pricePerNight: house.pricePerNight,
            cleaningFee: house.cleaningFee,
            serviceFee: house.serviceFee,
            airbnbPricePerNight: DEFAULT_AIRBNB_PRICE[house.slug] ?? house.pricePerNight,
        },
    ])
)

// Saved prices over the defaults, so a house that has never been saved still
// has a complete entry.
export function resolvePricing(saved: Partial<PricingData> | null | undefined): PricingData {
    const result: PricingData = {}
    for (const slug of Object.keys(DEFAULT_PRICING)) {
        result[slug] = { ...DEFAULT_PRICING[slug], ...(saved?.[slug] ?? {}) }
    }
    for (const [slug, value] of Object.entries(saved ?? {})) {
        if (!(slug in result) && value) result[slug] = value
    }
    return result
}

// Percent saved by booking direct instead of on Airbnb; null when there is no
// saving to advertise (or no Airbnb price to compare against).
export function savingsPercent(pricing: Pick<HousePricing, "pricePerNight" | "airbnbPricePerNight"> | undefined): number | null {
    if (!pricing || !(pricing.airbnbPricePerNight > 0)) return null
    const saving = pricing.airbnbPricePerNight - pricing.pricePerNight
    if (saving <= 0) return null
    return Math.round((saving / pricing.airbnbPricePerNight) * 100)
}
