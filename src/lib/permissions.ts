import prisma from "./prisma";
import type { PermissionAction } from "./permission-config";

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

  // 3. Check granular permissions from database
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
