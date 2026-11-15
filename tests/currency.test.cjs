// lib/currency.ts: the back office shows francs first and dollars second.
require("./helpers/ts-loader.cjs")
const { test } = require("node:test")
const assert = require("node:assert/strict")
const {
    USD_TO_RWF,
    ADMIN_NIGHTLY_PRICE_RWF,
    formatRwf,
    formatUsd,
    compactRwf,
    usdLineToRwf,
} = require("../lib/currency.ts")

test("the rates stay as they were", () => {
    assert.equal(USD_TO_RWF, 1471)
    assert.equal(ADMIN_NIGHTLY_PRICE_RWF, 70_000)
})

test("francs: whole, grouped, with RWF", () => {
    assert.equal(formatRwf(9_532_080), "9,532,080 RWF")
    assert.equal(formatRwf(0), "0 RWF")
    assert.equal(formatRwf(70_004.6), "70,005 RWF")
})

test("dollars: grouped, cents only when there are some", () => {
    assert.equal(formatUsd(6480), "$6,480")
    assert.equal(formatUsd(47.59), "$47.59")
    assert.equal(formatUsd(0), "$0")
})

test("compact chart labels", () => {
    assert.equal(compactRwf(950), "950")
    assert.equal(compactRwf(95_615), "96k")
    assert.equal(compactRwf(1_250_000), "1.25M")
    assert.equal(compactRwf(2_000_000), "2M")
    assert.equal(compactRwf(0), "0")
})

test("website price lines convert at the fixed rate", () => {
    assert.equal(usdLineToRwf(65), 95_615)
    assert.equal(usdLineToRwf(31), 45_601) // not snapped: only by-hand prices are
    assert.equal(usdLineToRwf(0), 0)
})

test("a by-hand price gives back the francs it was set from", () => {
    // What Add booking stores for the 70,000 RWF set price
    const stored = Math.round((ADMIN_NIGHTLY_PRICE_RWF / USD_TO_RWF) * 100) / 100
    assert.equal(Math.round(stored * USD_TO_RWF), 70_005) // the problem
    assert.equal(usdLineToRwf(stored, true), 70_000)
    // any set price in hundreds of francs comes back exactly
    for (let set = 100; set <= 500_000; set += 100) {
        assert.equal(usdLineToRwf(Math.round((set / USD_TO_RWF) * 100) / 100, true), set, String(set))
    }
})
