import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Next.js 16: 'middleware' is renamed to 'proxy'
export default withAuth(
  function proxy(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Admin-only paths
    if (path.startsWith("/admin")) {
      if (token?.role !== "admin") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    if (path.startsWith("/it")) {
      if (token?.role !== "it" && token?.role !== "admin") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    if (path.startsWith("/hr")) {
      if (token?.role !== "hr" && token?.role !== "admin") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)",
  ],
};
