import {
  UserX,
  Briefcase,
  Calendar,
  Trash2,
  Mail,
  Truck,
  AlertTriangle,
  ShieldAlert,
  RefreshCcw,
  CheckCircle2,
} from "lucide-react";
import prisma from "@/lib/prisma";

// Force dynamic rendering - don't pre-render at build time
export const dynamic = "force-dynamic";

export default async function ExitsPage() {
  const exits = await prisma.employee.findMany({
    where: {
      OR: [{ status: "exit_pending" }, { status: "inactive" }],
    },
    orderBy: { exitDate: "asc" },
    include: {
      currentAssets: { select: { id: true } },
      currentAccessories: { select: { id: true } },
      emailAccounts: {
        where: {
          status: { in: ["active", "suspended"] },
        },
        select: { id: true },
      },
    },
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Employee Exits
          </h2>
          <p className="text-muted-foreground mt-1">
            Offboarding tracking for hardware recovery and identity
            deactivation.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-xl shadow-xl shadow-primary/10 transition-all font-semibold">
            <UserX className="w-5 h-5" />
            <span>Register Exit</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in delay-100">
        {exits.map((exit) => {
          const pendingAssets =
            exit.currentAssets.length + exit.currentAccessories.length;
          const pendingEmail = exit.emailAccounts.length;
          const priority =
            pendingAssets > 0 || pendingEmail > 0 ? "High" : "Normal";

          return (
            <div
              key={exit.id}
              className="premium-card rounded-2xl overflow-hidden glass border-border/50 group flex flex-col h-full bg-card/60 relative overflow-hidden"
            >
              {priority === "High" && (
                <div className="absolute top-0 right-0 p-1.5 bg-red-500 text-white rounded-bl-xl text-[8px] font-black uppercase tracking-tighter shadow-lg transform translate-x-1 -translate-y-1 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform">
                  High Risk Exit
                </div>
              )}

              <div className="p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-muted border border-border flex items-center justify-center text-xl font-black text-muted-foreground group-hover:text-red-500 transition-colors">
                      {exit.fullName[0]}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold tracking-tight group-hover:text-red-500 transition-colors">
                        {exit.fullName}
                      </h4>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-1.5">
                        <Briefcase className="w-3 h-3" />
                        {exit.department || "Unassigned"} · {exit.employeeCode}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-border/50">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Last Working Day
                    </span>
                    <span className="text-xs font-semibold flex items-center gap-1.5 bg-red-500/10 text-red-600 px-3 py-1.5 rounded-xl border border-red-500/20 w-fit">
                      <Calendar className="w-4 h-4" />
                      {exit.exitDate
                        ? new Date(exit.exitDate).toLocaleDateString()
                        : "Not set"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1 p-3 bg-muted rounded-2xl border border-border">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <Truck className="w-3 h-3" />
                        Hardware
                      </span>
                      <span className="text-sm font-semibold flex items-center gap-1.5">
                        {pendingAssets === 0 ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-green-500" />{" "}
                            <span className="text-xs text-green-600 font-bold uppercase">
                              Returned
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 text-accent animate-pulse" />{" "}
                            <span className="text-xs text-accent font-bold uppercase">
                              Pending
                            </span>
                          </>
                        )}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 p-3 bg-muted rounded-2xl border border-border">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <Mail className="w-3 h-3" />
                        Identity
                      </span>
                      <span className="text-sm font-semibold flex items-center gap-1.5">
                        {pendingEmail === 0 ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-green-500" />{" "}
                            <span className="text-xs text-green-600 font-bold uppercase">
                              Deleted
                            </span>
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="w-4 h-4 text-accent animate-pulse" />{" "}
                            <span className="text-xs text-accent font-bold uppercase">
                              Active
                            </span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button className="flex-1 py-2.5 bg-muted/50 hover:bg-muted text-foreground rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                    Full Record
                    <RefreshCcw className="w-4 h-4" />
                  </button>
                  <button className="p-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all border border-red-500/20">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
