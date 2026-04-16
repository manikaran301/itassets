import { Users, ShieldCheck, Mail, Laptop, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import prisma from "@/lib/prisma";

// Force dynamic rendering - don't pre-render at build time
export const dynamic = "force-dynamic";

// Calculate the date 120 days ago for filtering recent joiners
const DAYS_THRESHOLD = 120;
const getJoinersCutoffDate = () => {
  const now = new Date();
  now.setDate(now.getDate() - DAYS_THRESHOLD);
  return now;
};

export default async function JoinersPage() {
  const cutoffDate = getJoinersCutoffDate();

  const joiners = await prisma.employee.findMany({
    where: {
      status: "active",
      startDate: {
        gte: cutoffDate,
      },
    },
    orderBy: { startDate: "desc" },
    include: {
      assetRequirements: true,
      emailAccounts: {
        where: { status: "active" },
        select: { id: true },
      },
    },
    take: 50,
  });

  return (
    <div className="space-y-6 animate-fade-in text-sm relative pb-20">
      {/* 🚀 EXPLANER: WHAT IS THIS PAGE? */}
      <div className="bg-primary/5 border border-primary/10 rounded-[28px] p-6 mb-8 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden group">
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-primary/10 rounded-full blur-[80px]" />
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shrink-0 group-hover:rotate-6 transition-transform">
          <Users className="w-8 h-8" />
        </div>
        <div className="space-y-1 text-center md:text-left">
          <h2 className="text-xl font-bold tracking-tight">
            Onboarding Tracker: How it Works
          </h2>
          <p className="text-xs text-muted-foreground/80 font-medium leading-relaxed max-w-3xl">
            This page tracks the **Onboarding Progress** for every employee you
            just added. It shows you if their **Hardware** is ready, if their
            **Seat** is assigned, and if their **Email Account** is created.
            Until all 4 bars turn green, they stay in this "New Joiner"
            pipeline.
          </p>
        </div>
      </div>

      {/* Header Pipeline Definitions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: ShieldCheck,
            label: "Identity",
            desc: "HR Verification",
            color: "primary",
          },
          {
            icon: Laptop,
            label: "Hardware",
            desc: "IT Asset Dispatch",
            color: "secondary",
          },
          {
            icon: MapPin,
            label: "Seating",
            desc: "Desk Allocation",
            color: "accent",
          },
          {
            icon: Mail,
            label: "Access",
            desc: "Email Generation",
            color: "green-500",
          },
        ].map((step, i) => (
          <div
            key={i}
            className="p-4 rounded-[20px] bg-card border border-white/5 flex items-center gap-4 hover:border-white/10 transition-colors"
          >
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                `bg-${step.color}/10 text-${step.color}`,
              )}
            >
              <step.icon className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40 leading-none">
                {step.label}
              </p>
              <p className="text-xs font-black">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Table */}
      <div className="premium-card rounded-[32px] overflow-hidden glass border border-white/5 shadow-2xl relative mt-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                  Employee Identity
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                  Joining Location
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 text-center">
                  Current Fulfillment Pipeline (Status)
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 text-right font-mono italic">
                  Joining on
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {joiners.map((joiner) => {
                const hardwareReady = joiner.assetRequirements.some(
                  (req) => req.status === "fulfilled",
                );
                const hardwarePending = joiner.assetRequirements.some(
                  (req) =>
                    req.status === "pending" || req.status === "approved",
                );
                const steps = {
                  identity: "Ready",
                  hardware: hardwareReady
                    ? "Ready"
                    : hardwarePending
                      ? "Awaiting IT"
                      : "Pending",
                  seating: joiner.deskNumber ? "Allocated" : "No Seat ID",
                  access: joiner.emailAccounts.length > 0 ? "Ready" : "Pending",
                };

                return (
                  <tr
                    key={joiner.id}
                    className="group hover:bg-white/[0.005] transition-all"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm border border-primary/10 group-hover:scale-110 transition-all duration-500">
                          {joiner.fullName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-black group-hover:text-primary transition-colors">
                            {joiner.fullName}
                          </p>
                          <p className="text-[9px] font-black tracking-widest opacity-20 uppercase">
                            {joiner.department || "Unassigned"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <p className="text-xs font-black text-foreground/80">
                          {joiner.locationJoining || "Not set"}
                        </p>
                        <p className="text-[10px] font-mono font-black text-secondary/60 uppercase tracking-tighter italic">
                          SEAT: {joiner.deskNumber || "PENDING"}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {/* 🚥 EXPLICIT STATUS PILLS */}
                      <div className="flex items-center justify-between gap-2 max-w-[500px] mx-auto">
                        {Object.entries(steps).map(([key, label]) => (
                          <div
                            key={key}
                            className="flex flex-col items-center gap-2 flex-1"
                          >
                            <p className="text-[7px] font-black uppercase tracking-[0.1em] opacity-40 text-center truncate w-full">
                              {key}
                            </p>
                            <div
                              className={cn(
                                "w-full px-2 py-1 rounded-[10px] text-[9px] font-black text-center border transition-all truncate",
                                label === "Ready" || label === "Allocated"
                                  ? "bg-green-500/10 border-green-500/20 text-green-500"
                                  : label === "Procuring" ||
                                      label === "Pending" ||
                                      label === "Awaiting IT"
                                    ? "bg-primary/10 border-primary/20 text-primary animate-pulse"
                                    : label === "Skip"
                                      ? "bg-muted/10 border-white/5 opacity-30 text-muted-foreground line-through"
                                      : "bg-red-500/10 border-red-500/20 text-red-500",
                              )}
                            >
                              {label}
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <p className="text-xs font-black text-foreground font-mono">
                        {new Date(joiner.startDate).toLocaleDateString()}
                      </p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/20 italic">
                        Day 0 Deadline
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
