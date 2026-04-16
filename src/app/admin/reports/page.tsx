import {
  Activity,
  Briefcase,
  Clock3,
  HardDrive,
  Laptop,
  Mail,
  Monitor,
  ShieldCheck,
  Users,
} from "lucide-react";
import prisma from "@/lib/prisma";
import { cn } from "@/lib/utils";

const deviceIcons = {
  laptop: Laptop,
  desktop: Monitor,
  n_computing: Monitor,
  nuc: HardDrive,
  server: ShieldCheck,
  other: Briefcase,
} as const;

export default async function ReportsPage() {
  const [assets, employees, emails, users, auditLogs] = await Promise.all([
    prisma.asset.findMany({
      select: {
        id: true,
        type: true,
        status: true,
      },
    }),
    prisma.employee.findMany({
      select: {
        id: true,
        department: true,
        status: true,
      },
    }),
    prisma.emailAccount.findMany({
      select: {
        id: true,
        status: true,
        platform: true,
      },
    }),
    prisma.systemUser.findMany({
      select: {
        id: true,
        role: true,
        isActive: true,
      },
    }),
    prisma.auditLog.findMany({
      take: 8,
      orderBy: { changedAt: "desc" },
      select: {
        id: true,
        action: true,
        entityType: true,
      },
    }),
  ]);

  const assetStatusCounts = {
    available: assets.filter((asset) => asset.status === "available").length,
    assigned: assets.filter((asset) => asset.status === "assigned").length,
    inRepair: assets.filter((asset) => asset.status === "in_repair").length,
    retired: assets.filter((asset) => asset.status === "retired").length,
  };

  const activeEmployees = employees.filter(
    (employee) => employee.status === "active",
  ).length;
  const activeEmails = emails.filter((email) => email.status === "active").length;
  const activeUsers = users.filter((user) => user.isActive).length;

  const deviceMix = Object.entries(
    assets.reduce<Record<string, number>>((accumulator, asset) => {
      accumulator[asset.type] = (accumulator[asset.type] ?? 0) + 1;
      return accumulator;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  const departmentMix = Object.entries(
    employees.reduce<Record<string, number>>((accumulator, employee) => {
      const department = employee.department || "Unassigned";
      accumulator[department] = (accumulator[department] ?? 0) + 1;
      return accumulator;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const emailPlatforms = Object.entries(
    emails.reduce<Record<string, number>>((accumulator, email) => {
      accumulator[email.platform] = (accumulator[email.platform] ?? 0) + 1;
      return accumulator;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  const roleMix = Object.entries(
    users.reduce<Record<string, number>>((accumulator, user) => {
      accumulator[user.role] = (accumulator[user.role] ?? 0) + 1;
      return accumulator;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  const metricCards = [
    {
      label: "Asset Footprint",
      value: assets.length,
      detail: `${assetStatusCounts.assigned} assigned right now`,
      icon: HardDrive,
      color: "text-primary bg-primary/10 border-primary/15",
    },
    {
      label: "Active Workforce",
      value: activeEmployees,
      detail: `${employees.length} total employee records`,
      icon: Users,
      color: "text-secondary bg-secondary/10 border-secondary/15",
    },
    {
      label: "Mailbox Coverage",
      value: activeEmails,
      detail: `${emails.length} total communication identities`,
      icon: Mail,
      color: "text-accent bg-accent/10 border-accent/15",
    },
    {
      label: "Control Accounts",
      value: activeUsers,
      detail: `${users.length} platform users configured`,
      icon: ShieldCheck,
      color: "text-foreground bg-muted border-border",
    },
  ];

  return (
    <div className="space-y-4 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card/50 backdrop-blur-xl px-5 py-3 shadow-sm">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
            Executive Overview
          </p>
          <div className="flex items-baseline gap-2">
            <h1 className="text-xl font-black tracking-tighter">Insights & Trends</h1>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Live snapshot</p>
          <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest leading-none">From production records</p>
        </div>
      </div>

      {/* KPI Top Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metricCards.map((card) => (
          <div key={card.label} className="premium-card rounded-xl border border-border bg-card p-4 relative overflow-hidden group">
            <div className={cn("absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-10 blur-xl group-hover:scale-150 transition-transform duration-500", card.color)} />
            <div className="flex items-center gap-3">
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg border shadow-sm", card.color)}>
                <card.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xl font-black tracking-tight leading-none">{card.value}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-1">{card.label}</p>
              </div>
            </div>
            <p className="text-[9px] font-semibold text-muted-foreground/60 mt-3 border-t border-border/50 pt-2">{card.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Main Column */}
        <section className="xl:col-span-2 space-y-4">
          
          {/* Asset Lifecycle Dense View */}
          <div className="premium-card rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Activity className="h-3.5 w-3.5 text-primary mb-1" />
                <h3 className="text-xs font-black uppercase tracking-widest">Asset Lifecycle Pulse</h3>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Available", value: assetStatusCounts.available, tone: "border-green-500/20 bg-green-500/5 text-green-600" },
                { label: "Assigned", value: assetStatusCounts.assigned, tone: "border-primary/20 bg-primary/5 text-primary" },
                { label: "In Repair", value: assetStatusCounts.inRepair, tone: "border-accent/20 bg-accent/5 text-accent" },
                { label: "Retired", value: assetStatusCounts.retired, tone: "border-border bg-muted/50 text-muted-foreground" },
              ].map((item) => (
                <div key={item.label} className={cn("rounded-lg border p-3 flex flex-col items-center justify-center text-center", item.tone)}>
                  <p className="text-xl font-black tracking-tighter leading-none">{item.value}</p>
                  <p className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-80">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Device Mix Dense Grid */}
          <div className="premium-card rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <HardDrive className="h-3.5 w-3.5 text-secondary mb-1" />
                <h3 className="text-xs font-black uppercase tracking-widest">Hardware Portfolio</h3>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {deviceMix.length === 0 ? (
                <p className="text-[10px] text-muted-foreground italic col-span-3">No assets available yet.</p>
              ) : (
                deviceMix.map(([type, count]) => {
                  const Icon = deviceIcons[type as keyof typeof deviceIcons] ?? Briefcase;
                  const percentage = Math.round((count / assets.length) * 100) || 0;
                  return (
                    <div key={type} className="rounded-lg border border-border/50 bg-muted/10 p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary">
                          <Icon className="h-3 w-3" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-wider leading-tight">{type.replaceAll("_", " ")}</p>
                          <p className="text-[8px] font-bold text-muted-foreground">{percentage}% of active</p>
                        </div>
                      </div>
                      <p className="text-sm font-black">{count}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </section>

        {/* Sidebar Insights */}
        <aside className="space-y-4">
          
          <div className="premium-card rounded-xl border border-border bg-card p-4">
            <h3 className="text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2"><Briefcase className="w-3.5 h-3.5 text-accent"/> Department Spread</h3>
            <div className="space-y-1.5">
              {departmentMix.map(([department, count]) => (
                <div key={department} className="flex items-center justify-between rounded p-2 border border-transparent hover:border-border/50 hover:bg-muted/30 transition-colors">
                  <p className="text-[10px] font-bold tracking-widest uppercase">{department}</p>
                  <p className="text-xs font-black">{count}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="premium-card rounded-xl border border-border bg-card p-4">
              <h3 className="text-[9px] font-black uppercase tracking-widest mb-3 text-muted-foreground">Platforms</h3>
              <div className="space-y-1">
                {emailPlatforms.map(([platform, count]) => (
                  <div key={platform} className="flex justify-between items-center py-1 border-b border-border/50 last:border-0">
                    <p className="text-[9px] font-bold uppercase truncate pr-2" title={platform}>{platform.replace("_", " ")}</p>
                    <p className="text-[10px] font-black">{count}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="premium-card rounded-xl border border-border bg-card p-4">
              <h3 className="text-[9px] font-black uppercase tracking-widest mb-3 text-muted-foreground">App Roles</h3>
              <div className="space-y-1">
                {roleMix.map(([role, count]) => (
                  <div key={role} className="flex justify-between items-center py-1 border-b border-border/50 last:border-0">
                    <p className="text-[9px] font-bold uppercase truncate pr-2">{role}</p>
                    <p className="text-[10px] font-black">{count}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="premium-card rounded-xl border border-border bg-card p-4">
            <h3 className="text-[9px] font-black uppercase tracking-widest mb-3 text-muted-foreground border-b border-border/50 pb-2">Recent System Activity</h3>
            <div className="space-y-2 mt-2">
              {auditLogs.map((log) => (
                <div key={log.id.toString()} className="flex items-center gap-2">
                  <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", 
                    log.action === 'created' ? 'bg-green-500' : 
                    log.action === 'deleted' ? 'bg-red-500' : 'bg-primary'
                  )} />
                  <p className="text-[9px] font-bold text-muted-foreground truncate flex-1">
                    <span className="uppercase text-foreground">{log.action.replaceAll("_", " ")}</span> on {log.entityType.replaceAll("_", " ")}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </aside>
      </div>
    </div>
  );
}
