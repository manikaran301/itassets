import prisma from "./prisma";
import type { PermissionAction } from "./permission-config";

/**
 * Get all company IDs accessible to a user (including primary company and accessible companies)
 */
export async function getUserAccessibleCompanies(userId: string): Promise<string[]> {
  const user = await prisma.systemUser.findUnique({
    where: { id: userId },
    select: {
      companyId: true,
      accessibleCompanies: {
        select: { companyId: true }
      }
    }
  });

  if (!user) return [];

  const companies = new Set<string>();
  
  // Add primary company if set
  if (user.companyId) {
    companies.add(user.companyId);
  }
  
  // Add all accessible companies
  user.accessibleCompanies.forEach(access => {
    companies.add(access.companyId);
  });

  return Array.from(companies);
}

export async function hasPermission(
  userId: string,
  category: string,
  subcategory: string,
  action: PermissionAction,
  userRole?: string
): Promise<boolean> {
  const role = userRole || (await prisma.systemUser.findUnique({
    where: { id: userId },
    select: { role: true }
  }))?.role;

  // 1. Super-admins always have full access
  if (role === "admin") return true;

  // 2. IT Role refined access
  if (role === "it") {
    // IT has full control over IT and Facility modules
    if (category === "IT" || category === "FACILITY") return true;
    
    // IT can view Employees (needed for assignments) but nothing else in HR
    if (category === "HR") {
      if (subcategory === "EMPLOYEES" && action === "canView") return true;
      return false;
    }

    // Default: IT can view other global categories (like Dashboard)
    if (action === "canView" && category !== "ADMIN") return true;
  }

  // 3. HR Role refined access
  if (role === "hr") {
    // HR has full control over Facility/Seats (for seat mapping to employees)
    if (category === "FACILITY" && subcategory === "SEATS") return true;
    
    // HR has full control over HR module
    if (category === "HR") return true;

    // HR can view workspaces (needed for seat mapping)
    if (category === "IT" && subcategory === "WORKSPACES" && action === "canView") return true;

    // HR can view Dashboard
    if (action === "canView" && category === "DASHBOARD") return true;
  }

  // 4. Check granular permissions from database
  const permission = await prisma.userPermission.findUnique({
    where: {
      userId_category_subcategory: {
        userId,
        category: category.toUpperCase(),
        subcategory: subcategory.toUpperCase()
      }
    }
  });

  if (!permission) return false;

  return !!permission[action];
}

/**
 * Ensures a user has permission or throws an error
 */
export async function enforcePermission(
  userId: string,
  category: string,
  subcategory: string,
  action: PermissionAction,
  userRole?: string
) {
  const allowed = await hasPermission(userId, category, subcategory, action, userRole);
  if (!allowed) {
    throw new Error(`Access Denied: You do not have ${action} permission for ${category}/${subcategory}`);
  }
}

export async function requireAdmin(userId: string): Promise<void> {
  const user = await prisma.systemUser.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role !== "admin") {
    throw new Error("Access Denied: Admin role required");
  }
}
