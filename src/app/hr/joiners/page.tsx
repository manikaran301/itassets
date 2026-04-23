"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Users,
  ShieldCheck,
  Mail,
  Laptop,
  MapPin,
  Loader2,
  SendHorizonal,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PipelineStep {
  status: string;
  label: string;
}

interface Joiner {
  id: string;
  employeeCode: string;
  fullName: string;
  department: string | null;
  companyName: string | null;
  locationJoining: string | null;
  deskNumber: string | null;
  startDate: string | null;
  photoPath: string | null;
  createdAt: string;
  pipeline: {
    identity: PipelineStep;
    hardware: PipelineStep;
    seating: PipelineStep;
    access: PipelineStep;
  };
  provisioningRequests: {
    id: string;
    requestCode: string;
    deviceTypeNeeded: string | null;
    specialRequirements: string | null;
    status: string;
  }[];
  isFullyOnboarded: boolean;
}

export default function JoinersPage() {
  const { data: session } = useSession();
  const [joiners, setJoiners] = useState<Joiner[]>([]);
  const [loading, setLoading] = useState(true);
  const [raising, setRaising] = useState<string | null>(null);

  useEffect(() => {
    fetchJoiners();
  }, []);

  const fetchJoiners = async () => {
    try {
      const res = await fetch("/api/joiners");
      const data = await res.json();
      setJoiners(data);
    } catch (error) {
      console.error("Failed to fetch joiners:", error);
    } finally {
      setLoading(false);
    }
  };

  const raiseRequest = async (
    employeeId: string,
    type: "laptop" | "desktop" | "email",
  ) => {
    const userId = (session?.user as { id?: string })?.id;
    if (!userId) {
      alert("Session error. Please log in again.");
      return;
    }

    setRaising(`${employeeId}-${type}`);
    try {
      const payload: Record<string, unknown> = {
        employeeId,
        requestedBy: userId,
        priority: "normal",
      };

      if (type === "email") {
        payload.specialRequirements = "Email account provisioning";
      } else {
        payload.deviceTypeNeeded = type;
      }

      const res = await fetch("/api/provisioning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to raise request");
        return;
      }

      await fetchJoiners();
    } catch {
      alert("Something went wrong");
    } finally {
      setRaising(null);
    }
  };

  const getStatusStyle = (status: string) => {
    if (status === "ready")
      return "bg-green-500/10 border-green-500/20 text-green-500";
    if (status === "awaiting_it")
      return "bg-blue-500/10 border-blue-500/20 text-blue-500 animate-pulse";
    if (status === "pending")
      return "bg-amber-500/10 border-amber-500/20 text-amber-500";
    return "bg-muted/10 border-white/10 text-muted-foreground";
  };

  const getStatusIcon = (status: string) => {
    if (status === "ready") return CheckCircle2;
    if (status === "awaiting_it") return Clock;
    return AlertCircle;
  };

  // Check if a request type already exists for this joiner
  const hasRequest = (joiner: Joiner, type: string) => {
    return joiner.provisioningRequests.some(
      (r) => r.deviceTypeNeeded === type && r.status !== "cancelled",
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] animate-fade-in text-sm">
      {/* Header */}
      <div className="shrink-0 pb-4 space-y-4">
        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              Onboarding Tracker
            </h2>
            <p className="text-xs text-muted-foreground/70 max-w-2xl">
              Track new joiners (last 120 days). Raise provisioning requests for
              Hardware & Email — IT picks them up on the Provisioning page.
            </p>
          </div>
        </div>

        {/* Pipeline Legend */}
        <div className="grid grid-cols-4 gap-3">
          {[
            {
              icon: ShieldCheck,
              label: "Identity",
              desc: "HR Verified",
              color: "text-green-500 bg-green-500/10",
            },
            {
              icon: Laptop,
              label: "Hardware",
              desc: "IT Asset",
              color: "text-primary bg-primary/10",
            },
            {
              icon: MapPin,
              label: "Seating",
              desc: "Desk Alloc.",
              color: "text-amber-500 bg-amber-500/10",
            },
            {
              icon: Mail,
              label: "Access",
              desc: "Email Setup",
              color: "text-blue-500 bg-blue-500/10",
            },
          ].map((step, i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-card border border-white/10 flex items-center gap-3"
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  step.color,
                )}
              >
                <step.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                  {step.label}
                </p>
                <p className="text-[11px] font-bold">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table — fills remaining space */}
      <div className="flex-1 min-h-0 bg-card/40 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-auto h-full">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-white/10 bg-card">
                <th className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 bg-card">
                  Employee
                </th>
                <th className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 bg-card">
                  Location
                </th>
                <th className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 bg-card text-center">
                  Onboarding Pipeline
                </th>
                <th className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 bg-card text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {joiners.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-16 text-center text-muted-foreground/50"
                  >
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-bold">
                      No new joiners in the last 120 days
                    </p>
                  </td>
                </tr>
              ) : (
                joiners.map((joiner) => {
                  const steps = joiner.pipeline;
                  return (
                    <tr
                      key={joiner.id}
                      className={cn(
                        "group hover:bg-white/[0.02] transition-all",
                        joiner.isFullyOnboarded && "opacity-60",
                      )}
                    >
                      {/* Employee */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs border border-primary/10 overflow-hidden shrink-0">
                            {joiner.photoPath ? (
                              <img 
                                src={joiner.photoPath} 
                                alt={joiner.fullName} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              joiner.fullName[0]
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold group-hover:text-primary transition-colors">
                              {joiner.fullName}
                            </p>
                            <p className="text-[10px] text-muted-foreground/50 font-bold uppercase tracking-widest">
                              {joiner.employeeCode} ·{" "}
                              {joiner.companyName || "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-5 py-4">
                        <p className="text-xs font-bold text-foreground/80">
                          {joiner.locationJoining || "—"}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground/40 uppercase">
                          Seat: {joiner.deskNumber || "Pending"}
                        </p>
                      </td>

                      {/* Pipeline Status */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2 max-w-[480px] mx-auto">
                          {(
                            Object.entries(steps) as [string, PipelineStep][]
                          ).map(([key, step]) => {
                            const Icon = getStatusIcon(step.status);
                            return (
                              <div
                                key={key}
                                className="flex flex-col items-center gap-1.5 flex-1"
                              >
                                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
                                  {key}
                                </p>
                                <div
                                  className={cn(
                                    "w-full px-2 py-1.5 rounded-lg text-[9px] font-black text-center border flex items-center justify-center gap-1",
                                    getStatusStyle(step.status),
                                  )}
                                >
                                  <Icon className="w-3 h-3" />
                                  {step.label}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* Raise Hardware Request */}
                          {steps.hardware.status !== "ready" &&
                            !hasRequest(joiner, "laptop") && (
                              <button
                                onClick={() =>
                                  raiseRequest(joiner.id, "laptop")
                                }
                                disabled={raising === `${joiner.id}-laptop`}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border border-primary/20 disabled:opacity-50"
                              >
                                {raising === `${joiner.id}-laptop` ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Laptop className="w-3 h-3" />
                                )}
                                Hardware
                              </button>
                            )}

                          {/* Raise Email Request */}
                          {steps.access.status !== "ready" &&
                            !joiner.provisioningRequests.some(
                              (r) =>
                                r.specialRequirements ===
                                  "Email account provisioning" &&
                                r.status !== "cancelled",
                            ) && (
                              <button
                                onClick={() => raiseRequest(joiner.id, "email")}
                                disabled={raising === `${joiner.id}-email`}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border border-blue-500/20 disabled:opacity-50"
                              >
                                {raising === `${joiner.id}-email` ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Mail className="w-3 h-3" />
                                )}
                                Email
                              </button>
                            )}

                          {/* All done */}
                          {joiner.isFullyOnboarded && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-500 rounded-lg text-[10px] font-bold uppercase">
                              <CheckCircle2 className="w-3 h-3" />
                              Complete
                            </span>
                          )}

                          {/* Show pending request codes */}
                          {joiner.provisioningRequests.filter(
                            (r) =>
                              r.status === "pending" ||
                              r.status === "in_progress",
                          ).length > 0 &&
                            !joiner.isFullyOnboarded && (
                              <span className="text-[9px] text-muted-foreground/50 font-bold">
                                <SendHorizonal className="w-3 h-3 inline mr-1" />
                                {
                                  joiner.provisioningRequests.filter(
                                    (r) =>
                                      r.status === "pending" ||
                                      r.status === "in_progress",
                                  ).length
                                }{" "}
                                pending
                              </span>
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
    </div>
  );
}
