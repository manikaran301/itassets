import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { headers, cookies } from "next/headers";

export interface DataScope {
  companyId?: string;
  locationId?: { in: string[] } | string;
}

/**
 * Utility to generate Prisma 'where' clause fragments for data isolation.
 * Automatically handles Company and Multi-Location scoping based on user session.
 */
export async function getDataScope(): Promise<DataScope> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return {};

  const user = session.user as any;
  
  // Global Admins and IT see everything unless they explicitly filter
  const isGlobalAdmin = user.role === "admin" || user.role === "it";

  const scope: DataScope = {};

  // Get active location from cookies or headers
  const cookieStore = await cookies();
  const headerList = await headers();
  const activeLocationId = cookieStore.get("x-mams-scope-location")?.value || headerList.get("x-mams-scope-location");

  if (!isGlobalAdmin) {
    // 1. Company Scope
    if (user.companyId) {
      scope.companyId = user.companyId;
    }

    // 2. Location Scope
    if (user.authorizedLocations && user.authorizedLocations.length > 0) {
      const authIds = user.authorizedLocations.map((l: any) => l.id);
      
      if (activeLocationId && authIds.includes(activeLocationId)) {
        // If user selected a specific location from their authorized list
        scope.locationId = activeLocationId;
      } else {
        // Default: Show data from ALL authorized locations
        scope.locationId = { in: authIds };
      }
    }
  } else {
    // Admins can also use the scope selector to focus on one location
    if (activeLocationId) {
      scope.locationId = activeLocationId;
    }
  }

  return scope;
}
