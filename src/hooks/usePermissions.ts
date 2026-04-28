"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

export type PermissionAction = "canView" | "canCreate" | "canEdit" | "canDelete" | "canImport" | "canExport";

interface UserPermission {
  category: string;
  subcategory: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canImport: boolean;
  canExport: boolean;
}

export function usePermissions() {
  const { data: session, status } = useSession();
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/permissions");
      if (res.ok) {
        const data = await res.json();
        setPermissions(data.permissions || []);
        setRole(data.role || null);
      }
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchPermissions();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, fetchPermissions]);

  const checkPermission = useCallback((
    category: string,
    subcategory: string,
    action: PermissionAction
  ): boolean => {
    // Super-admins bypass all checks
    if (role === "admin") return true;

    // Safety check for permissions array
    if (!Array.isArray(permissions)) return role === "admin";

    const perm = permissions.find(
      (p) => 
        p.category?.toUpperCase() === category.toUpperCase() && 
        p.subcategory?.toUpperCase() === subcategory.toUpperCase()
    );

    return perm ? !!perm[action] : false;
  }, [permissions, role]);

  return {
    permissions,
    role,
    loading,
    checkPermission,
    isSuperAdmin: role === "admin"
  };
}
