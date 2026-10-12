import { timingSafeEqual } from "node:crypto"
import { NextResponse, type NextRequest } from "next/server"

// The /api/hooks/* routes are called server-to-server by Pennywise with a
// shared secret. Without the right key they answer 404, as if they did not
// exist, so a wrong key learns nothing.

const HEADER = "x-velstays-key"

/** True when the request carries the secret in PENNYWISE_HOOK_SECRET. */
export function hasHookKey(request: NextRequest): boolean {
    const secret = process.env.PENNYWISE_HOOK_SECRET
    const given = request.headers.get(HEADER)
    if (!secret || !given) return false
    const expected = Buffer.from(secret)
    const actual = Buffer.from(given)
    return expected.length === actual.length && timingSafeEqual(expected, actual)
}

/** The answer to a call without the key: the route looks absent. */
export const hookNotFound = () => NextResponse.json({ error: "Not found" }, { status: 404 })

/** 503 when there is no database to read or write. */
export const hookNoDatabase = () => NextResponse.json({ ok: false, error: "No database is configured" }, { status: 503 })
