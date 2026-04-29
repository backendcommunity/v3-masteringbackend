import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("mb_token");

  const isAuthenticated = !!token?.value;

  const isAuthPage =
    pathname.startsWith("/auth/") || pathname.startsWith("/xpayment")|| pathname.startsWith("/ai/payment");
  const isSecret = !isAuthPage;

  if (pathname.startsWith("/ai/payment")) {
    const payment = new URL("/ai/payment", request.url);
    payment.search = request.nextUrl.search;
    return NextResponse.redirect(payment);
  }

if (pathname.startsWith("/xpayment")) {
    const payment = new URL("/xpayment", request.url);
    payment.search = request.nextUrl.search;
    return NextResponse.redirect(payment);
  }

  // 1. If NOT authenticated and trying to access protected route
  if (!isAuthenticated && isSecret) {
    const loginUrl = new URL("/auth/login", request.url);
    // Add redirect parameter to return to original page after login
    if (pathname !== "/") {
      loginUrl.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // 2. If authenticated and trying to access auth pages
  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Otherwise, allow the request
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|wav|mp3)).*)",
  ],
};
