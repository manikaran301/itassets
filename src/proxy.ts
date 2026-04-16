import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Role-based route permissions
const roleRoutes: Record<string, string[]> = {
  "/hr": ["hr", "admin"],
  "/it": ["it", "admin"],
  "/admin": ["admin"],
  "/api/assets": ["it", "admin"],
  "/api/employees": ["hr", "it", "admin"],
  "/api/emails": ["it", "admin"],
};

// Next.js 16: 'middleware' is renamed to 'proxy'
export default withAuth(
  function proxy(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const userRole = token?.role as string;

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

        // Allow public paths without token
        if (path === "/login" || path.startsWith("/api/auth")) {
          return true;
        }

        // Require token for all other paths
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
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
