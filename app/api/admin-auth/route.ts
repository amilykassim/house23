import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { passcode } = await request.json()
    const adminPasscode = process.env.ADMIN_PASSCODE || "0423"

    if (passcode === adminPasscode) {
      const response = NextResponse.json({ success: true })
      // Set an HTTP-only cookie that expires in 24 hours
      response.cookies.set("admin_auth", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24, // 24 hours
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
  response.cookies.delete("admin_auth")
  return response
}
