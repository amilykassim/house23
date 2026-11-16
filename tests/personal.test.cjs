// Personal money (lib/personal.ts, /api/personal-expenses): what we took
// from the business for ourselves, kept apart from business expenses.
//
// The route tests need a Postgres with db/schema.sql loaded:
//   TEST_DATABASE_URL=postgresql://user@localhost:5432/casa_test npm test
// They are skipped without it, and refuse any host but localhost.
const TEST_DB = process.env.TEST_DATABASE_URL
if (TEST_DB && !/^postgres(ql)?:\/\/[^@/]*@?(localhost|127\.0\.0\.1)[:/]/.test(TEST_DB)) {
    throw new Error("TEST_DATABASE_URL must point at localhost")
}
// Test files run in parallel against one database, so this one works in its
// own schema and never touches the tables other test files are using
const SCHEMA = "personal_test"
const DB_URL = TEST_DB && `${TEST_DB}${TEST_DB.includes("?") ? "&" : "?"}options=-c%20search_path%3D${SCHEMA}`
process.env.DATABASE_URL = DB_URL || "postgresql://no-database-for-tests@localhost:1/none"
require("./helpers/ts-loader.cjs")
const { test, before, after } = require("node:test")
const assert = require("node:assert/strict")
const { format } = require("date-fns")
const { stipendForPeriod, periodFor, MONTHLY_STIPEND_RWF } = require("../lib/earnings.ts")
const { stipendForMonth, personalForPeriod, readPersonalExpense, readStipendChange } = require("../lib/personal.ts")

const d = (s) => new Date(`${s}T00:00:00`)
const ymd = (date) => format(date, "yyyy-MM-dd")

// ------------------------------------------------------------- pure helpers

test("a month takes the standard stipend unless it was changed; 0 means none", () => {
    const changed = [
        { month: "2026-10", amountRwf: 200_000 },
        { month: "2026-09", amountRwf: 0 },
    ]
    assert.equal(stipendForMonth("2026-11", changed), MONTHLY_STIPEND_RWF)
    assert.equal(stipendForMonth("2026-10", changed), 200_000)
    assert.equal(stipendForMonth("2026-09", changed), 0)
    assert.equal(stipendForMonth("2026-11", []), 350_000)
})

test("with nothing recorded, personal money is exactly the stipend Insights counted before", () => {
    // Every period kind Insights offers: the 'after' figure must not move
    const periods = [
        periodFor("month", d("2026-11-15")),
        periodFor("month", d("2026-02-10")),
        periodFor("week", d("2026-09-30")), // crosses a month end
        periodFor("year", d("2026-06-01")),
        { start: d("2026-11-01"), end: d("2026-11-15") },
        { start: d("2026-12-31"), end: d("2026-12-31") },
    ]
    for (const p of periods) {
        const result = personalForPeriod(ymd(p.start), ymd(p.end), [], [])
        assert.equal(result.total, stipendForPeriod(p.start, p.end), `${ymd(p.start)}..${ymd(p.end)}`)
        assert.equal(result.entries, 0)
        assert.equal(result.count, 0)
    }
})

test("personal expenses dated in the period are added, both ends included; others are not", () => {
    const entries = [
        { amountRwf: 40_000, date: "2026-11-15" },
        { amountRwf: 25_000, date: "2026-11-01" },
        { amountRwf: 10_000, date: "2026-11-30" },
        { amountRwf: 99_000, date: "2026-10-31" },
        { amountRwf: 99_000, date: "2026-12-01" },
    ]
    assert.deepEqual(personalForPeriod("2026-11-01", "2026-11-30", entries, []), {
        stipend: 350_000,
        entries: 75_000,
        count: 3,
        total: 425_000,
    })
})

test("a changed month is used, and part of it counts for its share of the days", () => {
    const changed = [{ month: "2026-11", amountRwf: 300_000 }]
    assert.equal(personalForPeriod("2026-11-01", "2026-11-30", [], changed).stipend, 300_000)
    assert.equal(personalForPeriod("2026-11-01", "2026-11-15", [], changed).stipend, 150_000)
    // A year with one month changed: eleven standard months plus 300k
    assert.equal(personalForPeriod("2026-01-01", "2026-12-31", [], changed).stipend, 11 * 350_000 + 300_000)
    // None taken that month
    assert.equal(personalForPeriod("2026-11-01", "2026-11-30", [], [{ month: "2026-11", amountRwf: 0 }]).total, 0)
})

test("an end before the start is nothing", () => {
    assert.deepEqual(personalForPeriod("2026-11-10", "2026-11-01", [{ amountRwf: 5, date: "2026-11-05" }], []), {
        stipend: 0,
        entries: 0,
        count: 0,
        total: 0,
    })
})

test("stipendForPeriod still takes one amount for every month", () => {
    assert.equal(stipendForPeriod(d("2026-11-01"), d("2026-11-30"), 100_000), 100_000)
    assert.equal(stipendForPeriod(d("2026-11-01"), d("2026-11-30"), (m) => (m === "2026-11" ? 7 : 0)), 7)
})

test("a personal expense needs a positive amount and a real date; the note is trimmed and capped", () => {
    assert.deepEqual(readPersonalExpense({ amountRwf: "40000.4", date: "2026-11-15", note: "  Groceries  " }), {
        amountRwf: 40_000,
        date: "2026-11-15",
        note: "Groceries",
    })
    assert.equal(readPersonalExpense({ amountRwf: 1, date: "2026-11-15" }).note, "")
    assert.equal(readPersonalExpense({ amountRwf: 1, date: "2026-11-15", note: "x".repeat(300) }).note.length, 200)
    for (const bad of [
        { amountRwf: 0, date: "2026-11-15" },
        { amountRwf: -5, date: "2026-11-15" },
        { amountRwf: "abc", date: "2026-11-15" },
        { amountRwf: 3e9, date: "2026-11-15" },
        { amountRwf: 100, date: "2026-13-01" },
        { amountRwf: 100, date: "15/11/2026" },
        { amountRwf: 100 },
        null,
        undefined,
    ]) {
        assert.equal(typeof readPersonalExpense(bad), "string", JSON.stringify(bad))
    }
})

test("a stipend change takes a month and 0 or more RWF, or null to go back to the standard", () => {
    assert.deepEqual(readStipendChange({ month: "2026-11", amountRwf: 200000 }), { month: "2026-11", amountRwf: 200_000 })
    assert.deepEqual(readStipendChange({ month: "2026-11", amountRwf: 0 }), { month: "2026-11", amountRwf: 0 })
    assert.deepEqual(readStipendChange({ month: "2026-11", amountRwf: null }), { month: "2026-11", amountRwf: null })
    for (const bad of [
        { month: "2026-13", amountRwf: 1 },
        { month: "2026-1", amountRwf: 1 },
        { amountRwf: 1 },
        { month: "2026-11", amountRwf: -1 },
        { month: "2026-11", amountRwf: "" },
        { month: "2026-11", amountRwf: "abc" },
        { month: "2026-11" },
        null,
    ]) {
        assert.equal(typeof readStipendChange(bad), "string", JSON.stringify(bad))
    }
})

// ------------------------------------------ /api/personal-expenses (real database)

const dbTest = (name, fn) => test(name, { skip: !TEST_DB && "set TEST_DATABASE_URL to run" }, fn)

let pgClient
async function sql(text, params) {
    if (!pgClient) {
        const { Client } = require("pg")
        pgClient = new Client({ connectionString: DB_URL })
        await pgClient.connect()
    }
    return (await pgClient.query(text, params)).rows
}

// A fresh copy of every table, from db/schema.sql, in this file's schema
before(async () => {
    if (!TEST_DB) return
    const schema = require("fs").readFileSync(require("path").join(__dirname, "..", "db", "schema.sql"), "utf-8")
    await sql(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`)
    await sql(`CREATE SCHEMA ${SCHEMA}`)
    await sql(schema)
})
const personalRows = () => sql(`SELECT amount_rwf, to_char(date, 'YYYY-MM-DD') AS date, note FROM personal_expenses ORDER BY date, note`)
const stipendRows = () => sql(`SELECT month, amount_rwf FROM stipend_months ORDER BY month`)
const businessRows = () => sql(`SELECT id, house, category, amount_rwf, to_char(date, 'YYYY-MM-DD') AS date, note FROM expenses ORDER BY id`)

after(async () => {
    if (TEST_DB) await sql(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`)
    await pgClient?.end()
    await globalThis.pgPool?.end()
})

async function call(route, method, body, { auth = true, query = "" } = {}) {
    const { NextRequest } = require("next/server")
    const handlers = require(`../app/api/${route}/route.ts`)
    const headers = { "content-type": "application/json" }
    if (auth) headers.cookie = await require("./helpers/admin-cookie.cjs").adminCookie()
    const request = new NextRequest(`http://localhost/api/${route}${query}`, {
        method,
        headers,
        body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
    })
    const response = await handlers[method](request)
    return { status: response.status, json: await response.json() }
}
const personalCall = (method, body, opts) => call("personal-expenses", method, body, opts)

async function seed() {
    await sql(`DELETE FROM personal_expenses`)
    await sql(`DELETE FROM stipend_months`)
    await sql(`DELETE FROM expenses`)
    await sql(`INSERT INTO expenses (id, house, category, amount_rwf, date, note) VALUES
        ('EX-t-1', 'house-23', 'Rent', 400000, '2026-11-01', ''),
        ('EX-t-2', 'house-22', 'Rent', 400000, '2026-11-01', ''),
        ('EX-one', 'house-22', 'Cleaning', 45000, '2026-11-03', '')`)
}

dbTest("every method needs the admin session, and nothing is written without it", async () => {
    await seed()
    for (const [method, body, query] of [
        ["GET", undefined, ""],
        ["POST", { amountRwf: 1000, date: "2026-11-15" }, ""],
        ["PUT", { month: "2026-11", amountRwf: 0 }, ""],
        ["DELETE", undefined, "?id=PE-x"],
    ]) {
        const { status } = await personalCall(method, body, { auth: false, query })
        assert.equal(status, 401, method)
    }
    assert.deepEqual(await personalRows(), [])
    assert.deepEqual(await stipendRows(), [])
})

dbTest("a personal expense is recorded, listed newest first, and deleted; a second delete is 404", async () => {
    await seed()
    const first = await personalCall("POST", { amountRwf: 25000, date: "2026-11-09", note: "Fuel" })
    assert.equal(first.status, 201)
    assert.match(first.json.expense.id, /^PE-/)
    const second = await personalCall("POST", { amountRwf: 40000, date: "2026-11-15", note: " Groceries " })
    assert.equal(second.status, 201)

    const list = await personalCall("GET")
    assert.equal(list.status, 200)
    assert.deepEqual(
        list.json.expenses.map((e) => [e.note, e.amountRwf, e.date]),
        [
            ["Groceries", 40000, "2026-11-15"],
            ["Fuel", 25000, "2026-11-09"],
        ]
    )
    assert.deepEqual(list.json.stipends, [])
    assert.equal(list.json.monthlyStipend, 350000)

    const gone = await personalCall("DELETE", undefined, { query: `?id=${first.json.expense.id}` })
    assert.equal(gone.status, 200)
    const again = await personalCall("DELETE", undefined, { query: `?id=${first.json.expense.id}` })
    assert.equal(again.status, 404)
    assert.deepEqual(await personalRows(), [{ amount_rwf: 40000, date: "2026-11-15", note: "Groceries" }])
    assert.equal((await personalCall("DELETE", undefined, { query: "" })).status, 400)
})

dbTest("an invalid personal expense or a body that is not JSON is refused and writes nothing", async () => {
    await seed()
    assert.equal((await personalCall("POST", { amountRwf: 0, date: "2026-11-15" })).status, 400)
    assert.equal((await personalCall("POST", { amountRwf: 100, date: "nope" })).status, 400)
    assert.equal((await personalCall("POST", "{not json")).status, 400)
    assert.equal((await personalCall("PUT", "{not json")).status, 400)
    assert.equal((await personalCall("PUT", { month: "2026-11", amountRwf: -1 })).status, 400)
    assert.deepEqual(await personalRows(), [])
    assert.deepEqual(await stipendRows(), [])
})

dbTest("changing a month's stipend twice keeps one row; null goes back to the standard, and is safe to repeat", async () => {
    await seed()
    let res = await personalCall("PUT", { month: "2026-11", amountRwf: 200000 })
    assert.equal(res.status, 200)
    res = await personalCall("PUT", { month: "2026-11", amountRwf: 200000 })
    assert.equal(res.status, 200)
    assert.deepEqual(await stipendRows(), [{ month: "2026-11", amount_rwf: 200000 }])

    res = await personalCall("PUT", { month: "2026-11", amountRwf: 0 })
    assert.deepEqual(res.json.stipends, [{ month: "2026-11", amountRwf: 0 }])

    await personalCall("PUT", { month: "2026-10", amountRwf: 300000 })
    res = await personalCall("PUT", { month: "2026-11", amountRwf: null })
    assert.deepEqual(res.json.stipends, [{ month: "2026-10", amountRwf: 300000 }])
    res = await personalCall("PUT", { month: "2026-11", amountRwf: null })
    assert.equal(res.status, 200)
    assert.deepEqual(await stipendRows(), [{ month: "2026-10", amount_rwf: 300000 }])
})

dbTest("the database refuses a bad month or amount even if the route were bypassed", async () => {
    await seed()
    await assert.rejects(sql(`INSERT INTO stipend_months (month, amount_rwf) VALUES ('2026-13', 1)`))
    await assert.rejects(sql(`INSERT INTO stipend_months (month, amount_rwf) VALUES ('2026-11', -1)`))
    await assert.rejects(sql(`INSERT INTO personal_expenses (id, amount_rwf, date) VALUES ('PE-z', 0, '2026-11-01')`))
})

dbTest("personal money never reaches business expenses, their API, or the totals Pennywise reads", async () => {
    await seed()
    const before = await businessRows()
    const { sumExpenses } = require("../lib/store.ts")
    const sumBefore = await sumExpenses("2026-11-01", "2026-12-01")
    const listBefore = (await call("expenses", "GET")).json.expenses.map((e) => e.id)

    await personalCall("POST", { amountRwf: 40000, date: "2026-11-15", note: "Groceries" })
    await personalCall("PUT", { month: "2026-11", amountRwf: 300000 })

    assert.deepEqual(await businessRows(), before)
    assert.equal(await sumExpenses("2026-11-01", "2026-12-01"), sumBefore)
    assert.equal(sumBefore, 845000)
    assert.deepEqual((await call("expenses", "GET")).json.expenses.map((e) => e.id), listBefore)
})
