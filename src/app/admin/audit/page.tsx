import prisma from "@/lib/prisma";
import { AuditLogTable } from "./AuditLogTable";
import { AuditFilters } from "./AuditFilters";

// Force dynamic rendering - don't pre-render at build time
export const dynamic = "force-dynamic";

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; user?: string; action?: string; role?: string }>;
}) {
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 1;
  const pageSize = 15;
  const skip = (page - 1) * pageSize;

  const whereCondition: any = {};
  
  if (resolvedParams.user) {
    whereCondition.changedBy = resolvedParams.user;
  }
  
  if (resolvedParams.action) {
    // Action is an enum AuditAction, but Prisma can accept strings if they match the enum values
    whereCondition.action = resolvedParams.action;
  }
  
  if (resolvedParams.role) {
    whereCondition.user = {
      role: resolvedParams.role
    };
  }

  const [logs, totalLogs, users] = await Promise.all([
    prisma.auditLog.findMany({
      where: whereCondition,
      skip,
      take: pageSize,
      orderBy: { changedAt: "desc" },
      include: {
        user: {
          select: {
            fullName: true,
            username: true,
            role: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where: whereCondition }),
    prisma.systemUser.findMany({
      select: { id: true, fullName: true, role: true },
      orderBy: { fullName: "asc" }
    })
  ]);

  const totalPages = Math.ceil(totalLogs / pageSize);

  return (
    <div className="space-y-6 animate-fade-in pt-4">
      <AuditFilters users={users} />

      <div className="premium-card overflow-hidden rounded-[24px] border border-border bg-card shadow-xl shadow-black/5">
        <AuditLogTable logs={logs} currentPage={page} totalPages={totalPages} />
      </div>
    </div>
  );
}
