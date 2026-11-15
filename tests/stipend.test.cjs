// lib/earnings.ts stipendForPeriod: the monthly stipend that falls inside a
// period on the Earnings page when it is shown "after stipend".
require("./helpers/ts-loader.cjs")
const { test } = require("node:test")
const assert = require("node:assert/strict")
const { stipendForPeriod, periodFor, MONTHLY_STIPEND_RWF } = require("../lib/earnings.ts")

const d = (s) => new Date(`${s}T00:00:00`)

test("the stipend is 350,000 RWF a month", () => {
    assert.equal(MONTHLY_STIPEND_RWF, 350_000)
})

test("a whole month counts in full, whatever its length", () => {
    for (const m of ["2026-02-10", "2026-04-01", "2026-11-15", "2028-02-29"]) {
        const p = periodFor("month", d(m))
        assert.equal(stipendForPeriod(p.start, p.end), 350_000, m)
    }
})

test("a whole year is twelve months", () => {
    const p = periodFor("year", d("2026-06-01"))
    assert.equal(stipendForPeriod(p.start, p.end), 4_200_000)
})

test("part of a month counts for its share of the days", () => {
    // 15 of November's 30 days
    assert.equal(stipendForPeriod(d("2026-11-01"), d("2026-11-15")), 175_000)
    // a single day of a 31-day month
    assert.equal(stipendForPeriod(d("2026-12-31"), d("2026-12-31")), Math.round(350_000 / 31))
})

test("a week across a month end takes each month's share", () => {
    // Mon 28 Sep to Sun 4 Oct 2026: 3 of 30 days + 4 of 31 days
    const p = periodFor("week", d("2026-09-30"))
    assert.equal(stipendForPeriod(p.start, p.end), Math.round((350_000 * 3) / 30 + (350_000 * 4) / 31))
})

test("an end before the start is nothing; a custom amount is honoured", () => {
    assert.equal(stipendForPeriod(d("2026-11-10"), d("2026-11-01")), 0)
    assert.equal(stipendForPeriod(d("2026-11-01"), d("2026-11-30"), 100_000), 100_000)
})
