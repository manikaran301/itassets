"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ShieldCheck, 
  Save, 
  ArrowLeft, 
  CheckSquare, 
  Square,
  Loader2,
  AlertCircle,
  Eye,
  Plus,
  Edit2,
  Trash2,
  Upload,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PERMISSION_ACTIONS, PERMISSION_GROUPS, type PermissionAction } from "@/lib/permission-config";

interface EditablePermission {
  category: string;
  subcategory: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canImport: boolean;
  canExport: boolean;
}

interface PermissionUser {
  fullName: string;
  username?: string;
}

const ACTION_ICONS = {
  canView: Eye,
  canCreate: Plus,
  canEdit: Edit2,
  canDelete: Trash2,
  canImport: Upload,
  canExport: Download,
};

function findPermission(
  permissions: EditablePermission[],
  category: string,
  subcategory: string,
) {
  return permissions.find(
    (permission) =>
      permission.category?.toUpperCase() === category.toUpperCase() &&
      permission.subcategory?.toUpperCase() === subcategory.toUpperCase(),
  );
}

export default function UserPermissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<PermissionUser | null>(null);
  const [permissions, setPermissions] = useState<EditablePermission[]>([]);
  const [status, setStatus] = useState<{ type: "success" | "error", message: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    try {
      const [userRes, permRes] = await Promise.all([
        fetch(`/api/admin/users/${id}`),
        fetch(`/api/admin/users/${id}/permissions`)
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);
      } else {
        setUser({ fullName: `User ${id.slice(0, 8)}` });
      }

      if (permRes.ok) {
        const permData = await permRes.json();
        setPermissions(permData.permissions || []);
      } else {
        setStatus({ type: "error", message: "Failed to load saved permissions" });
      }
    } catch {
      setStatus({ type: "error", message: "Failed to load user data" });
    } finally {
      setLoading(false);
    }
  }

  const togglePermission = (category: string, subcategory: string, action: PermissionAction) => {
    setStatus(null); // Clear status on change
    setPermissions(prev => {
      const existing = findPermission(prev, category, subcategory);
      if (existing) {
        return prev.map(p => 
          (p.category.toUpperCase() === category.toUpperCase() && p.subcategory.toUpperCase() === subcategory.toUpperCase())
            ? { ...p, [action]: !p[action] }
            : p
        );
      } else {
        return [...prev, {
          category,
          subcategory,
          canView: false,
          canCreate: false,
          canEdit: false,
          canDelete: false,
          canImport: false,
          canExport: false,
          [action]: true,
        }];
      }
    });
  };

  const toggleAllInRow = (category: string, subcategory: string) => {
    setStatus(null);
    const existing = findPermission(permissions, category, subcategory);
    const page = PERMISSION_GROUPS.flatMap((group) => group.pages).find(
      (item) => item.category === category && item.subcategory === subcategory,
    );
    const rowActions = page?.actions ?? PERMISSION_ACTIONS.map((action) => action.id);
    const allSet = rowActions.every(action => existing?.[action]);
    
    setPermissions(prev => {
      const otherPerms = prev.filter(
        p => !(p.category.toUpperCase() === category.toUpperCase() && p.subcategory.toUpperCase() === subcategory.toUpperCase())
      );
      const newState = !allSet;
      const nextPermission: EditablePermission = {
        category,
        subcategory,
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canImport: false,
        canExport: false
      };

      rowActions.forEach((action) => {
        nextPermission[action] = newState;
      });

      return [...otherPerms, nextPermission];
    });
  };

  async function handleSave() {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/admin/users/${id}/permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions })
      });

      if (res.ok) {
        setStatus({ type: "success", message: "Permissions updated successfully" });
        setTimeout(() => router.push("/admin/users"), 1000);
      } else {
        const data = await res.json();
        throw new Error(data.error);
      }
    } catch (error: unknown) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "Failed to save permissions" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-xs font-black uppercase tracking-widest opacity-50">Loading Security Matrix...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in pb-10 pt-2">
      {/* Integrated Compact Header */}
      <div className="flex items-center justify-between bg-card/50 border border-border px-4 py-3 rounded-2xl backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link 
            href="/admin/users"
            className="p-2 hover:bg-muted rounded-xl transition-all"
            aria-label="Back to users"
            title="Back to users"
          >
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </Link>
          <div className="h-6 w-[1px] bg-border mx-1" />
          <div>
            <h1 className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Security Matrix: <span className="text-muted-foreground">{user?.fullName}</span>
            </h1>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/10 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3 h-4 animate-spin" /> : <Save className="w-3 h-4" />}
          Save Matrix
        </button>
      </div>

      {status && (
        <div className={cn(
          "px-4 py-2 rounded-xl flex items-center gap-3 border animate-in slide-in-from-top duration-300",
          status.type === "success" ? "bg-green-500/10 border-green-500/20 text-green-600" : "bg-red-500/10 border-red-500/20 text-red-600"
        )}>
          {status.type === "success" ? <ShieldCheck className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <p className="text-[10px] font-black uppercase tracking-widest">{status.message}</p>
        </div>
      )}

      {/* Permission Table - Compacted */}
      <div className="bg-card border border-border rounded-[24px] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground w-48">Resource</th>
                <th className="px-2 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground text-center">Batch</th>
                {PERMISSION_ACTIONS.map(action => {
                  const ActionIcon = ACTION_ICONS[action.id];
                  return (
                  <th key={action.id} className="px-2 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground text-center">
                    <div className="flex flex-col items-center gap-1">
                      <ActionIcon className="w-3.5 h-3.5 text-primary/60" />
                      {action.shortLabel}
                    </div>
                  </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {PERMISSION_GROUPS.map((group) => (
                group.pages.map((page) => {
                  const currentPerm = findPermission(permissions, group.category, page.subcategory);
                  const rowActions = page.actions ?? PERMISSION_ACTIONS.map((action) => action.id);
                  const isAllSet = rowActions.every(action => currentPerm?.[action]);
                  const PageIcon = page.icon;

                  return (
                    <tr key={`${group.category}-${page.subcategory}`} className="hover:bg-muted/5 transition-colors group">
                      <td className="px-6 py-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <PageIcon className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[8px] font-black uppercase tracking-widest text-primary/50">
                              {group.label}
                            </span>
                            <span className="text-xs font-bold tracking-tight">
                              {page.label}
                            </span>
                            <span className="text-[9px] font-mono text-muted-foreground/60 truncate">
                              {page.href}
                            </span>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-2 py-3 text-center">
                        <button 
                          onClick={() => toggleAllInRow(group.category, page.subcategory)}
                          className={cn(
                            "p-1.5 rounded-lg transition-all border",
                            isAllSet ? "bg-primary/10 border-primary/20 text-primary" : "bg-muted/50 border-transparent text-muted-foreground/40 hover:border-border"
                          )}
                          title={isAllSet ? `Remove all permissions for ${page.label}` : `Grant all permissions for ${page.label}`}
                        >
                          {isAllSet ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                        </button>
                      </td>

                      {PERMISSION_ACTIONS.map(action => {
                        const isAvailable = rowActions.includes(action.id);
                        const isChecked = !!currentPerm?.[action.id];

                        return (
                        <td key={action.id} className="px-2 py-3 text-center">
                          <button
                            onClick={() => isAvailable && togglePermission(group.category, page.subcategory, action.id)}
                            disabled={!isAvailable}
                            className={cn(
                              "p-2 rounded-lg transition-all border",
                              !isAvailable
                                ? "bg-muted/20 border-transparent text-muted-foreground/10 cursor-not-allowed"
                                : isChecked
                                ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
                                : "bg-transparent border-transparent text-muted-foreground/20 hover:border-border/30 hover:text-muted-foreground/50"
                            )}
                            title={`${action.label}: ${page.label}`}
                          >
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 stroke-[3]" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        );
                      })}
                    </tr>
                  );
                })
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-primary/5 border border-primary/20 p-6 rounded-3xl flex gap-4">
        <AlertCircle className="w-6 h-6 text-primary shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-bold text-primary uppercase tracking-widest">Administrative Override</p>
          <p className="text-xs text-primary/80 leading-relaxed">
            Users with the <span className="font-black underline">ADMIN</span> role automatically bypass this security matrix and have full access to all operations. Use granular permissions for specialized staff like HR Coordinators or IT Technicians.
          </p>
        </div>
      </div>
    </div>
  );
}
