import { NextRequest, NextResponse } from "next/server"
import { ADMIN_COOKIE, SESSION_SECONDS, createAdminSession } from "@/lib/admin-session"

export async function POST(request: NextRequest) {
  try {
    const { passcode } = await request.json()
    const adminPasscode = process.env.ADMIN_PASSCODE || "0423"

    if (passcode === adminPasscode) {
      // A signed session that expires in 24 hours, in an HTTP-only cookie
      const session = await createAdminSession()
      if (!session) {
        return NextResponse.json({ success: false, error: "Sign-in is not configured" }, { status: 503 })
      }
      const response = NextResponse.json({ success: true })
      response.cookies.set(ADMIN_COOKIE, session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: SESSION_SECONDS,
        path: "/",
      })
      return response
    }

    return NextResponse.json({ success: false, error: "Invalid passcode" }, { status: 401 })
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.delete(ADMIN_COOKIE)
  return response
}
