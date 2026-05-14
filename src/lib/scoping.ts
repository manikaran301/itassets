import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { headers, cookies } from "next/headers";
import prisma from "./prisma";

export interface DataScope {
  companyId?: string | { in: string[] } | null;
  locationId?: string | { in: string[] } | null;
  companyName?: string | { in: string[] } | null;
  locationName?: string | { in: string[] } | null;
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
      const accessibleCompanies = await prisma.userCompanyAccess.findMany({
        where: { userId: user.id },
        select: { companyId: true }
      });

      if (accessibleCompanies.length > 0) {
        const companyIds = accessibleCompanies.map(c => c.companyId);
        
        // If there's an active context, check if it's one of the accessible companies
        if (activeLocationId && companyIds.includes(activeLocationId)) {
          scope.companyId = activeLocationId;
        } else {
          scope.companyId = { in: companyIds } as any;
        }

        // Resolve company names for models that use strings
        const targetIds = scope.companyId && typeof scope.companyId === 'string' 
          ? [scope.companyId] 
          : companyIds;
          
        const companies = await prisma.company.findMany({
          where: { id: { in: targetIds } },
          select: { name: true }
        });
        scope.companyName = targetIds.length === 1 
          ? companies[0]?.name 
          : { in: companies.map(c => c.name) } as any;
      } else if (user.companyId) {
        scope.companyId = user.companyId;
        const company = await prisma.company.findUnique({ where: { id: user.companyId } });
        if (company) scope.companyName = company.name;
      }
    } else if (user.companyId) {
      scope.companyId = user.companyId;
      const company = await prisma.company.findUnique({ where: { id: user.companyId } });
      if (company) scope.companyName = company.name;
    }

    // 2. Location Scope - Fetch REAL-TIME from database to avoid stale session data
    const userLocations = await prisma.systemUser.findUnique({
      where: { id: user.id },
      select: {
        managedLocations: {
          select: { id: true, name: true }
        }
      }
    });

    const authorizedLocations = userLocations?.managedLocations || [];
    
    if (authorizedLocations.length > 0) {
      const authIds = authorizedLocations.map((l) => l.id);
      
      if (activeLocationId && authIds.includes(activeLocationId)) {
        scope.locationId = activeLocationId;
        const loc = authorizedLocations.find(l => l.id === activeLocationId);
        if (loc) scope.locationName = loc.name;
      } else {
        // Only apply 'in' filter if they actually have specific authorized locations
        scope.locationId = { in: authIds };
        scope.locationName = { in: authorizedLocations.map(l => l.name) } as any;
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
