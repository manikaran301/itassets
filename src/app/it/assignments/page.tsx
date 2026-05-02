"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Monitor,
  HardDrive,
  User,
  Clock,
  Search,
  Filter,
  Download,
  CheckCircle2,
  Wrench,
  Loader2,
  AlertCircle,
  RotateCcw,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePermissions } from "@/hooks/usePermissions";
import { SearchableSelect } from "@/components/SearchableSelect";

interface AssignmentLog {
  id: string;
  logCode: string;
  assetTag?: string;
  employeeFullName?: string;
  actionType: string;
  assignedDate: string;
  returnedDate?: string | null;
  assetCategory: string;
  asset?: { assetTag: string } | null;
  accessory?: { assetTag: string } | null;
  employee?: { fullName: string; employeeCode: string; photoPath?: string } | null;
}

export default function AssignmentsPage() {
  const { checkPermission, loading: permsLoading } = usePermissions();
  const canViewAssignments = checkPermission("IT", "ASSIGNMENTS", "canView");
  const canExportAssignments = checkPermission("IT", "ASSIGNMENTS", "canExport");
  const [assignments, setAssignments] = useState<AssignmentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");

  useEffect(() => {
    if (!permsLoading && canViewAssignments) {
      fetchAssignments();
    }
  }, [permsLoading, canViewAssignments]);

  const fetchAssignments = async () => {
    try {
      const res = await fetch("/api/assignment-history");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setAssignments(data);
    } catch (error) {
      console.error("Failed to fetch assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const stats = {
    total: assignments.length,
    active: assignments.filter(
      (a) => !a.returnedDate && a.actionType !== "repair_send",
    ).length,
    returned: assignments.filter((a) => a.returnedDate).length,
    inRepair: assignments.filter(
      (a) => a.actionType === "repair_send" && !a.returnedDate,
    ).length,
  };

  // Filter assignments
  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSearch =
      searchTerm === "" ||
      assignment.logCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.asset?.assetTag
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      assignment.accessory?.assetTag
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      assignment.employee?.fullName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const status = assignment.returnedDate
      ? "returned"
      : assignment.actionType === "repair_send"
        ? "repair"
        : "active";
    const matchesStatus = statusFilter === "all" || status === statusFilter;

    const matchesAction =
      actionFilter === "all" || assignment.actionType === actionFilter;

    return matchesSearch && matchesStatus && matchesAction;
  });

  const getTypeStyle = (type: string) => {
    switch (type) {
      case "new_assignment":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "reassignment":
        return "bg-primary/10 text-primary border-primary/20";
      case "repair_send":
        return "bg-accent/10 text-accent border-accent/20";
      case "recovery_exit":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "repair_return":
        return "bg-secondary/10 text-secondary border-secondary/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "new_assignment":
        return "✅";
      case "reassignment":
        return "🔄";
      case "repair_send":
        return "🔧";
      case "repair_return":
        return "🏥";
      case "recovery_exit":
        return "🚪";
      default:
        return "⋮";
    }
  };

  if (permsLoading || (canViewAssignments && loading)) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!canViewAssignments) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-6 p-8 text-center animate-fade-in">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center">
          <Lock className="w-10 h-10 text-red-500" />
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-2xl font-black tracking-tight uppercase">Access Restricted</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You do not have permission to view <span className="font-bold text-foreground">IT Assignments</span>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] animate-fade-in pt-4 px-6 space-y-4">
      <div className="flex justify-end items-center gap-2 px-1 shrink-0">
        <button onClick={() => fetchAssignments()} className="p-2.5 bg-muted/50 hover:bg-muted border border-border rounded-xl text-muted-foreground transition-all">
          <Loader2 className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
        </button>

        {canExportAssignments && (
          <button 
            onClick={() => {
              const csv = filteredAssignments
                .map(a => `${a.logCode},${a.asset?.assetTag || a.accessory?.assetTag},${a.employee?.fullName},${a.actionType},${new Date(a.assignedDate).toLocaleDateString()},${a.returnedDate ? new Date(a.returnedDate).toLocaleDateString() : ""}`)
                .join("\n");
              const blob = new Blob(["Log Code,Asset Tag,Employee,Action Type,Assigned Date,Returned Date\n" + csv], { type: "text/csv" });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `assignment-ledger-${new Date().toISOString().split("T")[0]}.csv`;
              a.click();
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-muted/50 hover:bg-muted border border-border rounded-xl text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        )}

        <Link href="/it/assets?flow=provisioning" className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
          <Plus className="w-4 h-4" /> Issue Hardware
        </Link>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        {[
          { label: "Total Events", value: stats.total, icon: RotateCcw, color: "text-foreground bg-muted/50 border-border" },
          { label: "Active Holders", value: stats.active, icon: User, color: "text-primary bg-primary/10 border-primary/20" },
          { label: "Hardware Recovered", value: stats.returned, icon: CheckCircle2, color: "text-green-500 bg-green-500/10 border-green-500/20" },
          { label: "Maintenance Chain", value: stats.inRepair, icon: Wrench, color: "text-accent bg-accent/10 border-accent/20" },
        ].map((stat, i) => (
          <div key={i} className="bg-card border border-border/60 p-4 rounded-2xl flex items-center justify-between group hover:border-primary/30 transition-all">
            <div className="space-y-0.5">
              <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50">{stat.label}</p>
              <h4 className="text-xl font-black">{loading ? "..." : stat.value}</h4>
            </div>
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border border-transparent transition-all", stat.color)}>
              <stat.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Unified Multi-Filter Ribbon */}
      <div className="bg-card/50 border border-border p-1.5 rounded-2xl flex flex-col lg:flex-row gap-2 items-center shrink-0">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="FILTER BY LOG, ASSET, EMPLOYEE..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent pl-11 pr-4 py-2.5 rounded-xl text-[10px] font-bold border border-transparent focus:bg-background outline-none transition-all placeholder:text-[8px] placeholder:font-black placeholder:tracking-widest opacity-80"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <div className="w-full lg:w-48">
            <SearchableSelect
              options={[
                { value: "all", label: "ALL STATUS" },
                { value: "active", label: "ACTIVE" },
                { value: "returned", label: "RETURNED" },
                { value: "repair", label: "IN REPAIR" }
              ]}
              value={statusFilter}
              onChange={(val) => setStatusFilter(val || "all")}
              placeholder="STATUS"
              compact
            />
          </div>

          <div className="w-full lg:w-48">
            <SearchableSelect
              options={[
                { value: "all", label: "ALL ACTIONS" },
                { value: "new_assignment", label: "NEW ASSIGNMENT" },
                { value: "reassignment", label: "REASSIGNMENT" },
                { value: "repair_send", label: "REPAIR SEND" },
                { value: "repair_return", label: "REPAIR RETURN" },
                { value: "recovery_exit", label: "RECOVERY/EXIT" }
              ]}
              value={actionFilter}
              onChange={(val) => setActionFilter(val || "all")}
              placeholder="ACTION TYPE"
              compact
            />
          </div>
        </div>
      </div>

      {/* Registry Container */}
      <div className="flex-1 min-h-0 bg-card border border-border rounded-2xl overflow-hidden flex flex-col shadow-sm">
        <div className="overflow-auto scrollbar-hide flex-1">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-muted/50 backdrop-blur-md border-b border-border/50">
                <th className="pl-6 pr-4 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Log ID</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Asset Identifier</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Stakeholder</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 text-center">Event Type</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 text-center">Issued Date</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 text-center">Recovered Date</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 text-right pr-10">Lifecycle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <AlertCircle className="w-10 h-10 mx-auto mb-4 text-primary/10" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">Ledger Empty</p>
                  </td>
                </tr>
              ) : (
                filteredAssignments.map((log) => {
                  const status = log.returnedDate ? "Returned" : log.actionType === "repair_send" ? "In Repair" : "Active";
                  const statusColor = status === "Returned" ? "text-blue-500" : status === "In Repair" ? "text-amber-500" : "text-green-500";
                  
                  return (
                    <tr key={log.id} className="group hover:bg-white/[0.02] transition-colors border-white/5">
                      {/* ID / Code */}
                      <td className="pl-6 pr-4 py-3">
                        <span className="text-[9px] font-mono font-black text-muted-foreground/40 group-hover:text-primary transition-colors">
                          {log.logCode}
                        </span>
                      </td>

                      {/* Asset Info */}
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center border border-white/5",
                            log.assetCategory === "asset" ? "bg-primary/10 text-primary" : "bg-amber-500/10 text-amber-500"
                          )}>
                            {log.assetCategory === "asset" ? <Monitor className="w-3.5 h-3.5" /> : <HardDrive className="w-3.5 h-3.5" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-black truncate leading-tight">
                              {log.asset?.assetTag ?? log.accessory?.assetTag ?? "-"}
                            </p>
                            <p className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest truncate">
                              {log.assetCategory}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Stakeholder */}
                      <td className="px-4 py-2.5">
                        {log.employee ? (
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center overflow-hidden">
                              {log.employee.photoPath ? (
                                <img src={log.employee.photoPath} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[9px] font-black text-muted-foreground/40 uppercase">
                                  {log.employee.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold truncate leading-tight">{log.employee.fullName}</p>
                              <p className="text-[8px] font-black uppercase text-muted-foreground/30 tracking-widest">{log.employee.employeeCode}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[9px] font-black text-muted-foreground/20 italic uppercase tracking-widest">Inventory Pool</span>
                        )}
                      </td>

                      {/* Event Type */}
                      <td className="px-4 py-3 text-center">
                        <span className={cn(
                          "text-[8px] font-black uppercase px-2 py-0.5 rounded-md border tracking-tighter",
                          getTypeStyle(log.actionType)
                        )}>
                          {log.actionType.replace(/_/g, " ")}
                        </span>
                      </td>

                      {/* Dates */}
                      <td className="px-4 py-3 text-center">
                        <span className="text-[10px] font-bold text-muted-foreground/60">
                          {new Date(log.assignedDate).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: '2-digit' })}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {log.returnedDate ? (
                          <span className="text-[10px] font-bold text-blue-500/60">
                            {new Date(log.returnedDate).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: '2-digit' })}
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/10">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-3 text-right pr-10">
                        <span className={cn("text-[9px] font-black uppercase tracking-widest", statusColor)}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer info strip */}
        <div className="shrink-0 bg-white/[0.02] border-t border-white/5 px-6 py-2 flex items-center justify-between">
          <p className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">
            Immutable Assignment Log · Authorized IT Personnel Only
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest">System Sync Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
