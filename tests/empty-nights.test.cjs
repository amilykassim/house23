// lib/earnings.ts emptyNightsAhead: the "Empty nights" tile on Insights counts
// only nights that can still be booked (tonight to the period's end).
require("./helpers/ts-loader.cjs")
const { test } = require("node:test")
const assert = require("node:assert/strict")
const { emptyNightsAhead, summarizeEarnings, periodFor } = require("../lib/earnings.ts")

const d = (s) => new Date(`${s}T00:00:00`)
const HOUSES = ["house-23", "house-22"]
let n = 0
const booking = (house, checkIn, checkOut, status = "confirmed") => ({
    id: `B${++n}`, house, checkIn, checkOut, total: 0, totalRwf: 70_000, status, createdAt: "2026-01-01",
})
// The tile's old formula: every night of the period minus the booked ones
const oldEmpty = (bookings, period, houses) => {
    const s = summarizeEarnings(bookings, period, houses)
    const days = s.capacity / houses.length
    return houses.reduce((sum, h) => sum + Math.max(days - (s.byHouse[h]?.nights || 0), 0), 0)
}

const NOV = periodFor("month", d("2026-11-15"))
const BOOKINGS = [
    booking("house-23", "2026-11-03", "2026-11-10"), // past, 7 nights
    booking("house-23", "2026-11-14", "2026-11-18"), // 14–17: 15, 16, 17 from today
    booking("house-22", "2026-11-20", "2026-11-22"), // 2 nights ahead
    booking("house-22", "2026-11-25", "2026-11-27", "pending"),
    booking("house-22", "2026-11-28", "2026-11-29", "cancelled"),
]

test("the bug: past unbooked nights no longer count (screenshot case)", () => {
    // Today is the 15th: 16 nights left per house (15th–30th)
    const r = emptyNightsAhead(BOOKINGS, NOV, HOUSES, d("2026-11-15"))
    assert.deepEqual(r.byHouse, { "house-23": 16 - 3, "house-22": 16 - 2 })
    assert.equal(r.total, 27)
    assert.equal(r.startsToday, true)
    // The old formula counted the whole month
    assert.equal(oldEmpty(BOOKINGS, NOV, HOUSES), 60 - 11 - 2)
})

test("tonight counts as bookable; a booking that starts tonight takes it", () => {
    const r = emptyNightsAhead([booking("house-23", "2026-11-30", "2026-12-02")], NOV, ["house-23"], d("2026-11-30"))
    assert.equal(r.total, 0)
    const free = emptyNightsAhead([], NOV, ["house-23"], d("2026-11-30"))
    assert.equal(free.total, 1)
})

test("a period that is over has no empty nights", () => {
    const oct = periodFor("month", d("2026-10-10"))
    assert.deepEqual(emptyNightsAhead(BOOKINGS, oct, HOUSES, d("2026-11-15")), {
        total: 0, byHouse: { "house-23": 0, "house-22": 0 }, startsToday: false,
    })
})

// Controls: what the tile showed correctly before stays the same
test("a period wholly ahead gives the same number as before", () => {
    const dec = periodFor("month", d("2026-12-01"))
    const ahead = [
        booking("house-23", "2026-11-29", "2026-12-04"), // crosses into December: 3 nights
        booking("house-22", "2026-12-24", "2027-01-02"), // 8 nights in December
        booking("house-22", "2026-12-10", "2026-12-12", "pending"),
    ]
    const r = emptyNightsAhead(ahead, dec, HOUSES, d("2026-11-15"))
    assert.equal(r.total, oldEmpty(ahead, dec, HOUSES))
    assert.equal(r.total, 62 - 3 - 8)
    assert.equal(r.startsToday, false)
    const year = periodFor("year", d("2027-03-01"))
    assert.equal(emptyNightsAhead(ahead, year, HOUSES, d("2026-11-15")).total, oldEmpty(ahead, year, HOUSES))
})

test("only confirmed bookings fill a night, as before", () => {
    const r = emptyNightsAhead(
        [booking("house-22", "2026-11-20", "2026-11-22", "pending"), booking("house-22", "2026-11-23", "2026-11-24", "cancelled")],
        NOV, ["house-22"], d("2026-11-15")
    )
    assert.equal(r.total, 16)
})

test("one house picked counts only that house", () => {
    const r = emptyNightsAhead(BOOKINGS, NOV, ["house-22"], d("2026-11-15"))
    assert.deepEqual(r.byHouse, { "house-22": 14 })
    assert.equal(r.total, 14)
})

// Guards
test("overlapping bookings on one house never push the count below zero", () => {
    const twice = [booking("house-23", "2026-11-20", "2026-11-25"), booking("house-23", "2026-11-22", "2026-11-28")]
    const r = emptyNightsAhead(twice, NOV, ["house-23"], d("2026-11-15"))
    assert.equal(r.total, 16 - 8) // 20th–27th held once
})

test("a booking with no nights or bad dates is ignored", () => {
    const r = emptyNightsAhead(
        [booking("house-23", "2026-11-20", "2026-11-20"), booking("house-23", "2026-11-22", "2026-11-21")],
        NOV, ["house-23"], d("2026-11-15")
    )
    assert.equal(r.total, 16)
})
