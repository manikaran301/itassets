import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { enforcePermission } from '@/lib/permissions';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await enforcePermission(userId, 'IT', 'EMAILS', 'canExport');

    const emails = await prisma.emailAccount.findMany({
      include: {
        employee: {
          select: {
            fullName: true,
            employeeCode: true,
          },
        },
        creator: {
          select: {
            fullName: true,
          },
        },
        forwarding: {
          where: { isActive: true },
          select: { forwardToAddress: true }
        }
      },
      orderBy: {
        emailAddress: 'asc',
      },
    });

    // CSV Headers
    const headers = [
      "Email Address",
      "Display Name",
      "Password",
      "Account Type",
      "Platform",
      "Status",
      "Assigned To",
      "Employee Code",
      "Forwarding To",
      "Created By",
      "Created At"
    ];

    // Map data to rows
    const rows = emails.map(email => {
      const forwardingStr = email.forwarding.map(f => f.forwardToAddress).join('; ');
      return [
        email.emailAddress,
        email.displayName,
        email.password || "-",
        email.accountType.toUpperCase(),
        email.platform.toUpperCase(),
        email.status.toUpperCase(),
        email.employee?.fullName || "Shared/Other",
        email.employee?.employeeCode || "-",
        forwardingStr || "None",
        email.creator?.fullName || "System",
        email.createdAt.toISOString().split('T')[0]
      ];
    });

    // Format as CSV content
    const csvRows = [
      headers.join(","),
      ...rows.map(row => 
        row.map(cell => {
          const content = String(cell).replace(/"/g, '""');
          return `"${content}"`;
        }).join(",")
      )
    ];

    const csvContent = "\ufeff" + csvRows.join("\r\n");

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Encoding': 'UTF-8',
        'Content-Disposition': `attachment; filename=mams_email_report_${new Date().toISOString().split('T')[0]}.csv`,
      },
    });

  } catch (error: any) {
    console.error("Export Error:", error);
    return NextResponse.json({ error: 'Failed to generate export', details: error.message }, { status: 500 });
  }
}
