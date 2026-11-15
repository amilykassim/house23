// lib/personal-view.ts: whether Insights opens with Expenses and Profit
// before or after personal money, and how that choice is remembered.
require("./helpers/ts-loader.cjs")
const { test } = require("node:test")
const assert = require("node:assert/strict")
const {
    PERSONAL_VIEW_KEY,
    readSavedAfterPersonal,
    saveAfterPersonal,
    resolveAfterPersonal,
} = require("../lib/personal-view.ts")

const memoryStore = (initial = {}) => {
    const data = { ...initial }
    return {
        data,
        getItem: (k) => (k in data ? data[k] : null),
        setItem: (k, v) => {
            data[k] = String(v)
        },
    }
}
const brokenStore = {
    getItem() {
        throw new Error("SecurityError")
    },
    setItem() {
        throw new Error("QuotaExceededError")
    },
}

// Control: what worked before this change keeps working
test("with nothing saved and no link value, Insights opens before personal", () => {
    assert.equal(resolveAfterPersonal(null, readSavedAfterPersonal(memoryStore())), false)
})

test("old ?stipend=after links still open after personal", () => {
    assert.equal(resolveAfterPersonal("after", null), true)
    assert.equal(resolveAfterPersonal("after", false), true)
})

test("an unknown link value is ignored", () => {
    assert.equal(resolveAfterPersonal("yes", null), false)
    assert.equal(resolveAfterPersonal("", true), true)
})

// New behaviour
test("a saved choice is used when the link says nothing (sidebar, reload, next visit)", () => {
    const store = memoryStore()
    saveAfterPersonal(store, true)
    assert.equal(resolveAfterPersonal(null, readSavedAfterPersonal(store)), true)
    saveAfterPersonal(store, false)
    assert.equal(resolveAfterPersonal(null, readSavedAfterPersonal(store)), false)
})

test("a link that names the view wins over the saved choice", () => {
    assert.equal(resolveAfterPersonal("before", true), false)
    assert.equal(resolveAfterPersonal("after", false), true)
})

test("saving twice gives the same result", () => {
    const store = memoryStore()
    saveAfterPersonal(store, true)
    saveAfterPersonal(store, true)
    assert.deepEqual(store.data, { [PERSONAL_VIEW_KEY]: "after" })
})

// Guards: storage that is missing, refuses, or holds junk never breaks the page
test("missing, blocked or junk storage falls back to before", () => {
    assert.equal(readSavedAfterPersonal(undefined), null)
    assert.equal(readSavedAfterPersonal(brokenStore), null)
    assert.equal(readSavedAfterPersonal(memoryStore({ [PERSONAL_VIEW_KEY]: "true" })), null)
    assert.doesNotThrow(() => saveAfterPersonal(brokenStore, true))
    assert.doesNotThrow(() => saveAfterPersonal(undefined, true))
    assert.equal(resolveAfterPersonal(null, readSavedAfterPersonal(brokenStore)), false)
})
