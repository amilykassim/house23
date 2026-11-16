// lib/admin-session.ts: the admin cookie is a signed, expiring session, so it
// can't be written by hand. Covers the token, sign-in, the middleware and
// every API route that checks the session.
process.env.DATABASE_URL = "postgresql://no-database-for-tests@localhost:1/none"
delete process.env.ADMIN_SESSION_SECRET
process.env.ADMIN_PASSCODE = "4821"
require("./helpers/ts-loader.cjs")
const { test } = require("node:test")
const assert = require("node:assert/strict")
const { NextRequest } = require("next/server")
const session = require("../lib/admin-session.ts")

const DAY = 24 * 60 * 60 * 1000
const withEnv = async (vars, fn) => {
    const saved = Object.fromEntries(Object.keys(vars).map((k) => [k, process.env[k]]))
    for (const [k, v] of Object.entries(vars)) v === undefined ? delete process.env[k] : (process.env[k] = v)
    try {
        return await fn()
    } finally {
        for (const [k, v] of Object.entries(saved)) v === undefined ? delete process.env[k] : (process.env[k] = v)
    }
}
const req = (url, { cookie, method = "GET", body } = {}) =>
    new NextRequest(url, {
        method,
        headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
        body: body === undefined ? undefined : JSON.stringify(body),
    })

// ---- the token

test("a session it signed is valid until it expires, a day later", async () => {
    const now = Date.now()
    const token = await session.createAdminSession(now)
    assert.match(token, /^v1\.\d+\.[A-Za-z0-9_-]+$/)
    assert.equal(await session.isAdminSession(token, now), true)
    assert.equal(await session.isAdminSession(token, now + DAY - 1000), true)
    assert.equal(await session.isAdminSession(token, now + DAY), false)
    assert.equal(session.SESSION_SECONDS, 24 * 60 * 60)
})

test("the old fixed value, and anything hand-written, is not a session", async () => {
    for (const forged of ["authenticated", "", "v1", "v1.9999999999999.", "v1.9999999999999.abc", "v2.9999999999999.abc", "a.b.c", null, undefined]) {
        assert.equal(await session.isAdminSession(forged), false, String(forged))
    }
})

test("changing the expiry or the signature breaks it", async () => {
    const token = await session.createAdminSession()
    const [v, exp, sig] = token.split(".")
    assert.equal(await session.isAdminSession(`${v}.${Number(exp) + DAY}.${sig}`), false)
    const flipped = sig.slice(0, -2) + (sig.at(-2) === "A" ? "B" : "A") + sig.at(-1)
    assert.equal(await session.isAdminSession(`${v}.${exp}.${flipped}`), false)
    assert.equal(await session.isAdminSession(`${v}.${exp}.${sig}x`), false)
})

test("a session from another key, or from before the passcode changed, is refused", async () => {
    const token = await session.createAdminSession()
    await withEnv({ DATABASE_URL: "postgresql://other@localhost:1/none" }, async () => {
        assert.equal(await session.isAdminSession(token), false)
    })
    await withEnv({ ADMIN_PASSCODE: "9999" }, async () => {
        assert.equal(await session.isAdminSession(token), false)
    })
    await withEnv({ ADMIN_SESSION_SECRET: "a-dedicated-secret" }, async () => {
        assert.equal(await session.isAdminSession(token), false)
        const own = await session.createAdminSession()
        assert.equal(await session.isAdminSession(own), true)
    })
    assert.equal(await session.isAdminSession(token), true)
})

test("without any key nobody is signed in", async () => {
    const token = await session.createAdminSession()
    await withEnv({ DATABASE_URL: undefined, ADMIN_SESSION_SECRET: undefined }, async () => {
        assert.equal(await session.createAdminSession(), null)
        assert.equal(await session.isAdminSession(token), false)
    })
})

// ---- sign-in

test("the right passcode gives an HTTP-only session cookie for a day", async () => {
    const { POST } = require("../app/api/admin-auth/route.ts")
    const res = await POST(req("http://localhost/api/admin-auth", { method: "POST", body: { passcode: "4821" } }))
    assert.equal(res.status, 200)
    const set = res.headers.get("set-cookie")
    assert.match(set, /^admin_auth=v1\./)
    assert.match(set, /HttpOnly/i)
    assert.match(set, /SameSite=strict/i)
    assert.match(set, /Max-Age=86400/)
    assert.equal(await session.isAdminSession(res.cookies.get("admin_auth").value), true)
})

test("control: a wrong passcode is still a 401 with no cookie", async () => {
    const { POST } = require("../app/api/admin-auth/route.ts")
    const res = await POST(req("http://localhost/api/admin-auth", { method: "POST", body: { passcode: "0000" } }))
    assert.equal(res.status, 401)
    assert.equal(res.headers.get("set-cookie"), null)
})

test("the right passcode with no signing key says sign-in is not configured", async () => {
    const { POST } = require("../app/api/admin-auth/route.ts")
    await withEnv({ DATABASE_URL: undefined, ADMIN_SESSION_SECRET: undefined }, async () => {
        const res = await POST(req("http://localhost/api/admin-auth", { method: "POST", body: { passcode: "4821" } }))
        assert.equal(res.status, 503)
        assert.equal(res.headers.get("set-cookie"), null)
    })
})

test("control: signing out still clears the cookie", async () => {
    const { DELETE } = require("../app/api/admin-auth/route.ts")
    const res = await DELETE()
    assert.match(res.headers.get("set-cookie"), /^admin_auth=;/)
})

// ---- the admin pages

test("admin pages send a forged cookie to the sign-in page, and let a session through", async () => {
    const { middleware } = require("../middleware.ts")
    for (const cookie of [undefined, "admin_auth=authenticated"]) {
        const res = await middleware(req("http://localhost/admin/expenses", { cookie }))
        assert.equal(res.status, 307, String(cookie))
        assert.equal(res.headers.get("location"), "http://localhost/admin-login?returnTo=%2Fadmin%2Fexpenses")
    }
    const ok = await middleware(req("http://localhost/admin/expenses", { cookie: `admin_auth=${await session.createAdminSession()}` }))
    assert.equal(ok.headers.get("location"), null)
    assert.equal(ok.headers.get("x-middleware-next"), "1")
})

test("control: pages outside /admin are untouched", async () => {
    const { middleware } = require("../middleware.ts")
    const res = await middleware(req("http://localhost/house/house-23"))
    assert.equal(res.headers.get("x-middleware-next"), "1")
})

// ---- every API route that checks the session refuses the forged cookie
// (before touching the database, which these tests don't have)

const FORGED = "admin_auth=authenticated"
const routes = [
    ["GET /api/expenses", () => require("../app/api/expenses/route.ts").GET(req("http://localhost/api/expenses", { cookie: FORGED }))],
    ["POST /api/expenses", () => require("../app/api/expenses/route.ts").POST(req("http://localhost/api/expenses", { cookie: FORGED, method: "POST", body: {} }))],
    ["PATCH /api/expenses", () => require("../app/api/expenses/route.ts").PATCH(req("http://localhost/api/expenses", { cookie: FORGED, method: "PATCH", body: {} }))],
    ["DELETE /api/expenses", () => require("../app/api/expenses/route.ts").DELETE(req("http://localhost/api/expenses?id=EX-1", { cookie: FORGED, method: "DELETE" }))],
    ["GET /api/personal-expenses", () => require("../app/api/personal-expenses/route.ts").GET(req("http://localhost/api/personal-expenses", { cookie: FORGED }))],
    ["POST /api/personal-expenses", () => require("../app/api/personal-expenses/route.ts").POST(req("http://localhost/api/personal-expenses", { cookie: FORGED, method: "POST", body: {} }))],
    ["PUT /api/personal-expenses", () => require("../app/api/personal-expenses/route.ts").PUT(req("http://localhost/api/personal-expenses", { cookie: FORGED, method: "PUT", body: {} }))],
    ["DELETE /api/personal-expenses", () => require("../app/api/personal-expenses/route.ts").DELETE(req("http://localhost/api/personal-expenses?id=PE-1", { cookie: FORGED, method: "DELETE" }))],
    ["POST /api/bookings (by hand)", () => require("../app/api/bookings/route.ts").POST(req("http://localhost/api/bookings", { cookie: FORGED, method: "POST", body: { manual: true } }))],
    ["DELETE /api/bookings", () => require("../app/api/bookings/route.ts").DELETE(req("http://localhost/api/bookings?id=B-1", { cookie: FORGED, method: "DELETE" }))],
    ["GET /api/calendar/[slug]/reads", () => require("../app/api/calendar/[slug]/reads/route.ts").GET(req("http://localhost/api/calendar/house-23/reads", { cookie: FORGED }), { params: Promise.resolve({ slug: "house-23" }) })],
    ["POST /api/manual-email", () => require("../app/api/manual-email/route.ts").POST(req("http://localhost/api/manual-email", { cookie: FORGED, method: "POST", body: {} }))],
]
for (const [name, call] of routes) {
    test(`${name} refuses the forged cookie`, async () => {
        const res = await call()
        assert.equal(res.status, 401)
        assert.deepEqual(await res.json(), { error: "Unauthorized" })
    })
}
