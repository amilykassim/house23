import { NextRequest, NextResponse } from "next/server"
import { isAdminRequest } from "@/lib/admin-session"

export async function middleware(request: NextRequest) {
  // Only protect /admin routes (but not the API auth endpoint)
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!(await isAdminRequest(request))) {
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
