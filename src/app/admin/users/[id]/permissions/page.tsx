"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

const PERMISSION_CONFIG = [
  {
    category: "IT",
    subcategories: ["ASSETS", "ACCESSORIES", "EMAILS", "PROVISIONING", "ASSIGNMENTS"]
  },
  {
    category: "HR",
    subcategories: ["EMPLOYEES", "JOINERS", "EXITS", "REQUIREMENTS"]
  },
  {
    category: "FACILITY",
    subcategories: ["SEATS"]
  },
  {
    category: "ADMIN",
    subcategories: ["USERS", "AUDIT", "REPORTS"]
  }
];

const ACTIONS = [
  { id: "canView", label: "View", icon: Eye },
  { id: "canCreate", label: "Create", icon: Plus },
  { id: "canEdit", label: "Edit", icon: Edit2 },
  { id: "canDelete", label: "Delete", icon: Trash2 },
  { id: "canImport", label: "Import", icon: Upload },
  { id: "canExport", label: "Export", icon: Download },
] as const;

export default function UserPermissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [permissions, setPermissions] = useState<any[]>([]);
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

      if (userRes.ok && permRes.ok) {
        const userData = await userRes.json();
        const permData = await permRes.json();
        setUser(userData.user);
        setPermissions(permData.permissions || []);
      }
    } catch (error) {
      setStatus({ type: "error", message: "Failed to load user data" });
    } finally {
      setLoading(false);
    }
  }

  const togglePermission = (category: string, subcategory: string, action: string) => {
    setStatus(null); // Clear status on change
    setPermissions(prev => {
      const existing = prev.find(p => p.category === category && p.subcategory === subcategory);
      if (existing) {
        return prev.map(p => 
          (p.category === category && p.subcategory === subcategory) 
            ? { ...p, [action]: !p[action] }
            : p
        );
      } else {
        return [...prev, { category, subcategory, [action]: true }];
      }
    });
  };

  const toggleAllInRow = (category: string, subcategory: string) => {
    setStatus(null);
    const existing = permissions.find(p => p.category === category && p.subcategory === subcategory);
    const allSet = ACTIONS.every(a => existing?.[a.id]);
    
    setPermissions(prev => {
      const otherPerms = prev.filter(p => !(p.category === category && p.subcategory === subcategory));
      const newState = !allSet;
      return [...otherPerms, {
        category,
        subcategory,
        canView: newState,
        canCreate: newState,
        canEdit: newState,
        canDelete: newState,
        canImport: newState,
        canExport: newState
      }];
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
    } catch (error: any) {
      setStatus({ type: "error", message: error.message || "Failed to save permissions" });
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
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-muted rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
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
                {ACTIONS.map(action => (
                  <th key={action.id} className="px-2 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground text-center">
                    <div className="flex flex-col items-center gap-1">
                      <action.icon className="w-3.5 h-3.5 text-primary/60" />
                      {action.label}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {PERMISSION_CONFIG.map((group) => (
                group.subcategories.map((sub, idx) => {
                  const currentPerm = permissions.find(p => p.category === group.category && p.subcategory === sub);
                  const isAllSet = ACTIONS.every(a => currentPerm?.[a.id]);

                  return (
                    <tr key={`${group.category}-${sub}`} className="hover:bg-muted/5 transition-colors group">
                      <td className="px-6 py-3">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black uppercase tracking-widest text-primary/50">
                            {group.category}
                          </span>
                          <span className="text-xs font-bold tracking-tight">
                            {sub.replace(/_/g, " ")}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-2 py-3 text-center">
                        <button 
                          onClick={() => toggleAllInRow(group.category, sub)}
                          className={cn(
                            "p-1.5 rounded-lg transition-all border",
                            isAllSet ? "bg-primary/10 border-primary/20 text-primary" : "bg-muted/50 border-transparent text-muted-foreground/40 hover:border-border"
                          )}
                        >
                          {isAllSet ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                        </button>
                      </td>

                      {ACTIONS.map(action => (
                        <td key={action.id} className="px-2 py-3 text-center">
                          <button
                            onClick={() => togglePermission(group.category, sub, action.id)}
                            className={cn(
                              "p-2 rounded-lg transition-all border",
                              currentPerm?.[action.id] 
                                ? "bg-primary/5 border-primary/20 text-primary" 
                                : "bg-transparent border-transparent text-muted-foreground/20 hover:border-border/30 hover:text-muted-foreground/50"
                            )}
                          >
                            {currentPerm?.[action.id] ? (
                              <CheckSquare className="w-4 h-4" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      ))}
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
