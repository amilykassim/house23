// Sending guest emails by hand: lib/manual-email.ts and /api/manual-email.
//
// The access code tests need a Postgres with db/schema.sql loaded:
//   TEST_DATABASE_URL=postgresql://user@localhost:5432/casa_test npm test
// They are skipped without it, and refuse any host but localhost so they can
// never touch the production database.
process.env.RESEND_API_KEY = "re_test"
const TEST_DB = process.env.TEST_DATABASE_URL
if (TEST_DB && !/^postgres(ql)?:\/\/[^@/]*@?(localhost|127\.0\.0\.1)[:/]/.test(TEST_DB)) {
    throw new Error("TEST_DATABASE_URL must point at localhost")
}
// The app's pool reads DATABASE_URL; never let these tests use the real one
process.env.DATABASE_URL = TEST_DB || "postgresql://no-database-for-tests@localhost:1/none"
const { fakeResend } = require("./helpers/ts-loader.cjs")
const { test, beforeEach, after } = require("node:test")
const assert = require("node:assert/strict")
const { NextRequest } = require("next/server")
const email = require("../lib/email.ts")
const { parseManualEmail, buildManualEmail } = require("../lib/manual-email.ts")
const { USD_TO_RWF } = require("../lib/currency.ts")
const { POST } = require("../app/api/manual-email/route.ts")

const form = {
    template: "confirmed",
    email: "amara@example.com",
    guestName: "Amara Nkusi",
    house: "house-23",
    checkIn: "2026-11-14",
    checkOut: "2026-11-17",
    guests: 2,
    phone: "+250 788 214 907",
    reason: "dates_unavailable",
    bookingId: "BK-014",
    totalRwf: "210000",
}

beforeEach(() => {
    process.env.RESEND_API_KEY = "re_test"
    fakeResend.reset()
})

function errorOf(body, opts) {
    const r = parseManualEmail(body, opts)
    assert.equal(r.ok, false, `expected a validation error for ${JSON.stringify(body)}`)
    return r.error
}

// ---------------------------------------------------------------- parsing

test("a confirmed email turns into the booking data the templates use", () => {
    const r = parseManualEmail(form)
    assert.equal(r.ok, true)
    assert.equal(r.template, "confirmed")
    assert.deepEqual(r.data, {
        guestName: "Amara Nkusi",
        guestEmail: "amara@example.com",
        guestPhone: "+250 788 214 907",
        houseName: "House 23",
        checkIn: "2026-11-14",
        checkOut: "2026-11-17",
        nights: 3,
        guests: 2,
        // Same RWF → USD rule as Add booking (app/api/bookings/route.ts)
        total: Math.round((210000 / USD_TO_RWF) * 100) / 100,
        totalRwf: 210000,
        momoTransactionId: "",
        bookingId: "BK-014",
        rejectionReason: undefined,
    })
})

test("house 22 resolves to its own name", () => {
    assert.equal(parseManualEmail({ ...form, house: "house-22" }).data.houseName, "House 22")
})

test("nights count across a month end", () => {
    assert.equal(parseManualEmail({ ...form, checkIn: "2026-11-29", checkOut: "2026-12-02" }).data.nights, 3)
})

test("the not-confirmed email needs a reason but no total, and drops the phone", () => {
    const r = parseManualEmail({ ...form, template: "declined", totalRwf: "", reason: "maintenance" })
    assert.equal(r.ok, true)
    assert.equal(r.data.rejectionReason, "maintenance")
    assert.equal(r.data.totalRwf, 0)
    assert.equal(r.data.guestPhone, undefined)
})

test("the request email drops the phone and keeps the total", () => {
    const r = parseManualEmail({ ...form, template: "request" })
    assert.equal(r.data.guestPhone, undefined)
    assert.equal(r.data.totalRwf, 210000)
    assert.equal(r.data.rejectionReason, undefined)
})

test("fields are trimmed and RWF is rounded", () => {
    const r = parseManualEmail({ ...form, email: "  a@b.co ", guestName: "  Amara ", bookingId: " BK-1 ", totalRwf: "1000.6" })
    assert.equal(r.data.guestEmail, "a@b.co")
    assert.equal(r.data.guestName, "Amara")
    assert.equal(r.data.bookingId, "BK-1")
    assert.equal(r.data.totalRwf, 1001)
})

test("the preview may run before the guest email is typed; sending may not", () => {
    assert.equal(parseManualEmail({ ...form, email: "" }, { requireRecipient: false }).ok, true)
    assert.equal(errorOf({ ...form, email: "" }), "Enter a valid guest email")
})

test("invalid input is refused with a message for the admin", () => {
    assert.match(errorOf({ ...form, template: "welcome" }), /Choose which email/)
    assert.match(errorOf({ ...form, email: "not-an-email" }), /valid guest email/)
    assert.match(errorOf({ ...form, guestName: "   " }), /guest's name/)
    assert.match(errorOf({ ...form, guestName: "x".repeat(101) }), /too long/)
    assert.match(errorOf({ ...form, house: "house-99" }), /Choose a house/)
    assert.match(errorOf({ ...form, checkIn: null }), /check-in date/)
    assert.match(errorOf({ ...form, checkIn: "2026-02-30" }), /check-in date/)
    assert.match(errorOf({ ...form, checkOut: "14/11/2026" }), /check-out date/)
    assert.match(errorOf({ ...form, checkOut: "2026-11-14" }), /after check-in/)
    assert.match(errorOf({ ...form, checkOut: "2026-11-10" }), /after check-in/)
    assert.match(errorOf({ ...form, checkOut: "2027-11-20" }), /longer than 365/)
    assert.match(errorOf({ ...form, guests: 0 }), /between 1 and 3/)
    assert.match(errorOf({ ...form, guests: 4 }), /between 1 and 3 for House 23/)
    assert.match(errorOf({ ...form, guests: 1.5 }), /between 1 and/)
    assert.match(errorOf({ ...form, bookingId: "" }), /booking reference/)
    assert.match(errorOf({ ...form, bookingId: "<img src=x>" }), /booking reference/)
    assert.match(errorOf({ ...form, totalRwf: "" }), /total in RWF/)
    assert.match(errorOf({ ...form, totalRwf: "-5" }), /total in RWF/)
    assert.match(errorOf({ ...form, totalRwf: "abc" }), /total in RWF/)
    assert.match(errorOf({ ...form, template: "request", totalRwf: undefined }), /total in RWF/)
    assert.match(errorOf({ ...form, template: "declined", reason: "bogus" }), /Choose a reason/)
    assert.match(errorOf({ ...form, template: "declined", reason: "toString" }), /Choose a reason/)
    assert.match(errorOf({ ...form, phone: "1".repeat(41) }), /phone number is too long/)
    assert.match(errorOf(null), /Choose which email/)
})

// ---------------------------------------------------------------- building

test("each choice is built by the same template as the automatic email", () => {
    for (const [template, builder] of [
        ["request", "buildBookingAcknowledgmentEmail"],
        ["confirmed", "buildBookingConfirmationEmail"],
        ["declined", "buildBookingCancellationEmail"],
    ]) {
        const { data } = parseManualEmail({ ...form, template })
        assert.deepEqual(buildManualEmail(template, data), email[builder](data), template)
    }
})

test("the automatic sends use those same builders", async () => {
    const { data } = parseManualEmail({ ...form, reason: "maintenance", template: "declined" })
    for (const [send, builder] of [
        ["sendBookingAcknowledgment", "buildBookingAcknowledgmentEmail"],
        ["sendBookingConfirmation", "buildBookingConfirmationEmail"],
        ["sendBookingCancellation", "buildBookingCancellationEmail"],
    ]) {
        fakeResend.reset()
        await email[send](data)
        const { subject, html } = email[builder](data)
        assert.deepEqual(fakeResend.sent, [{ from: email.FROM_EMAIL, to: data.guestEmail, subject, html }], send)
    }
})

test("a typed guest name can't inject HTML", () => {
    const { data } = parseManualEmail({ ...form, guestName: "<img src=x onerror=alert(1)>" })
    const { html } = buildManualEmail("confirmed", data)
    assert.doesNotMatch(html, /<img src=x/)
    assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/)
})

// ---------------------------------------------------------------- route

// Sends that don't involve an access code use the request email
const requestForm = { ...form, template: "request" }

function request(body, { cookie = "admin_auth=authenticated", raw } = {}) {
    return new NextRequest("http://localhost/api/manual-email", {
        method: "POST",
        headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
        body: raw ?? JSON.stringify(body),
    })
}

async function call(body, opts) {
    const res = await POST(request(body, opts))
    return { status: res.status, json: await res.json() }
}

test("the route refuses anyone who isn't signed in to the admin", async () => {
    assert.equal((await call({ ...requestForm, action: "send" }, { cookie: null })).status, 401)
    assert.equal((await call({ ...requestForm, action: "send" }, { cookie: "admin_auth=yes" })).status, 401)
    assert.equal(fakeResend.attempts.length, 0)
})

test("bad requests get a 400 and send nothing", async () => {
    assert.equal((await call(null, { raw: "{not json" })).status, 400)
    assert.deepEqual(await call({ ...requestForm }), { status: 400, json: { error: "Unknown action" } })
    assert.deepEqual(await call({ ...requestForm, action: "send", guests: 9 }), {
        status: 400,
        json: { error: "Guests must be between 1 and 3 for House 23" },
    })
    assert.equal(fakeResend.attempts.length, 0)
})

test("preview returns the real email and never sends", async () => {
    const { status, json } = await call({ ...form, action: "preview" })
    assert.equal(status, 200)
    const expected = buildManualEmail("confirmed", parseManualEmail(form).data)
    assert.equal(json.subject, expected.subject)
    assert.equal(json.html, expected.html)
    assert.equal(json.from, email.FROM_EMAIL)
    assert.equal(json.to, "amara@example.com")
    assert.equal(fakeResend.attempts.length, 0)
})

test("preview works before the guest email is typed", async () => {
    const { status, json } = await call({ ...form, email: "", action: "preview" })
    assert.equal(status, 200)
    assert.equal(json.to, "")
})

test("send emails the guest once with the previewed content", async () => {
    const preview = (await call({ ...requestForm, action: "preview" })).json
    const { status, json } = await call({ ...requestForm, action: "send" })
    assert.equal(status, 200)
    assert.deepEqual(json, { success: true, id: "fake_1", to: "amara@example.com", from: email.FROM_EMAIL, subject: preview.subject })
    assert.deepEqual(fakeResend.sent, [{ from: email.FROM_EMAIL, to: "amara@example.com", subject: preview.subject, html: preview.html }])
})

test("send without RESEND_API_KEY says so and sends nothing", async () => {
    delete process.env.RESEND_API_KEY
    const { status, json } = await call({ ...requestForm, action: "send" })
    assert.equal(status, 500)
    assert.match(json.error, /RESEND_API_KEY/)
    assert.equal(fakeResend.attempts.length, 0)
})

test("a Resend rejection is reported, not swallowed", async () => {
    fakeResend.next = { error: { name: "validation_error", message: "You can only send testing emails to your own address" } }
    const { status, json } = await call({ ...requestForm, action: "send" })
    assert.equal(status, 502)
    assert.equal(json.error, "validation_error: You can only send testing emails to your own address")
    assert.equal(fakeResend.sent.length, 0)
})

test("a network failure is reported", async () => {
    fakeResend.next = { throws: "socket hang up" }
    const { status, json } = await call({ ...requestForm, action: "send" })
    assert.equal(status, 500)
    assert.equal(json.error, "socket hang up")
})

test("retrying after a failure sends exactly one email", async () => {
    fakeResend.next = { throws: "socket hang up" }
    assert.equal((await call({ ...requestForm, action: "send" })).status, 500)
    assert.equal((await call({ ...requestForm, action: "send" })).status, 200)
    assert.equal(fakeResend.attempts.length, 2)
    assert.equal(fakeResend.sent.length, 1)
})

test("each confirmed send is a new email (no de-duplication without a key)", async () => {
    await call({ ...requestForm, action: "send" })
    await call({ ...requestForm, action: "send" })
    assert.equal(fakeResend.sent.length, 2)
})

test("the page's idempotency key is passed to Resend", async () => {
    const key = "3f1c2a9e-5b7d-4e8a-9c0f-1a2b3c4d5e6f"
    assert.equal((await call({ ...requestForm, action: "send", idempotencyKey: key })).status, 200)
    assert.deepEqual(fakeResend.options, [{ idempotencyKey: key }])
})

test("without a key, Resend is called exactly as before", async () => {
    await call({ ...requestForm, action: "send" })
    assert.deepEqual(fakeResend.options, [undefined])
})

test("a malformed idempotency key is refused and nothing is sent", async () => {
    for (const idempotencyKey of ["short", 42, "has spaces in it", "x".repeat(129)]) {
        const { status, json } = await call({ ...requestForm, action: "send", idempotencyKey })
        assert.equal(status, 400, String(idempotencyKey))
        assert.equal(json.error, "Invalid idempotency key")
    }
    assert.equal(fakeResend.attempts.length, 0)
})

test("the automatic sends still call Resend without options", async () => {
    const { data } = parseManualEmail(form)
    await email.sendBookingConfirmation(data)
    assert.deepEqual(fakeResend.options, [undefined])
})

// ------------------------------------------------- access codes (real database)
//
// A "confirmed" send saves the guest's house guide code. These run against the
// Postgres in TEST_DATABASE_URL (localhost only) with the app's own schema.

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
const codes = () => sql(`SELECT code, label, source, booking_id FROM guide_access ORDER BY code`)

after(async () => {
    await pgClient?.end()
    await globalThis.pgPool?.end()
})

dbTest("a confirmed send saves the access code before emailing", async () => {
    await sql(`DELETE FROM guide_access`)
    const { status, json } = await call({ ...form, action: "send" })
    assert.equal(status, 200)
    assert.deepEqual(json.accessCode, { code: "4907", added: true })
    assert.deepEqual(await codes(), [{ code: "4907", label: "Amara Nkusi", source: "manual", booking_id: null }])
    assert.equal(fakeResend.sent.length, 1)
    assert.match(fakeResend.sent[0].html, />4907</)
})

dbTest("sending the same confirmation twice keeps one code row", async () => {
    await sql(`DELETE FROM guide_access`)
    assert.equal((await call({ ...form, action: "send" })).json.accessCode.added, true)
    const second = await call({ ...form, action: "send" })
    assert.equal(second.status, 200)
    assert.deepEqual(second.json.accessCode, { code: "4907", added: false })
    assert.equal((await codes()).length, 1)
    assert.equal(fakeResend.sent.length, 2)
})

dbTest("a code already saved by a booking is left exactly as it was", async () => {
    await sql(`DELETE FROM guide_access`)
    await sql(`INSERT INTO guide_access (code, label, source, booking_id) VALUES ('4907', 'Grace Uwase', 'booking', 'BK-031')`)
    const { status, json } = await call({ ...form, action: "send" })
    assert.equal(status, 200)
    assert.deepEqual(json.accessCode, { code: "4907", added: false })
    assert.deepEqual(await codes(), [{ code: "4907", label: "Grace Uwase", source: "booking", booking_id: "BK-031" }])
})

dbTest("a phone with fewer than 4 digits saves nothing and still sends", async () => {
    await sql(`DELETE FROM guide_access`)
    const { status, json } = await call({ ...form, phone: "12", action: "send" })
    assert.equal(status, 200)
    assert.equal(json.accessCode, undefined)
    assert.deepEqual(await codes(), [])
    assert.equal(fakeResend.sent.length, 1)
})

dbTest("only a confirmed send saves a code; preview, other emails and refused requests never do", async () => {
    await sql(`DELETE FROM guide_access`)
    await call({ ...form, action: "preview" })
    await call({ ...form, template: "request", action: "send" })
    await call({ ...form, template: "declined", action: "send" })
    await call({ ...form, action: "send" }, { cookie: null })
    await call({ ...form, action: "send", guests: 9 })
    await call({ ...form, action: "send", idempotencyKey: "bad" })
    delete process.env.RESEND_API_KEY
    await call({ ...form, action: "send" })
    assert.deepEqual(await codes(), [])
})

dbTest("if the code can't be saved, nothing is sent", async () => {
    await sql(`DELETE FROM guide_access`)
    await sql(`ALTER TABLE guide_access RENAME TO guide_access_away`)
    try {
        const { status, json } = await call({ ...form, action: "send" })
        assert.equal(status, 500)
        assert.equal(json.error, "Couldn't save access code 4907, so nothing was sent. Try again.")
        assert.equal(fakeResend.attempts.length, 0)
    } finally {
        await sql(`ALTER TABLE guide_access_away RENAME TO guide_access`)
    }
})

dbTest("email fails after the code is saved: the code stays and a retry sends once", async () => {
    await sql(`DELETE FROM guide_access`)
    fakeResend.next = { throws: "socket hang up" }
    const first = await call({ ...form, action: "send", idempotencyKey: "retry-key-0001" })
    assert.equal(first.status, 500)
    assert.equal((await codes()).length, 1)
    const retry = await call({ ...form, action: "send", idempotencyKey: "retry-key-0001" })
    assert.equal(retry.status, 200)
    assert.deepEqual(retry.json.accessCode, { code: "4907", added: false })
    assert.equal((await codes()).length, 1)
    assert.equal(fakeResend.sent.length, 1)
    assert.deepEqual(fakeResend.options, [{ idempotencyKey: "retry-key-0001" }, { idempotencyKey: "retry-key-0001" }])
})
