import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE = "cv_auth";
const PASSWORD = process.env.DEMO_PASSWORD || "chainverity1867";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let the login page and its API through without checking
  if (pathname === "/login" || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Check for valid auth cookie
  const auth = request.cookies.get(COOKIE);
  if (auth?.value === PASSWORD) {
    return NextResponse.next();
  }

  // Not authenticated — redirect to login, preserve destination
  const loginUrl = new URL("/login", request.url);
  const dest = pathname + request.nextUrl.search + request.nextUrl.hash;
  if (dest !== "/") loginUrl.searchParams.set("from", dest);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo-light.png|logo-dark.png|logo-report.png|wb-logo.png).*)",
  ],
};
