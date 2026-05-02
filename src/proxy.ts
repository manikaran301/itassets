import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Coarse route permissions. Page/module permissions are enforced by the
// page components and API handlers so users can be granted cross-module access.
const roleRoutes: Record<string, string[]> = {
  "/admin": ["admin"],
  "/api/admin": ["admin"],
};

// Next.js 16: 'middleware' is renamed to 'proxy'
export default withAuth(
  function proxy(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const userRole = token?.role as string;

    // Handle unauthorized API requests with JSON instead of redirect
    if (!token && path.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    // Check role-based access for all protected routes
    for (const [route, allowedRoles] of Object.entries(roleRoutes)) {
      if (path.startsWith(route)) {
        if (!allowedRoles.includes(userRole)) {
          // For API routes, return JSON error
          if (path.startsWith("/api/")) {
            return NextResponse.json(
              { error: "Forbidden - Insufficient permissions" },
              { status: 403 }
            );
          }
          // For pages, redirect to dashboard
          return NextResponse.redirect(new URL("/", req.url));
        }
        break;
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Allow public paths and API routes (to handle unauthorized JSON responses) without token
        if (path === "/login" || path.startsWith("/api/auth") || path.startsWith("/api/")) {
          return true;
        }

        // Require token for all other paths (pages)
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, mrllogo.png, MPLWhite.png (public assets)
     */
    "/((?!_next/static|_next/image|favicon.ico|mrllogo.png|MPLWhite.png).*)",
  ],
};
