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
    <div className="space-y-6 animate-fade-in pt-4">
      {/* Action Row */}
      <div className="flex justify-end px-1">
        <button
          onClick={() => {
            const csv = filteredAssignments
              .map(
                (a) =>
                  `${a.logCode},${a.asset?.assetTag || a.accessory?.assetTag},${a.employee?.fullName},${a.actionType},${new Date(a.assignedDate).toLocaleDateString()},${a.returnedDate ? new Date(a.returnedDate).toLocaleDateString() : ""}`,
              )
              .join("\n");
            const blob = new Blob(
              [
                "Log Code,Asset Tag,Employee,Action Type,Assigned Date,Returned Date\n" +
                  csv,
              ],
              { type: "text/csv" },
            );
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `assignment-ledger-${new Date().toISOString().split("T")[0]}.csv`;
            a.click();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-muted/50 text-muted-foreground hover:bg-muted rounded-xl border border-border/50 transition-all font-black uppercase text-[10px] tracking-widest shadow-sm"
          title="Export to CSV"
        >
          <Download className="w-4 h-4" />
          Export Data
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-4 border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                Total Logs
              </p>
              <p className="text-2xl font-black tracking-tighter mt-2">
                {stats.total}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-2xl p-4 border border-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                Active
              </p>
              <p className="text-2xl font-black tracking-tighter mt-2">
                {stats.active}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-2xl p-4 border border-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                Returned
              </p>
              <p className="text-2xl font-black tracking-tighter mt-2">
                {stats.returned}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <RotateCcw className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-2xl p-4 border border-accent/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                In Repair
              </p>
              <p className="text-2xl font-black tracking-tighter mt-2">
                {stats.inRepair}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Wrench className="w-6 h-6 text-accent" />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters - Inline */}
      <div className="flex flex-col lg:flex-row gap-3 items-end">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
          <input
            type="text"
            placeholder="Search log code, asset tag, employee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-card/40 border border-white/5 pl-12 pr-4 py-3 rounded-xl outline-none focus:border-primary/30 transition-all text-sm"
          />
        </div>

        {/* Status Filter */}
        <div className="w-full lg:w-48 relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-card/40 border border-white/5 pl-12 pr-4 py-3 rounded-xl outline-none focus:border-primary/30 transition-all text-sm appearance-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="returned">Returned</option>
            <option value="repair">In Repair</option>
          </select>
        </div>

        {/* Action Filter */}
        <div className="w-full lg:w-56 relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full bg-card/40 border border-white/5 pl-12 pr-4 py-3 rounded-xl outline-none focus:border-primary/30 transition-all text-sm appearance-none cursor-pointer"
          >
            <option value="all">All Actions</option>
            <option value="new_assignment">New Assignment</option>
            <option value="reassignment">Reassignment</option>
            <option value="repair_send">Repair Send</option>
            <option value="repair_return">Repair Return</option>
            <option value="recovery_exit">Recovery/Exit</option>
          </select>
        </div>
      </div>

      <div className="premium-card rounded-2xl overflow-hidden glass border-border/50 animate-fade-in delay-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Log Code
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Asset & Category
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Assigned To
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Action Type
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Assigned Date
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Returned Date
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredAssignments.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <AlertCircle className="w-8 h-8 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    No assignment logs found
                  </p>
                </td>
              </tr>
            ) : (
              filteredAssignments.map((log) => {
                const status = log.returnedDate
                  ? "Returned"
                  : log.actionType === "repair_send"
                    ? "In Repair"
                    : "Active";

                return (
                  <tr
                    key={log.id}
                    className="hover:bg-muted/20 transition-all group"
                  >
                    <td className="px-6 py-5">
                      <span className="text-xs font-mono font-bold bg-muted px-2 py-1 rounded border border-border group-hover:bg-primary/10 transition-colors uppercase">
                        {log.logCode}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center text-primary">
                          {log.assetCategory === "asset" ? (
                            <Monitor className="w-4 h-4" />
                          ) : (
                            <HardDrive className="w-4 h-4" />
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-sm font-bold tracking-tight">
                            {log.asset?.assetTag ??
                              log.accessory?.assetTag ??
                              "-"}
                          </p>
                          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                            {log.assetCategory}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {log.employee ? (
                        <div className="flex items-center gap-3">
                          <div className="relative group/avatar">
                            {log.employee.photoPath ? (
                              <img 
                                src={log.employee.photoPath} 
                                alt={log.employee.fullName}
                                className="w-8 h-8 rounded-xl object-cover border border-white/10 group-hover/avatar:scale-110 transition-transform shadow-lg"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-[9px] font-black text-secondary uppercase group-hover/avatar:scale-110 transition-transform">
                                {log.employee.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-[11px] font-black uppercase tracking-tight leading-none mb-1">{log.employee.fullName}</p>
                            <p className="text-[8px] opacity-40 font-black uppercase tracking-widest">{log.employee.employeeCode}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-muted-foreground/30 italic">Unassigned Pool</span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={cn(
                          "text-[10px] uppercase font-black px-3 py-1 rounded-full border shadow-sm whitespace-nowrap",
                          getTypeStyle(log.actionType),
                        )}
                      >
                        {log.actionType.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                        <Clock className="w-3 h-3" />
                        {new Date(log.assignedDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {log.returnedDate ? (
                        <div className="flex items-center gap-2 text-xs text-blue-600 font-medium">
                          <RotateCcw className="w-3 h-3" />
                          {new Date(log.returnedDate).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        {status === "Returned" ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-semibold text-blue-600 uppercase">
                              Returned
                            </span>
                          </>
                        ) : status === "In Repair" ? (
                          <>
                            <Wrench className="w-4 h-4 text-accent" />
                            <span className="text-xs font-semibold text-accent uppercase">
                              In Repair
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-green-600" />
                            <span className="text-xs font-semibold text-green-600 uppercase">
                              Active
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
