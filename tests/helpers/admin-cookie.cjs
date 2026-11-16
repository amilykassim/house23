// A real signed admin session cookie, as /api/admin-auth gives after the
// passcode (lib/admin-session.ts). Load after DATABASE_URL is set.
const { ADMIN_COOKIE, createAdminSession } = require("../../lib/admin-session.ts")

async function adminCookie() {
    const token = await createAdminSession()
    if (!token) throw new Error("No signing key: set DATABASE_URL or ADMIN_SESSION_SECRET first")
    return `${ADMIN_COOKIE}=${token}`
}

module.exports = { adminCookie }
