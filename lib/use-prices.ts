"use client"

import { useEffect, useState } from "react"
import type { PricingData } from "@/lib/pricing"

// The admin-set prices from /api/prices; null until they arrive (callers fall
// back to the static figures in lib/houses.ts meanwhile) and on failure.
export function usePrices(): PricingData | null {
    const [prices, setPrices] = useState<PricingData | null>(null)

    useEffect(() => {
        let cancelled = false
        fetch("/api/prices")
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (!cancelled && data && typeof data === "object") setPrices(data as PricingData)
            })
            .catch(() => {})
        return () => {
            cancelled = true
        }
    }, [])

    return prices
}
