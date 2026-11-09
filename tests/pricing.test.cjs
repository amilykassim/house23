// The admin-set prices (lib/pricing.ts): what /api/prices serves when nothing,
// some or all houses have been saved, and the direct-booking savings figure.
require("./helpers/ts-loader.cjs")
const { test } = require("node:test")
const assert = require("node:assert/strict")
const { houses } = require("../lib/houses.ts")
const { DEFAULT_PRICING, resolvePricing, savingsPercent } = require("../lib/pricing.ts")

test("defaults match lib/houses.ts for every house", () => {
    assert.deepEqual(Object.keys(DEFAULT_PRICING).sort(), houses.map((h) => h.slug).sort())
    for (const house of houses) {
        const d = DEFAULT_PRICING[house.slug]
        assert.equal(d.pricePerNight, house.pricePerNight, `${house.slug} nightly rate`)
        assert.equal(d.cleaningFee, house.cleaningFee, `${house.slug} cleaning fee`)
        assert.equal(d.serviceFee, house.serviceFee, `${house.slug} service fee`)
        assert.ok(d.airbnbPricePerNight > 0, `${house.slug} has an Airbnb price`)
    }
})

test("nothing saved: the defaults", () => {
    assert.deepEqual(resolvePricing({}), DEFAULT_PRICING)
    assert.deepEqual(resolvePricing(null), DEFAULT_PRICING)
    assert.deepEqual(resolvePricing(undefined), DEFAULT_PRICING)
})

test("everything saved: exactly what the admin saved, defaults ignored", () => {
    const saved = {
        "house-23": { pricePerNight: 51, cleaningFee: 10, serviceFee: 0, airbnbPricePerNight: 70 },
        "house-22": { pricePerNight: 51, cleaningFee: 10, serviceFee: 0, airbnbPricePerNight: 70 },
    }
    assert.deepEqual(resolvePricing(saved), saved)
})

test("one house saved: it wins, the other keeps its defaults", () => {
    const saved = { "house-22": { pricePerNight: 55, cleaningFee: 12, serviceFee: 1, airbnbPricePerNight: 80 } }
    const resolved = resolvePricing(saved)
    assert.deepEqual(resolved["house-22"], saved["house-22"])
    assert.deepEqual(resolved["house-23"], DEFAULT_PRICING["house-23"])
})

test("a saved entry missing a field falls back to that field's default", () => {
    const resolved = resolvePricing({ "house-23": { pricePerNight: 60 } })
    assert.equal(resolved["house-23"].pricePerNight, 60)
    assert.equal(resolved["house-23"].cleaningFee, DEFAULT_PRICING["house-23"].cleaningFee)
    assert.equal(resolved["house-23"].airbnbPricePerNight, DEFAULT_PRICING["house-23"].airbnbPricePerNight)
})

test("resolvePricing does not mutate the defaults", () => {
    const before = JSON.stringify(DEFAULT_PRICING)
    const resolved = resolvePricing({ "house-23": { pricePerNight: 1 } })
    resolved["house-23"].cleaningFee = 999
    assert.equal(JSON.stringify(DEFAULT_PRICING), before)
})

test("savingsPercent: rounded percent off the Airbnb price", () => {
    assert.equal(savingsPercent({ pricePerNight: 51, airbnbPricePerNight: 70 }), 27)
    assert.equal(savingsPercent({ pricePerNight: 40, airbnbPricePerNight: 50 }), 20)
})

test("savingsPercent: nothing to advertise when direct is not cheaper or no Airbnb price", () => {
    assert.equal(savingsPercent({ pricePerNight: 51, airbnbPricePerNight: 51 }), null)
    assert.equal(savingsPercent({ pricePerNight: 60, airbnbPricePerNight: 51 }), null)
    assert.equal(savingsPercent({ pricePerNight: 51, airbnbPricePerNight: 0 }), null)
    assert.equal(savingsPercent(undefined), null)
})
