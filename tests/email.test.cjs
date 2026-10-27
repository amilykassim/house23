// The automatic booking emails (lib/email.ts). These pin what guests receive
// today, so they must pass both before and after the builders were extracted.
process.env.RESEND_API_KEY = "re_test"
const { fakeResend } = require("./helpers/ts-loader.cjs")
const { test, beforeEach } = require("node:test")
const assert = require("node:assert/strict")
const email = require("../lib/email.ts")

const booking = {
    guestName: "Amara <b>Nkusi</b>",
    guestEmail: "amara@example.com",
    guestPhone: "+250 788 214 907",
    houseName: "House 23",
    checkIn: "2026-11-14",
    checkOut: "2026-11-17",
    nights: 3,
    guests: 2,
    total: 142.76,
    totalRwf: 210000,
    momoTransactionId: "MM-1",
    specialRequests: "Late arrival",
    bookingId: "BK-014",
}

beforeEach(() => {
    process.env.RESEND_API_KEY = "re_test"
    fakeResend.reset()
})

async function sendOne(fn, data) {
    await email[fn](data)
    assert.equal(fakeResend.sent.length, 1, `${fn} should send exactly one email`)
    return fakeResend.sent[0]
}

test("acknowledgment: subject, recipient and stay details", async () => {
    const m = await sendOne("sendBookingAcknowledgment", booking)
    assert.equal(m.to, "amara@example.com")
    assert.equal(m.subject, "We have your request — Velstays House 23")
    assert.match(m.html, /We have your request/)
    assert.match(m.html, /Pending Review/)
    assert.match(m.html, /BK-014/)
    assert.match(m.html, /Sat, Nov 14, 2026/)
    assert.match(m.html, /\$142\.76/)
    assert.match(m.html, /210,000 RWF/)
    assert.match(m.html, /Special request/)
})

test("confirmation: access code is the last 4 phone digits", async () => {
    const m = await sendOne("sendBookingConfirmation", booking)
    assert.equal(m.subject, "Your reservation is confirmed — Velstays House 23")
    assert.match(m.html, />4907</)
    assert.match(m.html, /Total paid/)
})

test("confirmation without a usable phone explains the code instead", async () => {
    const m = await sendOne("sendBookingConfirmation", { ...booking, guestPhone: "12" })
    assert.match(m.html, /is the last four digits of the phone number you booked with/)
})

test("cancellation: reason message and refund note", async () => {
    const m = await sendOne("sendBookingCancellation", { ...booking, rejectionReason: "maintenance" })
    assert.equal(m.subject, "Booking Update — Velstays House 23")
    assert.match(m.html, /undergoing scheduled maintenance/)
    assert.match(m.html, /full refund will be arranged/)
})

test("cancellation for a policy violation offers no refund", async () => {
    const m = await sendOne("sendBookingCancellation", { ...booking, rejectionReason: "policy_violation" })
    assert.doesNotMatch(m.html, /refund/)
    assert.match(m.html, /Questions\?/)
})

test("cancellation without a reason names the stay", async () => {
    const m = await sendOne("sendBookingCancellation", booking)
    assert.match(m.html, /unable to confirm your booking for <strong>Velstays House 23<\/strong>/)
})

test("guest name is HTML-escaped in every email", async () => {
    for (const fn of ["sendBookingAcknowledgment", "sendBookingConfirmation", "sendBookingCancellation"]) {
        fakeResend.reset()
        const m = await sendOne(fn, booking)
        assert.match(m.html, /Amara &lt;b&gt;Nkusi&lt;\/b&gt;/, fn)
        assert.doesNotMatch(m.html, /<b>Nkusi/, fn)
    }
})

test("the letterhead footer gives the street address", async () => {
    for (const fn of ["sendBookingAcknowledgment", "sendBookingConfirmation", "sendBookingCancellation", "sendAdminNewBookingNotification"]) {
        fakeResend.reset()
        const m = await sendOne(fn, booking)
        assert.match(m.html, /Velstays &middot; Kigali, Rwanda<\/p>\s*<p[^>]*>KK 460A St<\/p>\s*<p[^>]*>\+250 788 459 885<\/p>/, fn)
    }
})

test("nothing is sent without RESEND_API_KEY", async () => {
    delete process.env.RESEND_API_KEY
    for (const fn of ["sendBookingAcknowledgment", "sendBookingConfirmation", "sendBookingCancellation"]) {
        await email[fn](booking)
    }
    assert.equal(fakeResend.attempts.length, 0)
})

test("a Resend failure is swallowed, never thrown to the booking flow", async () => {
    for (const fn of ["sendBookingAcknowledgment", "sendBookingConfirmation", "sendBookingCancellation"]) {
        fakeResend.next = { throws: "network down" }
        await assert.doesNotReject(email[fn](booking), fn)
    }
})
