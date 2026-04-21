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
    provisioningCount,
    pendingProvisioningCount,
    emailCount,
    activeEmailCount,
    recentAssignments,
  ] = await Promise.all([
    prisma.employee.count(),
    prisma.employee.count({ where: { status: "active" } }),
    prisma.asset.count(),
    prisma.asset.count({ where: { status: "in_repair" } }),
    prisma.provisioningRequest.count(),
    prisma.provisioningRequest.count({ where: { status: "pending" } }),
    prisma.emailAccount.count(),
    prisma.emailAccount.count({ where: { status: "active" } }),
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
      title: "Active Accounts",
      desc: `${activeEmailCount} email identities are active.`,
      type: "info" as const,
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="space-y-12 max-w-7xl mx-auto">
      <section className="animate-fade-in pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Employees"
            value={employeeCount}
            count={`${activeEmployeeCount} active`}
            description="Active workforce tracking across 8 departments."
            icon={Users}
            trend="neutral"
            trendValue="Live"
            className="border-l-4 border-l-primary"
          />
          <StatsCard
            title="Active Assets"
            value={assetCount}
            count={`${inRepairAssetCount} in repair`}
            description="Laptops, desktops, and mobile devices managed."
            icon={Monitor}
            trend="neutral"
            trendValue="Live"
            className="border-l-4 border-l-secondary"
          />
          <StatsCard
            title="Provisioning"
            value={provisioningCount}
            count={`${pendingProvisioningCount} pending`}
            description="Hardware and software setup for new joiners."
            icon={Truck}
            trend="neutral"
            trendValue="Live"
            className="border-l-4 border-l-accent"
          />
          <StatsCard
            title="Email Accounts"
            value={emailCount}
            count={`${activeEmailCount} active`}
            description="Workplace identities managed on Google Workspace."
            icon={Mail}
            trend="neutral"
            trendValue="Live"
            className="border-l-4 border-l-muted-foreground"
          />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-6 animate-fade-in delay-100">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-2 tracking-tight">
              <TrendingUp className="w-5 h-5 text-primary" />
              Recent Asset Movements
            </h3>
            <Link
              href="/it/assignments"
              className="text-xs font-semibold text-primary hover:underline uppercase tracking-widest"
            >
              View All
            </Link>
          </div>

          <div className="premium-card rounded-2xl overflow-hidden glass border-border/50">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Log Code
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Employee
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Asset Tag
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Action
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentAssignments.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-muted/30 transition-colors group cursor-default"
                  >
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono font-semibold bg-muted px-2 py-1 rounded border border-border group-hover:bg-primary/10 transition-colors">
                        {row.logCode}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold ring-1 ring-border shadow-sm">
                          {row.employee.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <span className="text-sm font-medium">
                          {row.employee.fullName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-muted-foreground">
                      {row.asset?.assetTag ?? row.accessory?.assetTag ?? "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "text-[10px] uppercase font-bold px-2 py-1 rounded-full",
                          row.actionType === "new_assignment"
                            ? "bg-primary/10 text-primary"
                            : row.actionType === "reassignment"
                              ? "bg-secondary/10 text-secondary"
                              : "bg-accent/10 text-accent",
                        )}
                      >
                        {row.actionType.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(row.assignedDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-6 animate-fade-in delay-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-2 tracking-tight">
              <AlertCircle className="w-5 h-5 text-accent" />
              Critical Alerts
            </h3>
            <span className="h-2 w-2 rounded-full bg-accent animate-ping" />
          </div>

          <div className="space-y-4">
            {alertCards.map((alert, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-card border border-border premium-card flex gap-4 group"
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    alert.type === "warning"
                      ? "bg-accent/10 text-accent"
                      : alert.type === "danger"
                        ? "bg-red-500/10 text-red-500"
                        : "bg-primary/10 text-primary",
                  )}
                >
                  <alert.icon className="w-5 h-5 group-hover:scale-125 transition-transform" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold uppercase tracking-wide">
                    {alert.title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {alert.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
