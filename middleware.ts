import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Payment redirects
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

  // Allow all requests (no auth required)
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
