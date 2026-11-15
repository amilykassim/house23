// Fixed USD → RWF rate used for booking totals across the site and admin.
export const USD_TO_RWF = 1471

// Back office only: the nightly rate, in RWF, behind "Use the set price" on
// Add booking and the value of empty nights on Insights. The public site
// keeps its own prices (data/prices.json).
export const ADMIN_NIGHTLY_PRICE_RWF = 70_000

// Back office amounts: francs first, dollars as the secondary figure.
export const formatRwf = (n: number) => `${Math.round(n).toLocaleString("en-US")} RWF`
export const formatUsd = (n: number) => `$${(Math.round(n * 100) / 100).toLocaleString("en-US")}`
// Short label for narrow chart columns: 950, 95k, 1.25M
export const compactRwf = (n: number) => {
    const r = Math.round(n)
    if (r >= 1_000_000) return `${(r / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`
    if (r >= 1_000) return `${Math.round(r / 1_000)}k`
    return `${r}`
}
// A stored USD price line (per night, cleaning) in RWF. Bookings added by hand
// store their USD price converted from francs and rounded to cents (off by at
// most 7.4 RWF), so the nearest 100 RWF gives back the francs that were set
// (70,000, not 70,005).
export const usdLineToRwf = (usd: number, addedByHand = false) =>
    addedByHand ? Math.round((usd * USD_TO_RWF) / 100) * 100 : Math.round(usd * USD_TO_RWF)
