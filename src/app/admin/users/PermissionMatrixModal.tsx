"use client";

import { useState } from "react";
import { 
  ShieldCheck, 
  Eye, 
  Plus, 
  Edit2, 
  Trash2, 
  Upload, 
  Download,
  CheckSquare,
  Square,
  X
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

interface Permission {
  category: string;
  subcategory: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canImport: boolean;
  canExport: boolean;
}

interface PermissionMatrixModalProps {
  initialPermissions: Permission[];
  onSave: (permissions: Permission[]) => void;
  onClose: () => void;
}

export function PermissionMatrixModal({ initialPermissions, onSave, onClose }: PermissionMatrixModalProps) {
  const [permissions, setPermissions] = useState<Permission[]>(initialPermissions);

  const togglePermission = (category: string, subcategory: string, action: keyof Permission) => {
    setPermissions(prev => {
      const existing = prev.find(p => p.category === category && p.subcategory === subcategory);
      if (existing) {
        return prev.map(p => 
          (p.category === category && p.subcategory === subcategory) 
            ? { ...p, [action]: !p[action] }
            : p
        );
      } else {
        const newPerm: any = { 
          category, 
          subcategory, 
          canView: false, 
          canCreate: false, 
          canEdit: false, 
          canDelete: false, 
          canImport: false, 
          canExport: false 
        };
        newPerm[action] = true;
        return [...prev, newPerm];
      }
    });
  };

  const toggleAllInRow = (category: string, subcategory: string) => {
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card border border-border w-full max-w-5xl h-[85vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        <div className="bg-muted/30 px-8 py-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight uppercase flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Pre-configure Security Matrix
            </h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              Establish granular access boundaries for the new account
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-all">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="bg-card border border-border rounded-[24px] overflow-hidden">
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
                            type="button"
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
                              type="button"
                              onClick={() => togglePermission(group.category, sub, action.id as keyof Permission)}
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

        <div className="p-6 bg-muted/20 border-t border-border flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(permissions)}
            className="px-8 py-2.5 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20"
          >
            Finalize Matrix
          </button>
        </div>
      </div>
    </div>
  );
}
