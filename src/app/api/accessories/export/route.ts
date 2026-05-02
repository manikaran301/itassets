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
    await enforcePermission(userId, 'IT', 'ACCESSORIES', 'canExport');

    const accessories = await prisma.accessory.findMany({
      include: {
        currentEmployee: {
          select: {
            fullName: true,
            employeeCode: true,
          },
        },
      },
      orderBy: {
        assetTag: 'asc',
      },
    });

    // CSV Headers
    const headers = [
      "Asset Tag",
      "Type",
      "Make",
      "Model",
      "Serial Number",
      "Status",
      "Condition",
      "Current User",
      "Employee Code",
      "Purchase Date",
      "Warranty Expiry",
      "Notes"
    ];

    // Map data to rows
    const rows = accessories.map(acc => [
      acc.assetTag,
      acc.type.toUpperCase().replace('_', ' '),
      acc.make || "-",
      acc.model || "-",
      acc.serialNumber || "-",
      acc.status.toUpperCase(),
      acc.condition.toUpperCase().replace('_', ' '),
      acc.currentEmployee?.fullName || "In Store",
      acc.currentEmployee?.employeeCode || "-",
      acc.purchaseDate ? acc.purchaseDate.toISOString().split('T')[0] : "-",
      acc.warrantyExpiry ? acc.warrantyExpiry.toISOString().split('T')[0] : "-",
      acc.notes || "-"
    ]);

    // Construct CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=Accessory_Inventory_${new Date().toISOString().split('T')[0]}.csv`,
      },
    });
  } catch (error) {
    console.error('Accessory export error:', error);
    return NextResponse.json({ error: 'Failed to export accessories' }, { status: 500 });
  }
}
