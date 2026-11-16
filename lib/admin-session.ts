// The admin session cookie. Signing in with the passcode gives a signed token
// that expires after a day; every admin page and admin API checks the
// signature and the expiry, so the cookie can't be written by hand.
//
// Uses Web Crypto only, so the same code runs in the middleware and in routes.
//
// The signing key comes from ADMIN_SESSION_SECRET, or else from DATABASE_URL
// (always set where the admin works, and secret), together with the passcode:
// changing the passcode signs every session out. With neither, no session is
// valid.

export const ADMIN_COOKIE = "admin_auth"
export const SESSION_SECONDS = 60 * 60 * 24
const VERSION = "v1"

const encoder = new TextEncoder()

function keySource(): string | null {
    const secret = process.env.ADMIN_SESSION_SECRET || process.env.DATABASE_URL
    if (!secret) return null
    return `${secret}\u0000${process.env.ADMIN_PASSCODE || ""}`
}

async function signingKey(): Promise<CryptoKey | null> {
    const source = keySource()
    if (!source) return null
    return crypto.subtle.importKey("raw", encoder.encode(source), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"])
}

const toBase64Url = (bytes: ArrayBuffer) =>
    btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")

function fromBase64Url(text: string): Uint8Array | null {
    if (!/^[A-Za-z0-9_-]+$/.test(text)) return null
    try {
        const binary = atob(text.replace(/-/g, "+").replace(/_/g, "/"))
        return Uint8Array.from(binary, (c) => c.charCodeAt(0))
    } catch {
        return null
    }
}

/** A new session token, valid for SESSION_SECONDS from `now`; null without a key. */
export async function createAdminSession(now = Date.now()): Promise<string | null> {
    const key = await signingKey()
    if (!key) return null
    const payload = `${VERSION}.${now + SESSION_SECONDS * 1000}`
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload))
    return `${payload}.${toBase64Url(signature)}`
}

/** True for a token this server signed that has not expired yet. */
export async function isAdminSession(token: string | undefined | null, now = Date.now()): Promise<boolean> {
    if (!token) return false
    const parts = token.split(".")
    if (parts.length !== 3 || parts[0] !== VERSION || !/^\d{1,16}$/.test(parts[1])) return false
    if (Number(parts[1]) <= now) return false
    const signature = fromBase64Url(parts[2])
    const key = await signingKey()
    if (!signature || !key) return false
    // verify compares in constant time
    return crypto.subtle.verify("HMAC", key, signature, encoder.encode(`${parts[0]}.${parts[1]}`))
}

/** True when the request carries a valid admin session cookie. */
export const isAdminRequest = (request: { cookies: { get(name: string): { value: string } | undefined } }) =>
    isAdminSession(request.cookies.get(ADMIN_COOKIE)?.value)
