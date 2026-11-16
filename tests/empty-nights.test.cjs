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

// Nights taken outside the bookings list (manual blocks, Airbnb calendar):
// Empty nights must match the open nights on the admin calendar.
const range = (from, to) => {
    const out = []
    for (let t = d(from); t <= d(to); t.setDate(t.getDate() + 1)) {
        out.push(`${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`)
    }
    return out
}

test("the bug: a night red on the calendar but not a confirmed booking (screenshot, 16 Nov)", () => {
    // House 22: Airbnb holds 16–23 and 27–30 (12 nights); the app's confirmed
    // bookings cover only 11 of them. House 23: Airbnb holds 16, 20, 21, 29.
    const bookings = [
        booking("house-22", "2026-11-16", "2026-11-23"), // 16–22: 7 nights, the 23rd missing
        booking("house-22", "2026-11-27", "2026-12-01"), // 27–30: 4 nights
        booking("house-23", "2026-11-16", "2026-11-17"),
        booking("house-23", "2026-11-20", "2026-11-22"),
        booking("house-23", "2026-11-29", "2026-11-30"),
    ]
    const airbnb = {
        "house-22": [...range("2026-11-16", "2026-11-23"), ...range("2026-11-27", "2026-11-30")],
        "house-23": ["2026-11-16", "2026-11-20", "2026-11-21", "2026-11-29"],
    }
    const before = emptyNightsAhead(bookings, NOV, HOUSES, d("2026-11-16"))
    assert.deepEqual(before.byHouse, { "house-23": 11, "house-22": 4 }) // what the tile showed: 15
    const r = emptyNightsAhead(bookings, NOV, HOUSES, d("2026-11-16"), airbnb)
    assert.deepEqual(r.byHouse, { "house-23": 11, "house-22": 3 })
    assert.equal(r.total, 14)
    assert.equal(r.startsToday, true)
})

test("manual blocks and Airbnb nights count once alongside bookings that hold the same night", () => {
    const r = emptyNightsAhead(
        [booking("house-23", "2026-11-20", "2026-11-23")], // 20, 21, 22
        NOV, ["house-23"], d("2026-11-15"),
        { "house-23": ["2026-11-21", "2026-11-22", "2026-11-22", "2026-11-25"] }
    )
    assert.equal(r.total, 16 - 4) // 20, 21, 22, 25
})

test("unavailable nights outside the bookable window or for other houses are ignored", () => {
    const r = emptyNightsAhead([], NOV, ["house-23"], d("2026-11-15"), {
        "house-23": ["2026-11-14", "2026-10-30", "2026-12-01", "2026-11-15"], // only the 15th counts
        "house-22": ["2026-11-20"], // not shown
        "house-99": ["2026-11-20"],
    })
    assert.deepEqual(r.byHouse, { "house-23": 15 })
    // A period that is over still has none
    const oct = periodFor("month", d("2026-10-10"))
    assert.equal(emptyNightsAhead([], oct, ["house-23"], d("2026-11-15"), { "house-23": ["2026-10-20"] }).total, 0)
})

test("bad unavailable data is ignored, never crashes or goes below zero", () => {
    const r = emptyNightsAhead([], NOV, ["house-23"], d("2026-11-15"), {
        "house-23": ["2026-11-2", "nope", null, 20261120, "2026-11-20T00:00:00", ...range("2026-11-15", "2026-11-30"), "2026-11-30"],
    })
    assert.equal(r.total, 0)
    assert.equal(emptyNightsAhead([], NOV, ["house-23"], d("2026-11-15"), { "house-23": "2026-11-20" }).total, 16)
})

test("controls: no unavailable list, or an empty one, gives exactly the old result", () => {
    for (const today of ["2026-11-15", "2026-11-30", "2026-10-01"]) {
        const base = emptyNightsAhead(BOOKINGS, NOV, HOUSES, d(today))
        assert.deepEqual(emptyNightsAhead(BOOKINGS, NOV, HOUSES, d(today), {}), base)
        assert.deepEqual(emptyNightsAhead(BOOKINGS, NOV, HOUSES, d(today), { "house-23": [], "house-22": [] }), base)
    }
})
