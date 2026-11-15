// lib/date-ranges.ts: the admin calendar lists blocked dates as runs of
// consecutive days. Every blocked day must land in exactly one run.
require("./helpers/ts-loader.cjs")
const { test } = require("node:test")
const assert = require("node:assert/strict")
const { groupDateRanges } = require("../lib/date-ranges.ts")

test("nothing blocked: no runs", () => {
    assert.deepEqual(groupDateRanges([]), [])
    assert.deepEqual(groupDateRanges(new Set()), [])
})

test("a single day is a run of one", () => {
    assert.deepEqual(groupDateRanges(["2026-11-13"]), [{ start: "2026-11-13", end: "2026-11-13", days: 1 }])
})

test("consecutive days join, a gap starts a new run", () => {
    const runs = groupDateRanges(["2026-11-13", "2026-11-14", "2026-11-15", "2026-11-17", "2026-11-18", "2026-11-29"])
    assert.deepEqual(runs, [
        { start: "2026-11-13", end: "2026-11-15", days: 3 },
        { start: "2026-11-17", end: "2026-11-18", days: 2 },
        { start: "2026-11-29", end: "2026-11-29", days: 1 },
    ])
})

test("order of the input does not matter and duplicates count once", () => {
    const runs = groupDateRanges(["2026-11-15", "2026-11-13", "2026-11-14", "2026-11-14"])
    assert.deepEqual(runs, [{ start: "2026-11-13", end: "2026-11-15", days: 3 }])
})

test("runs continue across a month end, a year end and a leap day", () => {
    assert.deepEqual(groupDateRanges(["2026-11-30", "2026-12-01"]), [{ start: "2026-11-30", end: "2026-12-01", days: 2 }])
    assert.deepEqual(groupDateRanges(["2026-12-31", "2027-01-01"]), [{ start: "2026-12-31", end: "2027-01-01", days: 2 }])
    assert.deepEqual(groupDateRanges(["2028-02-28", "2028-02-29", "2028-03-01"]), [
        { start: "2028-02-28", end: "2028-03-01", days: 3 },
    ])
    // 2026 is not a leap year: Feb 28 and Mar 1 are neighbours
    assert.deepEqual(groupDateRanges(["2026-02-28", "2026-03-01"]), [{ start: "2026-02-28", end: "2026-03-01", days: 2 }])
})

test("accepts a Set, as the calendar page holds its blocked dates", () => {
    assert.deepEqual(groupDateRanges(new Set(["2026-11-02", "2026-11-01"])), [
        { start: "2026-11-01", end: "2026-11-02", days: 2 },
    ])
})

test("anything that is not a yyyy-MM-dd day is ignored", () => {
    assert.deepEqual(groupDateRanges(["", "not-a-date", "2026-13-45", "2026-11-13"]), [
        { start: "2026-11-13", end: "2026-11-13", days: 1 },
    ])
})

test("no day is lost or counted twice", () => {
    const input = ["2026-10-30", "2026-10-31", "2026-11-01", "2026-11-05", "2026-11-07", "2026-11-08", "2027-01-01"]
    const runs = groupDateRanges(input)
    assert.equal(runs.reduce((sum, r) => sum + r.days, 0), input.length)
    for (const day of input) {
        assert.equal(runs.filter((r) => r.start <= day && day <= r.end).length, 1, `${day} is in exactly one run`)
    }
})

// ---------------------------------------------- upcomingBlockedRuns, nightsOf
const { upcomingBlockedRuns, nightsOf } = require("../lib/date-ranges.ts")
const TODAY = "2026-11-15"

test("past runs are left out; a run that ends today is kept", () => {
    const runs = upcomingBlockedRuns(["2026-07-01", "2026-07-02", "2026-11-14", "2026-11-15"], TODAY)
    assert.deepEqual(runs, [{ start: "2026-11-15", end: "2026-11-15", days: 1, owner: null, startedOn: "2026-11-14" }])
})

test("a run under way is shown from today and remembers where it began", () => {
    const nov = Array.from({ length: 13 }, (_, i) => `2026-11-${String(4 + i).padStart(2, "0")}`) // 4..16
    const runs = upcomingBlockedRuns([...nov, "2026-11-29"], TODAY)
    assert.deepEqual(runs, [
        { start: "2026-11-15", end: "2026-11-16", days: 2, owner: null, startedOn: "2026-11-04" },
        { start: "2026-11-29", end: "2026-11-29", days: 1, owner: null, startedOn: null },
    ])
})

test("back-to-back nights held by different owners are separate runs", () => {
    const owner = (d) => (d <= "2026-11-21" ? "BK-1" : d <= "2026-11-23" ? null : "BK-2")
    const runs = upcomingBlockedRuns(["2026-11-20", "2026-11-21", "2026-11-22", "2026-11-23", "2026-11-24"], TODAY, owner)
    assert.deepEqual(runs.map((r) => [r.start, r.end, r.owner]), [
        ["2026-11-20", "2026-11-21", "BK-1"],
        ["2026-11-22", "2026-11-23", null],
        ["2026-11-24", "2026-11-24", "BK-2"],
    ])
})

test("runs cross a year end; nothing blocked gives no runs", () => {
    assert.deepEqual(upcomingBlockedRuns(["2026-12-31", "2027-01-01"], TODAY).map((r) => [r.start, r.end, r.days]), [["2026-12-31", "2027-01-01", 2]])
    assert.deepEqual(upcomingBlockedRuns([], TODAY), [])
})

test("nightsOf lists every night of a run, across a month end", () => {
    assert.deepEqual(nightsOf({ start: "2026-11-29", end: "2026-12-02" }), ["2026-11-29", "2026-11-30", "2026-12-01", "2026-12-02"])
    assert.deepEqual(nightsOf({ start: "2026-11-29", end: "2026-11-29" }), ["2026-11-29"])
})
