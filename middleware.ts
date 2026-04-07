import { NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  // Only protect /admin routes (but not the API auth endpoint)
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const authCookie = request.cookies.get("admin_auth")

    if (!authCookie || authCookie.value !== "authenticated") {
      // Redirect to the login page with a return URL
      const loginUrl = new URL("/admin-login", request.url)
      loginUrl.searchParams.set("returnTo", request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
