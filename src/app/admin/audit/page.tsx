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
    <div className="space-y-6 animate-fade-in pt-4">


      <div className="premium-card overflow-hidden rounded-[24px] border border-border bg-card shadow-xl shadow-black/5">
        <AuditLogTable logs={logs} currentPage={page} totalPages={totalPages} />
      </div>
    </div>
  );
}
