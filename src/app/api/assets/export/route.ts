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
    await enforcePermission(userId, 'IT', 'ASSETS', 'canExport');

    const assets = await prisma.asset.findMany({
      include: {
        currentEmployee: {
          select: {
            fullName: true,
            employeeCode: true,
            deskNumber: true,
          },
        },
        creator: {
          select: {
            fullName: true,
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
      "MAC Address",
      "IP Address",
      "Connection Type",
      "OS",
      "Processor",
      "RAM (GB)",
      "SSD (GB)",
      "HDD (GB)",
      "Graphics",
      "Antivirus",
      "LAN Ports",
      "Screen Size",
      "Channels",
      "Rack Number",
      "Allotted Area",
      "Installed Cameras",
      "Status",
      "Assigned To",
      "Employee ID",
      "Seat/Desk Number",
      "Notes",
      "System Added By",
      "Created At"
    ];

    // Map data to rows
    const rows = assets.map(asset => {
      return [
        asset.assetTag,
        asset.type.toUpperCase(),
        asset.make || "Generic",
        asset.model || "Standard",
        `#${asset.serialNumber || ""}`, // Prefix with # for Excel
        asset.macAddress || "-",
        asset.ipAddress || "-",
        asset.connectionType || "-",
        asset.os || "-",
        asset.cpu || "-",
        asset.ramGb || "-",
        asset.ssdGb || "-",
        asset.hddGb || "-",
        asset.graphicCard || "-",
        asset.antivirusName ? `${asset.antivirusName} (${asset.antivirusStatus})` : asset.antivirusStatus,
        asset.lanPorts || "-",
        asset.screenSize || "-",
        asset.channel || "-",
        asset.rackNumber || "-",
        asset.allottedArea || "-",
        asset.installedCameras || "-",
        asset.status.toUpperCase(),
        asset.currentEmployee?.fullName || "Unassigned",
        asset.currentEmployee?.employeeCode || "-",
        asset.currentEmployee?.deskNumber || "-",
        asset.notes || "-",
        asset.creator?.fullName || "System",
        asset.createdAt.toISOString().split('T')[0]
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

    // Return as a downloadable file with proper headers
    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Encoding': 'UTF-8',
        'Content-Disposition': `attachment; filename=mams_inventory_report_${new Date().toISOString().split('T')[0]}.csv`,
      },
    });

  } catch (error: any) {
    console.error("Export Error:", error);
    return NextResponse.json({ error: 'Failed to generate export', details: error.message }, { status: 500 });
  }
}
