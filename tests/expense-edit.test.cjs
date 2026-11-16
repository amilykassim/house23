// Editing an expense line from the Expenses page: planExpenseEdit
// (lib/expenses.ts) and PATCH /api/expenses.
//
// The route tests need a Postgres with db/schema.sql loaded:
//   TEST_DATABASE_URL=postgresql://user@localhost:5432/casa_test npm test
// They are skipped without it, and refuse any host but localhost so they can
// never touch the production database.
const TEST_DB = process.env.TEST_DATABASE_URL
if (TEST_DB && !/^postgres(ql)?:\/\/[^@/]*@?(localhost|127\.0\.0\.1)[:/]/.test(TEST_DB)) {
    throw new Error("TEST_DATABASE_URL must point at localhost")
}
// The app's pool reads DATABASE_URL; never let these tests use the real one
process.env.DATABASE_URL = TEST_DB || "postgresql://no-database-for-tests@localhost:1/none"
require("./helpers/ts-loader.cjs")
const { test, after } = require("node:test")
const assert = require("node:assert/strict")
const { planExpenseEdit, expenseGroupId } = require("../lib/expenses.ts")

const HOUSES = ["house-23", "house-22"]
const edit = { category: "Repairs", note: "Washing machine", amountRwf: 70000, date: "2026-11-08" }

// ------------------------------------------------------------- planExpenseEdit

test("a one-house expense takes the whole new amount", () => {
    assert.deepEqual(planExpenseEdit([{ id: "EX-a", house: "house-22" }], edit, HOUSES), [{ id: "EX-a", ...edit }])
})

test("an expense recorded whole for all houses (older format) stays one row", () => {
    assert.deepEqual(planExpenseEdit([{ id: "EX-old", house: "all" }], edit, HOUSES), [{ id: "EX-old", ...edit }])
})

test("a split expense is shared out again in house order, remainder to the first house", () => {
    // Rows given in the wrong order: house order decides who gets the extra franc
    const plan = planExpenseEdit(
        [
            { id: "EX-b-2", house: "house-22" },
            { id: "EX-b-1", house: "house-23" },
        ],
        { ...edit, amountRwf: 70001 },
        HOUSES
    )
    assert.deepEqual(plan, [
        { id: "EX-b-1", ...edit, amountRwf: 35001 },
        { id: "EX-b-2", ...edit, amountRwf: 35000 },
    ])
})

test("Pennywise and copied-month ids split the same way", () => {
    const pw = planExpenseEdit(
        [
            { id: "PW-1f0c-1", house: "house-23" },
            { id: "PW-1f0c-2", house: "house-22" },
        ],
        edit,
        HOUSES
    )
    assert.deepEqual(pw.map((r) => r.amountRwf), [35000, 35000])
    assert.equal(expenseGroupId("EX-k3c2-1"), "EX-k3c2")
})

test("rows of two different expenses are refused", () => {
    const rows = [
        { id: "EX-a-1", house: "house-23" },
        { id: "EX-b-2", house: "house-22" },
    ]
    assert.equal(planExpenseEdit(rows, edit, HOUSES), "Those rows are not one expense")
})

test("two rows for the same house, or a bare id with its share, are refused", () => {
    assert.equal(
        planExpenseEdit([{ id: "EX-a-1", house: "house-23" }, { id: "EX-a-2", house: "house-23" }], edit, HOUSES),
        "Those rows are not one expense"
    )
    assert.equal(
        planExpenseEdit([{ id: "EX-a", house: "house-23" }, { id: "EX-a-1", house: "house-22" }], edit, HOUSES),
        "Those rows are not one expense"
    )
})

test("an amount too small to split is refused; nothing found is refused", () => {
    const rows = [
        { id: "EX-a-1", house: "house-23" },
        { id: "EX-a-2", house: "house-22" },
    ]
    assert.equal(planExpenseEdit(rows, { ...edit, amountRwf: 1 }, HOUSES), "The amount is too small to split between the houses")
    assert.equal(planExpenseEdit([], edit, HOUSES), "Expense not found")
})

// --------------------------------------------- PATCH /api/expenses (real database)

const dbTest = (name, fn) => test(name, { skip: !TEST_DB && "set TEST_DATABASE_URL to run" }, fn)

let pgClient
async function sql(text, params) {
    if (!pgClient) {
        const { Client } = require("pg")
        pgClient = new Client({ connectionString: TEST_DB })
        await pgClient.connect()
    }
    return (await pgClient.query(text, params)).rows
}
const rows = () => sql(`SELECT id, house, category, amount_rwf, to_char(date, 'YYYY-MM-DD') AS date, note FROM expenses ORDER BY id`)

after(async () => {
    await pgClient?.end()
    await globalThis.pgPool?.end()
})

async function call(method, body, { auth = true, query = "" } = {}) {
    const { NextRequest } = require("next/server")
    const route = require("../app/api/expenses/route.ts")
    const headers = { "content-type": "application/json" }
    if (auth) headers.cookie = await require("./helpers/admin-cookie.cjs").adminCookie()
    const request = new NextRequest(`http://localhost/api/expenses${query}`, {
        method,
        headers,
        body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
    })
    const response = await route[method](request)
    return { status: response.status, json: await response.json() }
}

async function seed() {
    await sql(`DELETE FROM expenses`)
    await sql(`INSERT INTO expenses (id, house, category, amount_rwf, date, note) VALUES
        ('EX-s-1', 'house-23', 'Other', 175000, '2026-11-08', 'Home stipend'),
        ('EX-s-2', 'house-22', 'Other', 175000, '2026-11-08', 'Home stipend'),
        ('EX-one', 'house-22', 'Cleaning', 45000, '2026-11-03', ''),
        ('EX-t-1', 'house-23', 'Rent', 400000, '2026-11-01', ''),
        ('EX-t-2', 'house-22', 'Rent', 400000, '2026-11-01', '')`)
}
const untouched = [
    { id: "EX-t-1", house: "house-23", category: "Rent", amount_rwf: 400000, date: "2026-11-01", note: "" },
    { id: "EX-t-2", house: "house-22", category: "Rent", amount_rwf: 400000, date: "2026-11-01", note: "" },
]

dbTest("moving, renaming and re-pricing a split line changes both halves and nothing else", async () => {
    await seed()
    const { status, json } = await call("PATCH", {
        ids: ["EX-s-1", "EX-s-2"],
        category: "Repairs",
        note: "  Washing machine repairs  ",
        amountRwf: 70001,
        date: "2026-11-09",
    })
    assert.equal(status, 200)
    assert.equal(json.expenses.length, 2)
    assert.deepEqual(await rows(), [
        { id: "EX-one", house: "house-22", category: "Cleaning", amount_rwf: 45000, date: "2026-11-03", note: "" },
        { id: "EX-s-1", house: "house-23", category: "Repairs", amount_rwf: 35001, date: "2026-11-09", note: "Washing machine repairs" },
        { id: "EX-s-2", house: "house-22", category: "Repairs", amount_rwf: 35000, date: "2026-11-09", note: "Washing machine repairs" },
        ...untouched,
    ])
})

dbTest("a one-house line changes alone and keeps its house", async () => {
    await seed()
    const { status } = await call("PATCH", { ids: ["EX-one"], category: "Supplies", note: "Soap", amountRwf: 12000, date: "2026-11-03" })
    assert.equal(status, 200)
    const one = (await rows()).find((r) => r.id === "EX-one")
    assert.deepEqual(one, { id: "EX-one", house: "house-22", category: "Supplies", amount_rwf: 12000, date: "2026-11-03", note: "Soap" })
})

dbTest("sending the same edit twice leaves the same rows (idempotent)", async () => {
    await seed()
    const body = { ids: ["EX-s-2", "EX-s-1"], category: "Repairs", note: "Washer", amountRwf: 70000, date: "2026-11-08" }
    assert.equal((await call("PATCH", body)).status, 200)
    const once = await rows()
    assert.equal((await call("PATCH", body)).status, 200)
    assert.deepEqual(await rows(), once)
})

dbTest("one missing id: 404 and nothing is written; the retry with the right ids works", async () => {
    await seed()
    const before = await rows()
    const failed = await call("PATCH", { ids: ["EX-s-1", "EX-gone"], category: "Repairs", note: "x", amountRwf: 1000, date: "2026-11-08" })
    assert.equal(failed.status, 404)
    assert.deepEqual(await rows(), before)
    const retry = await call("PATCH", { ids: ["EX-s-1", "EX-s-2"], category: "Repairs", note: "x", amountRwf: 1000, date: "2026-11-08" })
    assert.equal(retry.status, 200)
    assert.deepEqual((await rows()).filter((r) => r.id.startsWith("EX-s")).map((r) => r.amount_rwf), [500, 500])
})

dbTest("rows of two different expenses: 400 and nothing is written", async () => {
    await seed()
    const before = await rows()
    const { status, json } = await call("PATCH", { ids: ["EX-s-1", "EX-t-2"], category: "Repairs", note: "", amountRwf: 1000, date: "2026-11-08" })
    assert.equal(status, 400)
    assert.equal(json.error, "Those rows are not one expense")
    assert.deepEqual(await rows(), before)
})

dbTest("bad input is refused before the database is touched", async () => {
    await seed()
    const before = await rows()
    const good = { ids: ["EX-one"], category: "Supplies", note: "", amountRwf: 1000, date: "2026-11-03" }
    for (const bad of [
        { ...good, ids: [] },
        { ...good, ids: "EX-one" },
        { ...good, ids: ["EX-one", "EX-one"] },
        { ...good, ids: Array.from({ length: 11 }, (_, i) => `EX-${i}`) },
        { ...good, category: "Holidays" },
        { ...good, amountRwf: 0 },
        { ...good, amountRwf: -5 },
        { ...good, amountRwf: "abc" },
        { ...good, date: "2026-02-30" },
        { ...good, date: "08/11/2026" },
    ]) {
        assert.equal((await call("PATCH", bad)).status, 400, JSON.stringify(bad))
    }
    assert.equal((await call("PATCH", "{not json")).status, 400)
    assert.deepEqual(await rows(), before)
})

dbTest("without the admin session: 401 and nothing is written", async () => {
    await seed()
    const before = await rows()
    const { status } = await call("PATCH", { ids: ["EX-one"], category: "Supplies", note: "", amountRwf: 1000, date: "2026-11-03" }, { auth: false })
    assert.equal(status, 401)
    assert.deepEqual(await rows(), before)
})

dbTest("a note longer than 200 characters is cut, as when adding", async () => {
    await seed()
    await call("PATCH", { ids: ["EX-one"], category: "Cleaning", note: "x".repeat(250), amountRwf: 45000, date: "2026-11-03" })
    assert.equal((await rows()).find((r) => r.id === "EX-one").note.length, 200)
})

// Controls: adding and deleting behave as before the edit route existed
dbTest("control: adding a shared expense still saves one row per house", async () => {
    await sql(`DELETE FROM expenses`)
    const { status, json } = await call("POST", { house: "all", category: "Water", amountRwf: 17501, date: "2026-11-02", note: "" })
    assert.equal(status, 201)
    assert.deepEqual(json.expenses.map((e) => [e.house, e.amountRwf]), [["house-23", 8751], ["house-22", 8750]])
})

dbTest("control: deleting still removes only the row asked for", async () => {
    await seed()
    assert.equal((await call("DELETE", undefined, { query: "?id=EX-one" })).status, 200)
    assert.deepEqual((await rows()).map((r) => r.id), ["EX-s-1", "EX-s-2", "EX-t-1", "EX-t-2"])
    assert.equal((await call("DELETE", undefined, { query: "?id=EX-one" })).status, 404)
})

dbTest("an edited split line still reads back as one line on the page", async () => {
    await seed()
    await call("PATCH", { ids: ["EX-s-1", "EX-s-2"], category: "Repairs", note: "Washer", amountRwf: 70000, date: "2026-11-08" })
    const { monthLines } = require("../lib/expense-report.ts")
    const list = await call("GET")
    const line = monthLines(list.json.expenses, "2026-11").find((l) => l.key === "EX-s")
    assert.deepEqual(
        { house: line.house, category: line.category, note: line.note, amountRwf: line.amountRwf, ids: [...line.ids].sort() },
        { house: "all", category: "Repairs", note: "Washer", amountRwf: 70000, ids: ["EX-s-1", "EX-s-2"] }
    )
})
