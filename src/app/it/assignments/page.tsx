import {
  Plus,
  Monitor,
  HardDrive,
  User,
  Clock,
  MoreVertical,
  ExternalLink,
  CheckCircle2,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import prisma from "@/lib/prisma";

// Force dynamic rendering - don't pre-render at build time
export const dynamic = "force-dynamic";

export default async function AssignmentsPage() {
  const assignments = await prisma.assignmentHistory.findMany({
    orderBy: { assignedDate: "desc" },
    include: {
      employee: { select: { fullName: true } },
      asset: { select: { assetTag: true } },
      accessory: { select: { assetTag: true } },
    },
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

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-end">
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-xl shadow-xl shadow-primary/10 transition-all font-semibold">
            <Plus className="w-5 h-5" />
            <span>New Log</span>
          </button>
        </div>
      </div>

      <div className="bg-card p-4 rounded-2xl premium-card border-border/50">
        <p className="text-xs text-muted-foreground font-semibold">
          Showing {assignments.length} assignment logs from live database
          records.
        </p>
      </div>

      <div className="premium-card rounded-2xl overflow-hidden glass border-border/50 shadow-2xl animate-fade-in delay-100">
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
                Date
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground text-right border-l border-border/10">
                Quick Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {assignments.map((log) => {
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
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center">
                        <User className="w-3 h-3 text-secondary" />
                      </div>
                      <span className="text-sm font-medium">
                        {log.employee.fullName}
                      </span>
                    </div>
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
                  <td className="px-6 py-5 border-l border-border/10 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="p-2 hover:bg-primary/10 hover:text-primary rounded-lg transition-all"
                        title={status}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      {status === "Returned" ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : status === "In Repair" ? (
                        <Wrench className="w-4 h-4 text-accent" />
                      ) : (
                        <MoreVertical className="w-4 h-4" />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
