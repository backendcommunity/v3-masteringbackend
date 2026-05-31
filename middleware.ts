import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const AUTH_PATHS = ["/auth/", "/xpayment", "/ai/payment"];

async function isTokenValid(token: string): Promise<boolean> {
  const secret = process.env.AUTH_TOKEN_SECRET;
  if (!secret) {
    // Secret not configured in this environment — fall back to cookie-existence check.
    // Log once so it's visible in deployment logs without spamming.
    console.warn("[middleware] AUTH_TOKEN_SECRET not set — skipping JWT verification");
    return true;
  }
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));
  const isProtected = !isAuthPage;

  const accessCookie = request.cookies.get("mb_token");
  const refreshCookie = request.cookies.get("mb_refresh_token");

  const hasAccessToken = !!accessCookie?.value;
  const hasRefreshToken = !!refreshCookie?.value;

  // Verify access token validity at the edge
  const accessValid = hasAccessToken ? await isTokenValid(accessCookie!.value) : false;

  // If access token is expired but refresh token exists and is valid,
  // let the request through — the client-side interceptor will silently refresh.
  const refreshValid = !accessValid && hasRefreshToken
    ? await isTokenValid(refreshCookie!.value)
    : false;

  const isAuthenticated = accessValid || refreshValid;

  // Not authenticated + protected route → redirect to login
  if (!isAuthenticated && isProtected) {
    const loginUrl = new URL("/auth/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated + auth page → redirect to home
  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|wav|mp3)).*)",
  ],
};
