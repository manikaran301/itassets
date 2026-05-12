import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { headers, cookies } from "next/headers";
import prisma from "./prisma";

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
    // 1. Company Scope - for HR, check accessible companies
    if (user.role === "hr" && user.id) {
      // Get all accessible companies for HR user
      const accessibleCompanies = await prisma.userCompanyAccess.findMany({
        where: { userId: user.id },
        select: { companyId: true }
      });

      if (accessibleCompanies.length > 0) {
        // If user selected a specific company via active filter, use that
        if (activeLocationId) {
          // Try to get company from active location or company filter
          scope.companyId = activeLocationId;
        } else {
          // Default: Show data from ALL accessible companies
          // For now, if multiple companies, we'll need to handle this in the query
          // This is a limitation of Prisma's simple where clause
          // The API should filter by accessible companies
        }
      } else if (user.companyId) {
        // Fallback to primary company
        scope.companyId = user.companyId;
      }
    } else if (user.companyId) {
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
