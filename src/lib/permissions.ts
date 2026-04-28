import prisma from "./prisma";

export type PermissionAction = "canView" | "canCreate" | "canEdit" | "canDelete" | "canImport" | "canExport";

export async function hasPermission(
  userId: string,
  category: string,
  subcategory: string,
  action: PermissionAction
): Promise<boolean> {
  // 1. Fetch user to check global role
  const user = await prisma.systemUser.findUnique({
    where: { id: userId },
    select: { role: true }
  });

  // 2. Super-admins always have full access
  if (user?.role === "admin") return true;

  // 3. Check granular permissions
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
  action: PermissionAction
) {
  const allowed = await hasPermission(userId, category, subcategory, action);
  if (!allowed) {
    throw new Error(`Access Denied: You do not have ${action} permission for ${category}/${subcategory}`);
  }
}
