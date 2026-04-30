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
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [assignments, setAssignments] = useState<AssignmentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");

  useEffect(() => {
    fetchAssignments();
  }, []);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] animate-fade-in pt-4 px-6 space-y-4">
      {/* Header & Stats Strip */}
      <div className="shrink-0 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
            <RotateCcw className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tight leading-none">Assignment Ledger</h1>
            <p className="text-[10px] font-bold text-muted-foreground/50 mt-1 uppercase tracking-widest">Tracking {stats.total} lifecycle events</p>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {[
            { label: "Active", count: stats.active, color: "text-green-500", bg: "bg-green-500/10" },
            { label: "Returned", count: stats.returned, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "Repair", count: stats.inRepair, color: "text-amber-500", bg: "bg-amber-500/10" }
          ].map(s => (
            <div key={s.label} className={cn("px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-3", s.bg)}>
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">{s.label}</span>
              <span className={cn("text-xs font-black", s.color)}>{s.count}</span>
            </div>
          ))}
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
            className="ml-2 p-2 bg-muted/30 hover:bg-muted/50 rounded-lg border border-white/5 transition-all"
            title="Export Ledger"
          >
            <Download className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="shrink-0 bg-card/40 border border-white/5 p-1.5 rounded-2xl flex flex-col md:flex-row gap-2 items-center">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="FILTER BY LOG, ASSET, EMPLOYEE..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent pl-11 pr-4 py-2 rounded-xl text-[10px] font-bold border border-transparent focus:bg-background/40 outline-none transition-all placeholder:text-[8px] placeholder:font-black placeholder:tracking-widest"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-muted/20 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/5 focus:border-primary/30 outline-none cursor-pointer min-w-[120px]"
          >
            <option value="all">ALL STATUS</option>
            <option value="active">ACTIVE</option>
            <option value="returned">RETURNED</option>
            <option value="repair">IN REPAIR</option>
          </select>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-muted/20 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/5 focus:border-primary/30 outline-none cursor-pointer min-w-[140px]"
          >
            <option value="all">ALL ACTIONS</option>
            <option value="new_assignment">NEW ASSIGNMENT</option>
            <option value="reassignment">REASSIGNMENT</option>
            <option value="repair_send">REPAIR SEND</option>
            <option value="repair_return">REPAIR RETURN</option>
            <option value="recovery_exit">RECOVERY/EXIT</option>
          </select>
        </div>
      </div>

      {/* Concise Table Container */}
      <div className="flex-1 min-h-0 bg-card/20 border border-white/5 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
        <div className="overflow-auto scrollbar-hide flex-1">
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="sticky top-0 z-10 bg-[#0f1115]/95 backdrop-blur-md">
              <tr className="border-b border-white/5">
                <th className="w-[12%] px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">ID</th>
                <th className="w-[20%] px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Asset Info</th>
                <th className="w-[20%] px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Stakeholder</th>
                <th className="w-[15%] px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Event</th>
                <th className="w-[12%] px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Assigned</th>
                <th className="w-[12%] px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Returned</th>
                <th className="w-[9%] px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 text-right pr-6">Status</th>
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
                      <td className="px-4 py-2.5">
                        <span className="text-[9px] font-mono font-bold text-muted-foreground/40 group-hover:text-primary transition-colors">
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
                      <td className="px-4 py-2.5">
                        <span className={cn(
                          "text-[8px] font-black uppercase px-2 py-0.5 rounded-md border tracking-tighter",
                          getTypeStyle(log.actionType)
                        )}>
                          {log.actionType.replace(/_/g, " ")}
                        </span>
                      </td>

                      {/* Dates */}
                      <td className="px-4 py-2.5">
                        <span className="text-[10px] font-bold text-muted-foreground/60">
                          {new Date(log.assignedDate).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: '2-digit' })}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        {log.returnedDate ? (
                          <span className="text-[10px] font-bold text-blue-500/60">
                            {new Date(log.returnedDate).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: '2-digit' })}
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/10">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-2.5 text-right pr-6">
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
