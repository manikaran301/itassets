import prisma from "@/lib/prisma";
import { AuditLogTable } from "./AuditLogTable";

// Force dynamic rendering - don't pre-render at build time
export const dynamic = "force-dynamic";

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = Number(searchParams.page) || 1;
  const pageSize = 15;
  const skip = (page - 1) * pageSize;

  const [logs, totalLogs] = await Promise.all([
    prisma.auditLog.findMany({
      skip,
      take: pageSize,
      orderBy: { changedAt: "desc" },
      include: {
        user: {
          select: {
            fullName: true,
            username: true,
          },
        },
      },
    }),
    prisma.auditLog.count(),
  ]);

  const totalPages = Math.ceil(totalLogs / pageSize);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card/50 backdrop-blur-xl px-6 py-4 shadow-sm">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
            Immutable log
          </p>
          <div className="flex items-baseline gap-2">
            <h1 className="text-2xl font-black tracking-tighter">
              {totalLogs}
            </h1>
            <span className="text-[10px] font-bold text-muted-foreground/40 uppercase">
              Total entries
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-primary">Live stream</p>
          <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest leading-none">
            Latest 50 updates
          </p>
        </div>
      </div>

      <div className="premium-card overflow-hidden rounded-[24px] border border-border bg-card shadow-xl shadow-black/5">
        <AuditLogTable logs={logs} currentPage={page} totalPages={totalPages} />
      </div>
    </div>
  );
}
