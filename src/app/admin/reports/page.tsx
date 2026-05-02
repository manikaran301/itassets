import {
  Activity,
  Briefcase,
  HardDrive,
  Laptop,
  Mail,
  Monitor,
  ShieldCheck,
  Users,
  TrendingUp,
  History,
  LayoutDashboard,
} from "lucide-react";
import prisma from "@/lib/prisma";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ReportChartsWrapper } from "@/components/ReportChartsWrapper";

// Force dynamic rendering - don't pre-render at build time
export const dynamic = "force-dynamic";

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
      take: 10,
      orderBy: { changedAt: "desc" },
      select: {
        id: true,
        action: true,
        entityType: true,
        changedAt: true,
      },
    }),
  ]);

  const assetStatusCounts = {
    available: assets.filter((asset) => asset.status === "available").length,
    assigned: assets.filter((asset) => asset.status === "assigned").length,
    inRepair: assets.filter((asset) => asset.status === "in_repair").length,
    retired: assets.filter((asset) => asset.status === "retired").length,
  };

  const assetDistribution = [
    { label: "Available", value: assetStatusCounts.available },
    { label: "Assigned", value: assetStatusCounts.assigned },
    { label: "In Repair", value: assetStatusCounts.inRepair },
    { label: "Retired", value: assetStatusCounts.retired },
  ];

  const activeEmployees = employees.filter(
    (employee) => employee.status === "active",
  ).length;
  const activeEmails = emails.filter(
    (email) => email.status === "active",
  ).length;
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
    .slice(0, 5);

  const metricCards = [
    {
      label: "Inventory Assets",
      value: assets.length,
      detail: `${assetStatusCounts.available} units ready for deployment`,
      icon: HardDrive,
      trend: "+4.2%",
      color: "text-primary bg-primary/10",
    },
    {
      label: "Workforce",
      value: employees.length,
      detail: `${activeEmployees} active on platform`,
      icon: Users,
      trend: "+1.8%",
      color: "text-secondary bg-secondary/10",
    },
    {
      label: "Identities",
      value: emails.length,
      detail: `${activeEmails} active communication channels`,
      icon: Mail,
      trend: "Steady",
      color: "text-accent bg-accent/10",
    },
    {
      label: "System Health",
      value: "99.8%",
      detail: "All services operational",
      icon: Activity,
      trend: "Optimal",
      color: "text-green-500 bg-green-500/10",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Premium Page Header */}
      <div className="relative group p-8 rounded-[32px] bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 border border-white/5 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.5em] text-primary/60">
               <TrendingUp className="w-4 h-4" />
               <span>Infrastructure Intelligence</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
              Analytics <span className="text-muted-foreground/20 italic font-medium">Dashboard</span>
            </h1>
            <p className="text-sm text-muted-foreground font-medium max-w-md leading-relaxed">
              Global resource overview and lifecycle signals for HR, IT, and System Administrative domains.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-background/50 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">System Live Status</span>
          </div>
        </div>
      </div>

      {/* High-Impact KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card) => (
          <div
            key={card.label}
            className="premium-card rounded-3xl border border-border bg-card p-6 relative overflow-hidden group transition-all hover:shadow-2xl hover:shadow-primary/5"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={cn("p-3 rounded-2xl", card.color)}>
                <card.icon className="h-5 w-5" />
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-1 rounded-lg">
                {card.trend}
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-black tracking-tighter leading-none">
                {card.value}
              </h3>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                {card.label}
              </p>
            </div>
            <p className="text-[10px] font-medium text-muted-foreground/40 mt-4 pt-4 border-t border-border/50">
              {card.detail}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Analytics Block */}
        <div className="xl:col-span-2 space-y-6">
          <ReportChartsWrapper 
            assetDistribution={assetDistribution} 
            deviceMix={deviceMix} 
            departmentSpread={departmentMix} 
          />
        </div>

        {/* Sidebar Insights */}
        <aside className="space-y-6">
          {/* Department Utilization Card */}
          <div className="premium-card rounded-[32px] border border-border bg-card p-8 shadow-xl">
             <div className="flex items-center justify-between mb-8">
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-3">
                 <Briefcase className="w-4 h-4 text-primary" /> Department Distribution
               </h3>
               <Link 
                href="/hr/employees?dept=Unassigned" 
                className="text-[9px] font-black uppercase text-primary hover:underline flex items-center gap-1.5"
               >
                 Fix Data <LayoutDashboard className="w-3 h-3" />
               </Link>
             </div>
             <div className="space-y-6">
               {departmentMix.map(([dept, count], idx) => {
                 const total = employees.length || 1;
                 const pct = Math.round((count / total) * 100);
                 return (
                   <div key={dept} className="space-y-2">
                     <div className="flex justify-between items-center px-1">
                       <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[150px]">{dept}</span>
                       <span className="text-[10px] font-black text-primary">{pct}%</span>
                     </div>
                     <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                       <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          idx === 0 ? "bg-primary" : idx === 1 ? "bg-secondary" : "bg-accent"
                        )} 
                        style={{ width: `${pct}%` }} 
                       />
                     </div>
                   </div>
                 );
               })}
             </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
