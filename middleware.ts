import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
// import jwt from "jsonwebtoken"

export function middleware(request: NextRequest) {
  // Check if the request is for the dashboard
  // if (request.nextUrl.pathname.startsWith("/dashboard11")) {
  //   const token = request.cookies.get("auth-token")?.value;

  //   if (!token) {
  //     // Redirect to login if no token
  //     // return NextResponse.redirect(new URL("/login", request.url))
  //   }

  //   try {
  //     // Verify the JWT token
  //     // const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret")
  //     // Add user info to headers for API routes
  //     // const response = NextResponse.next()
  //     // response.headers.set("x-user-id", (decoded as any).userId)
  //     // response.headers.set("x-user-email", (decoded as any).email)
  //     // return response
  //   } catch (error) {
  //     // Invalid token, redirect to login
  //     const response = NextResponse.redirect(
  //       new URL("/dashboard", request.url)
  //     );
  //     response.cookies.delete("auth-token");
  //     return response;
  //   }
  // }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
