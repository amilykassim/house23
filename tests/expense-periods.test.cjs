// lib/expense-report.ts: the Expenses page reports a week, a month or a year,
// cut as on the Insights page (weeks run Monday to Sunday).
require("./helpers/ts-loader.cjs")
const { test } = require("node:test")
const assert = require("node:assert/strict")
const report = require("../lib/expense-report.ts")
const { houses } = require("../lib/houses.ts")

const [h1, h2] = houses.map((h) => h.slug)
let n = 0
const expense = (date, amountRwf, house = h1, category = "Repairs", extra = {}) => ({
    id: `EX-t${++n}x`, house, category, amountRwf, date, note: "", createdAt: "2026-01-01", ...extra,
})
// One expense split between both houses: one row per house, ids EX-x-1, EX-x-2
const split = (id, date, each, category = "Rent") =>
    houses.map((h, i) => ({ id: `${id}-${i + 1}`, house: h.slug, category, amountRwf: each, date, note: "shared", createdAt: "2026-01-01" }))
const booking = (house, checkIn, checkOut, totalRwf) => ({
    id: `B-${++n}`, house, checkIn, checkOut, total: 0, totalRwf, status: "confirmed", createdAt: "2026-01-01",
})

// ---- Control: the month view, as before (passes on the code before the change too)

test("control: a month counts every expense dated in it, edges included", () => {
    const list = [expense("2026-10-31", 5), expense("2026-11-01", 100), expense("2026-11-30", 200), expense("2026-12-01", 7)]
    const r = report.expenseReport(list, [], "2026-11", "all")
    assert.equal(r.month, "2026-11")
    assert.equal(r.total, 300)
    assert.equal(r.previousTotal, 5)
    assert.deepEqual(r.months.map((m) => m.key), ["2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11"])
    assert.deepEqual(r.months.map((m) => m.label), ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"])
    assert.deepEqual(r.months.map((m) => m.total), [0, 0, 0, 0, 5, 300])
})

test("control: a split expense is one line again, and a house counts its share", () => {
    const list = split("EX-s", "2026-11-03", 400_000)
    assert.equal(report.monthLines(list, "2026-11").length, 1)
    assert.equal(report.expenseReport(list, [], "2026-11", "all").total, 800_000)
    assert.equal(report.expenseReport(list, [], "2026-11", h1).total, 400_000)
})

// ---- The periods

test("a week runs Monday to Sunday; months and years are calendar ones", () => {
    // 2026-11-16 is a Monday, 2026-11-22 a Sunday
    assert.deepEqual(report.spanFor("week", "2026-11-18"), { kind: "week", start: "2026-11-16", end: "2026-11-22" })
    assert.deepEqual(report.spanFor("week", "2026-11-22"), { kind: "week", start: "2026-11-16", end: "2026-11-22" })
    assert.deepEqual(report.spanFor("month", "2026-02-10"), { kind: "month", start: "2026-02-01", end: "2026-02-28" })
    assert.deepEqual(report.spanFor("year", "2026-11-18"), { kind: "year", start: "2026-01-01", end: "2026-12-31" })
    assert.deepEqual(report.monthSpan("2026-11"), report.spanFor("month", "2026-11-01"))
})

test("stepping moves a whole period, across month and year ends", () => {
    const week = report.spanFor("week", "2026-12-30") // 28 Dec 2026 to 3 Jan 2027
    assert.deepEqual(week, { kind: "week", start: "2026-12-28", end: "2027-01-03" })
    assert.deepEqual(report.shiftSpan(week, 1), { kind: "week", start: "2027-01-04", end: "2027-01-10" })
    assert.deepEqual(report.shiftSpan(week, -1), { kind: "week", start: "2026-12-21", end: "2026-12-27" })
    assert.deepEqual(report.shiftSpan(report.monthSpan("2026-01"), -1), report.monthSpan("2025-12"))
    assert.deepEqual(report.shiftSpan(report.spanFor("year", "2026-05-05"), -1), { kind: "year", start: "2025-01-01", end: "2025-12-31" })
})

test("period names", () => {
    assert.equal(report.spanName(report.monthSpan("2026-11")), "November")
    assert.equal(report.spanName(report.spanFor("year", "2026-03-01")), "2026")
    assert.equal(report.spanName(report.spanFor("week", "2026-11-18")), "16 to 22 Nov")
    assert.equal(report.spanName(report.spanFor("week", "2026-11-30")), "30 Nov to 6 Dec")
    assert.equal(report.spanName(report.spanFor("week", "2026-12-30")), "28 Dec 2026 to 3 Jan 2027")
})

test("a week counts only its own days, and compares with the week before", () => {
    const list = [
        expense("2026-11-15", 50), // Sunday: the week before
        expense("2026-11-16", 100), // Monday
        expense("2026-11-22", 200), // Sunday
        expense("2026-11-23", 999), // next Monday
        expense("2026-11-09", 50), // the week before too
    ]
    const r = report.spanReport(list, [], report.spanFor("week", "2026-11-18"), "all")
    assert.equal(r.total, 300)
    assert.equal(r.previousTotal, 100)
    assert.deepEqual(r.change, { kind: "up", pct: 200 })
    assert.deepEqual(r.lines.map((l) => l.amountRwf), [200, 100])
    assert.deepEqual(r.months.map((m) => m.key), ["2026-10-12", "2026-10-19", "2026-10-26", "2026-11-02", "2026-11-09", "2026-11-16"])
    assert.deepEqual(r.months.map((m) => m.label), ["12 Oct", "19 Oct", "26 Oct", "2 Nov", "9 Nov", "16 Nov"])
    assert.deepEqual(r.months.map((m) => m.total), [0, 0, 0, 0, 100, 300])
    assert.deepEqual(r.months[5].span, report.spanFor("week", "2026-11-16"))
})

test("a year adds up its months, and compares with the year before", () => {
    const list = [
        expense("2025-12-31", 40),
        expense("2026-01-01", 100),
        expense("2026-06-15", 200, h2),
        ...split("EX-y", "2026-12-31", 50),
        expense("2027-01-01", 999),
    ]
    const year = report.spanFor("year", "2026-11-16")
    const r = report.spanReport(list, [], year, "all")
    assert.equal(r.total, 400)
    assert.equal(r.previousTotal, 40)
    assert.equal(r.lines.length, 3) // the split one is one line
    assert.equal(report.spanReport(list, [], year, h1).total, 150)
    assert.equal(report.spanReport(list, [], year, h2).total, 250)
    assert.deepEqual(r.months.map((m) => m.label), ["2021", "2022", "2023", "2024", "2025", "2026"])
    assert.deepEqual(r.months.map((m) => m.total), [0, 0, 0, 0, 40, 400])
    // the year's figure is the sum of its months'
    const byMonth = Array.from({ length: 12 }, (_, i) => report.expenseReport(list, [], `2026-${String(i + 1).padStart(2, "0")}`, "all").total)
    assert.equal(byMonth.reduce((a, b) => a + b, 0), r.total)
})

test("revenue and booked nights follow the period, a stay split at the week's edge", () => {
    // 4 nights, 20,22,23... check-in Sat 21 Nov, out Wed 25 Nov: 2 nights in each week
    const bookings = [booking(h1, "2026-11-21", "2026-11-25", 400_000)]
    const week = report.spanFor("week", "2026-11-18")
    const r = report.spanReport([expense("2026-11-18", 1000)], bookings, week, "all")
    assert.equal(r.nights, 2)
    assert.equal(Math.round(r.revenue), 200_000)
    const next = report.spanReport([], bookings, report.shiftSpan(week, 1), "all")
    assert.equal(next.nights, 2)
    assert.equal(Math.round(next.revenue), 200_000)
    // the month holds all of it
    const month = report.expenseReport([], bookings, "2026-11", "all")
    assert.equal(month.nights, 4)
    assert.equal(Math.round(month.revenue), 400_000)
})

test("a month span gives the same report as the month report", () => {
    const list = [expense("2026-11-02", 100), ...split("EX-m", "2026-11-03", 300), expense("2026-10-05", 80, h2, "Cleaning")]
    const bookings = [booking(h2, "2026-11-10", "2026-11-12", 100_000)]
    for (const view of ["all", h1, h2]) {
        assert.deepEqual(report.spanReport(list, bookings, report.monthSpan("2026-11"), view), report.expenseReport(list, bookings, "2026-11", view))
    }
})
