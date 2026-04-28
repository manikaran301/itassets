"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Truck,
  Clock,
  CheckCircle2,
  XCircle,
  UserPlus,
  Monitor,
  Mail,
  Smartphone,
  CreditCard,
  Loader2,
  Play,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProvisioningRequest {
  id: string;
  requestCode: string;
  deviceTypeNeeded: string | null;
  specialRequirements: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  notes: string | null;
  createdAt: string;
  employee: {
    id: string;
    fullName: string;
    employeeCode: string;
    department: string | null;
    designation: string | null;
    companyName: string | null;
    locationJoining: string | null;
    deskNumber: string | null;
    workspace: {
      assets: Array<{ assetTag: string; type: string }>;
      accessories: Array<{ assetTag: string; type: string }>;
    } | null;
  };
  fulfiller: { id: string; fullName: string } | null;
  requester: { id: string; fullName: string } | null;
}

export default function ProvisioningPage() {
  const { data: session } = useSession();
  const [requests, setRequests] = useState<ProvisioningRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/provisioning");
      const data = await res.json();
      setRequests(data);
    } catch (error) {
      console.error("Failed to fetch:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const userId = (session?.user as { id?: string })?.id;
    setUpdating(id);
    try {
      const res = await fetch(`/api/provisioning/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          fulfilledBy: newStatus === "fulfilled" ? userId : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to update");
        return;
      }

      await fetchRequests();
    } catch {
      alert("Something went wrong");
    } finally {
      setUpdating(null);
    }
  };

  const getTypeIcon = (type: string | null): LucideIcon => {
    switch (type) {
      case "laptop":
      case "desktop":
        return Monitor;
      case "phone":
        return Smartphone;
      case "sim":
        return CreditCard;
      default:
        return type ? Truck : Mail;
    }
  };

  const statusColors: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    in_progress: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    fulfilled: "bg-green-500/10 text-green-500 border-green-500/20",
    cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
  };

  const filteredRequests =
    filter === "all" ? requests : requests.filter((r) => r.status === filter);

  const counts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    in_progress: requests.filter((r) => r.status === "in_progress").length,
    fulfilled: requests.filter((r) => r.status === "fulfilled").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] animate-fade-in pt-4">
      {/* Stats + Filter */}
      <div className="shrink-0 pb-4 space-y-4">
        <div className="flex items-center gap-3">
          {[
            { key: "all", label: "All", count: counts.all },
            { key: "pending", label: "Pending", count: counts.pending },
            {
              key: "in_progress",
              label: "In Progress",
              count: counts.in_progress,
            },
            { key: "fulfilled", label: "Fulfilled", count: counts.fulfilled },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                filter === tab.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card/40 border-white/10 text-muted-foreground hover:bg-card/60",
              )}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="flex-1 min-h-0 overflow-auto">
        {filteredRequests.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground/50">
            <Truck className="w-10 h-10 mr-3 opacity-20" />
            <p className="text-sm font-bold">No provisioning requests</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
            {filteredRequests.map((req) => {
              const typeLabel = req.deviceTypeNeeded
                ? req.deviceTypeNeeded
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase())
                : req.specialRequirements || "Other";
              const Icon = getTypeIcon(req.deviceTypeNeeded);
              const isUpdating = updating === req.id;

              return (
                <div
                  key={req.id}
                  className={cn(
                    "rounded-2xl bg-card/60 border-2 border-white/20 group flex flex-col relative overflow-hidden shadow-lg",
                    req.priority === "urgent" && "border-red-500/40",
                  )}
                >
                  {req.priority === "urgent" && (
                    <div className="absolute top-0 right-0 px-2 py-1 bg-red-500 text-white rounded-bl-xl text-[8px] font-black uppercase">
                      Urgent
                    </div>
                  )}

                  <div className="p-4 space-y-3 flex-1">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest truncate">
                          {req.requestCode}
                        </p>
                        <p className="text-sm font-bold mt-0.5 leading-tight truncate">
                          {req.employee.fullName}
                        </p>
                        <p className="text-[9px] text-muted-foreground/65 font-bold">
                          {req.employee.employeeCode} ·{" "}
                          {req.employee.designation || "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="p-2 rounded-lg bg-muted border border-white/10">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <span
                          className={cn(
                            "text-[8px] uppercase font-black px-2 py-1 rounded-full border whitespace-nowrap",
                            statusColors[req.status] ||
                              "bg-muted/10 text-muted-foreground",
                          )}
                        >
                          {req.status.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>

                    {/* Location & Seat - Inline */}
                    <div className="p-2.5 rounded-xl bg-muted/20 border-2 border-white/15 space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="text-[9px] font-bold text-muted-foreground/75 truncate">
                          {req.employee.locationJoining || "Location TBD"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-[10px] font-black text-foreground/85">
                          Seat:{" "}
                          <span
                            className={
                              req.employee.deskNumber
                                ? "text-primary"
                                : "text-amber-500"
                            }
                          >
                            {req.employee.deskNumber || "⚠️ Not Assigned"}
                          </span>
                        </div>
                        {req.employee.workspace && (req.employee.workspace.assets.length > 0 || req.employee.workspace.accessories.length > 0) && (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/20">
                            <span className="text-[7px] font-black uppercase text-primary animate-pulse">Hardware Detected</span>
                          </div>
                        )}
                      </div>

                      {/* Ghost Inventory List (IT Only View) */}
                      {req.employee.workspace && (req.employee.workspace.assets.length > 0 || req.employee.workspace.accessories.length > 0) && (
                        <div className="pt-2 mt-2 border-t border-white/5 space-y-1.5">
                          <p className="text-[7px] font-black uppercase text-muted-foreground/40 tracking-widest">Pre-Provisioned Stock</p>
                          <div className="flex flex-wrap gap-1">
                            {req.employee.workspace.assets.map(a => (
                              <span key={a.assetTag} className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[7px] font-bold text-foreground/70">
                                💻 {a.assetTag}
                              </span>
                            ))}
                            {req.employee.workspace.accessories.map(a => (
                              <span key={a.assetTag} className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[7px] font-bold text-foreground/70">
                                ⌨️ {a.assetTag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Type & Company - Row */}
                    <div className="flex items-center justify-between gap-2 text-[9px] font-bold">
                      <span className="text-foreground/80">{typeLabel}</span>
                      {req.employee.companyName && (
                        <span className="text-muted-foreground/65 text-right truncate">
                          {req.employee.companyName}
                        </span>
                      )}
                    </div>

                    {/* Meta Row - Compact */}
                    <div className="flex items-center gap-3 text-[8px] font-bold text-muted-foreground/70 uppercase tracking-tight">
                      <div className="flex items-center gap-1">
                        <UserPlus className="w-3 h-3 text-primary" />
                        {req.requester?.fullName || "System"}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500" />
                        {req.dueDate
                          ? new Date(req.dueDate).toLocaleDateString("en-IN")
                          : "No Date"}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons - Compact */}
                  <div className="p-3 pt-0 flex gap-2">
                    {req.status === "pending" && (
                      <button
                        onClick={() => updateStatus(req.id, "in_progress")}
                        disabled={isUpdating}
                        className="flex-1 py-1.5 bg-blue-500 text-white rounded-lg text-[9px] font-black uppercase tracking-tight hover:opacity-90 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {isUpdating ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Play className="w-3 h-3" />
                        )}
                        Start
                      </button>
                    )}
                    {req.status === "in_progress" && (
                      <button
                        onClick={() => updateStatus(req.id, "fulfilled")}
                        disabled={isUpdating}
                        className="flex-1 py-1.5 bg-green-500 text-white rounded-lg text-[9px] font-black uppercase tracking-tight hover:opacity-90 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {isUpdating ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                        Done
                      </button>
                    )}
                    {req.status === "fulfilled" && (
                      <div className="flex-1 py-1.5 bg-green-500/10 text-green-500 rounded-lg text-[9px] font-black uppercase tracking-tight flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3" />✓
                      </div>
                    )}
                    {req.status === "cancelled" && (
                      <div className="flex-1 py-1.5 bg-muted text-red-500/50 rounded-lg text-[9px] font-black uppercase tracking-tight flex items-center justify-center gap-1.5 opacity-50">
                        <XCircle className="w-3 h-3" />✗
                      </div>
                    )}
                    {(req.status === "pending" ||
                      req.status === "in_progress") && (
                      <button
                        onClick={() => {
                          if (confirm("Cancel this request?")) {
                            updateStatus(req.id, "cancelled");
                          }
                        }}
                        disabled={isUpdating}
                        className="px-2.5 py-1.5 bg-red-500/10 text-red-500 rounded-lg text-[9px] font-bold hover:bg-red-500/20 transition-all border border-red-500/20 disabled:opacity-50"
                      >
                        <XCircle className="w-3 h-3" />
                      </button>
                    )}
                    {/* Delete button - always available */}
                    <button
                      onClick={async () => {
                        if (
                          confirm("Delete this request? This cannot be undone.")
                        ) {
                          setUpdating(req.id);
                          try {
                            const res = await fetch(
                              `/api/provisioning/${req.id}`,
                              {
                                method: "DELETE",
                              },
                            );
                            if (!res.ok) {
                              alert("Failed to delete");
                              setUpdating(null);
                              return;
                            }
                            await fetchRequests();
                          } catch {
                            alert("Something went wrong");
                            setUpdating(null);
                          }
                        }
                      }}
                      disabled={isUpdating}
                      className="px-2.5 py-1.5 bg-gray-500/10 text-gray-500 rounded-lg text-[8px] font-bold hover:bg-gray-500/20 transition-all border border-gray-500/20 disabled:opacity-50"
                      title="Delete this request"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
