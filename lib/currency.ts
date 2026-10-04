// Fixed USD → RWF rate used for booking totals across the site and admin.
export const USD_TO_RWF = 1471

// Back office only: the nightly rate, in RWF, behind "Use the set price" on
// Add booking and the value of empty nights on Insights. The public site
// keeps its own prices (data/prices.json).
export const ADMIN_NIGHTLY_PRICE_RWF = 70_000
