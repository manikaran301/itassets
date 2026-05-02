import {
  Users,
  Monitor,
  Mail,
  Truck,
  AlertCircle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  History,
  ShieldCheck,
  BarChart3,
  UserPlus,
  UserMinus,
  Calendar,
} from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { cn } from "@/lib/utils";
import prisma from "@/lib/prisma";
import Link from "next/link";

// Force dynamic rendering - don't pre-render at build time
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [
    employeeCount,
    activeEmployeeCount,
    assetCount,
    inRepairAssetCount,
    availableAssetCount,
    provisioningCount,
    pendingProvisioningCount,
    emailCount,
    activeEmailCount,
    noticePeriodCount,
    accessoryCount,
    upcomingJoiningCount,
    upcomingJoiners,
    upcomingExits,
    recentAssignments,
  ] = await Promise.all([
    prisma.employee.count(),
    prisma.employee.count({ where: { status: "active" } }),
    prisma.asset.count(),
    prisma.asset.count({ where: { status: "in_repair" } }),
    prisma.asset.count({ where: { status: "available" } }),
    prisma.provisioningRequest.count(),
    prisma.provisioningRequest.count({ where: { status: "pending" } }),
    prisma.emailAccount.count(),
    prisma.emailAccount.count({ where: { status: "active" } }),
    prisma.employee.count({ where: { status: { in: ["notice_period", "exit_pending"] as any } } }),
    prisma.accessory.count(),
    prisma.upcomingJoining.count({ 
      where: { 
        status: "upcoming",
        joiningDate: {
          gte: new Date(),
          lte: new Date(new Date().setDate(new Date().getDate() + 30))
        }
      } 
    }),
    prisma.upcomingJoining.findMany({
      where: { status: "upcoming" },
      take: 5,
      orderBy: { joiningDate: 'asc' }
    }),
    prisma.employee.findMany({
      where: { status: { in: ["notice_period", "exit_pending"] as any } },
      take: 5,
      orderBy: { exitDate: 'asc' },
      select: { id: true, fullName: true, employeeCode: true, department: true, exitDate: true, status: true }
    }),
    prisma.assignmentHistory.findMany({
      take: 5,
      orderBy: { assignedDate: "desc" },
      include: {
        employee: { select: { fullName: true } },
        asset: { select: { assetTag: true } },
        accessory: { select: { assetTag: true } },
      },
    }),
  ]);

  const alertCards = [
    {
      title: "Assets in Repair",
      desc: `${inRepairAssetCount} assets currently marked in repair.`,
      type: "warning" as const,
      icon: Clock,
    },
    {
      title: "Pending Provisioning",
      desc: `${pendingProvisioningCount} requests need IT action.`,
      type: "danger" as const,
      icon: Cpu,
    },
    {
      title: "Notice Period",
      desc: `${noticePeriodCount} employees exiting. Prepare recovery.`,
      type: "info" as const,
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="space-y-12 max-w-7xl mx-auto">
      <section className="animate-fade-in pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/hr/employees" aria-label="Open workforce employees page" className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
            <StatsCard
              title="Total Workforce"
              value={employeeCount}
              count={`${upcomingJoiningCount} joiners next 30d`}
              description="Active employees and scheduled onboarding pipeline."
              icon={Users}
              trend={upcomingJoiningCount > 0 ? "up" : "neutral"}
              trendValue={upcomingJoiningCount > 0 ? `+${upcomingJoiningCount}` : "Stable"}
              className="border-l-4 border-l-primary h-full cursor-pointer"
            />
          </Link>
          <Link href="/it/assets" aria-label="Open hardware assets page" className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
            <StatsCard
              title="Hardware Stock"
              value={assetCount + accessoryCount}
              count={`${availableAssetCount} ready to deploy`}
              description="Combined inventory of primary assets and accessories."
              icon={Monitor}
              trend="neutral"
              trendValue="Live"
              className="border-l-4 border-l-secondary h-full cursor-pointer"
            />
          </Link>
          <Link href="/it/provisioning" aria-label="Open provisioning page" className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
            <StatsCard
              title="Provisioning"
              value={provisioningCount}
              count={`${pendingProvisioningCount} pending action`}
              description="Active resource fulfillment and logistics queue."
              icon={Truck}
              trend={pendingProvisioningCount > 5 ? "down" : "up"}
              trendValue={pendingProvisioningCount > 5 ? "Busy" : "Clear"}
              className="border-l-4 border-l-accent h-full cursor-pointer"
            />
          </Link>
          <Link href="/it/email" aria-label="Open identities email accounts page" className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
            <StatsCard
              title="Identities"
              value={emailCount}
              count={`${activeEmailCount} active accounts`}
              description="Digital identities and workspace access management."
              icon={Mail}
              trend="neutral"
              trendValue="Secure"
              className="border-l-4 border-l-muted-foreground h-full cursor-pointer"
            />
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fade-in delay-100">
        {/* COLUMN 1: ASSET MOVEMENTS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Recent Movements
            </h3>
            <Link href="/it/assignments" className="text-[10px] font-bold text-primary hover:underline">VIEW ALL</Link>
          </div>
          <div className="glass border border-border/50 rounded-2xl overflow-hidden shadow-sm">
            <div className="divide-y divide-border/50">
              {recentAssignments.map((row) => (
                <div key={row.id} className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between group">
                  <div className="space-y-1">
                    <p className="text-sm font-bold truncate max-w-[150px]">{row.employee.fullName}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono bg-muted px-1.5 py-0.5 rounded border border-border">{row.logCode}</span>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase">{row.asset?.assetTag ?? row.accessory?.assetTag ?? "-"}</span>
                    </div>
                  </div>
                  <span className={cn(
                    "text-[8px] font-black uppercase px-2 py-1 rounded-full",
                    row.actionType === "new_assignment" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
                  )}>
                    {row.actionType.split('_')[0]}
                  </span>
                </div>
              ))}
              {recentAssignments.length === 0 && (
                <div className="p-8 text-center text-muted-foreground/40 text-xs italic">No recent movements</div>
              )}
            </div>
          </div>
        </div>

        {/* COLUMN 2: UPCOMING JOINERS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-green-500" />
              Onboarding Pipeline
            </h3>
            <Link href="/hr/upcoming" className="text-[10px] font-bold text-primary hover:underline">VIEW ALL</Link>
          </div>
          <div className="glass border border-border/50 rounded-2xl overflow-hidden shadow-sm">
            <div className="divide-y divide-border/50">
              {upcomingJoiners.map((joiner) => (
                <div key={joiner.id} className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-bold truncate max-w-[150px]">{joiner.fullName}</p>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">{joiner.department} • {joiner.companyName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-primary">{new Date(joiner.joiningDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase">JOINING</p>
                  </div>
                </div>
              ))}
              {upcomingJoiners.length === 0 && (
                <div className="p-8 text-center text-muted-foreground/40 text-xs italic">No joiners scheduled</div>
              )}
            </div>
          </div>
        </div>

        {/* COLUMN 3: UPCOMING EXITS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <UserMinus className="w-4 h-4 text-red-500" />
              Offboarding / Exits
            </h3>
            <Link href="/hr/exits" className="text-[10px] font-bold text-primary hover:underline">VIEW ALL</Link>
          </div>
          <div className="glass border border-border/50 rounded-2xl overflow-hidden shadow-sm">
            <div className="divide-y divide-border/50">
              {upcomingExits.map((emp: any) => (
                <div key={emp.id} className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-bold truncate max-w-[150px]">{emp.fullName}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">{emp.employeeCode} • {emp.department}</span>
                      <span className={cn(
                        "text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full",
                        emp.status === "notice_period" ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"
                      )}>
                        {emp.status === "notice_period" ? "NOTICE" : "EXIT"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-red-500">
                      {emp.exitDate ? new Date(emp.exitDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'TBD'}
                    </p>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase">LAST DAY</p>
                  </div>
                </div>
              ))}
              {upcomingExits.length === 0 && (
                <div className="p-8 text-center text-muted-foreground/40 text-xs italic">No exits in pipeline</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER ALERTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in delay-200">
        {alertCards.map((alert, i) => (
          <div key={i} className="p-4 rounded-2xl bg-card border border-border premium-card flex items-center gap-4 group">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              alert.type === "warning" ? "bg-accent/10 text-accent" : alert.type === "danger" ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary",
            )}>
              <alert.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{alert.title}</h4>
              <p className="text-xs font-bold leading-tight">{alert.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
