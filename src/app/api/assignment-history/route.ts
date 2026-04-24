import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assignments = await prisma.assignmentHistory.findMany({
      orderBy: { assignedDate: 'desc' },
      include: {
        employee: { select: { id: true, fullName: true, employeeCode: true, photoPath: true } },
        asset: { select: { id: true, assetTag: true } },
        accessory: { select: { id: true, assetTag: true } },
      },
    });

    return NextResponse.json(assignments);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
  }
}

// Generate unique log code: ASG-YYYYMMDD-XXXX
async function generateLogCode(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `ASG-${dateStr}`;

  const lastLog = await prisma.assignmentHistory.findFirst({
    where: { logCode: { startsWith: prefix } },
    orderBy: { logCode: 'desc' },
  });

  let seq = 1;
  if (lastLog) {
    const lastSeq = parseInt(lastLog.logCode.split('-').pop() || '0');
    seq = lastSeq + 1;
  }

  return `${prefix}-${seq.toString().padStart(4, '0')}`;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      assetId,
      accessoryId,
      employeeId,
      actionType,
      assignedDate,
      notes,
    } = body;

    if (!employeeId || !actionType) {
      return NextResponse.json(
        { error: 'employeeId and actionType are required' },
        { status: 400 }
      );
    }

    const logCode = await generateLogCode();
    const assetCategory = assetId ? 'asset' : 'accessory';

    const log = await prisma.assignmentHistory.create({
      data: {
        logCode,
        assetId: assetId || null,
        accessoryId: accessoryId || null,
        assetCategory,
        employeeId,
        actionType,
        assignedDate: assignedDate ? new Date(assignedDate) : new Date(),
        notes: notes || null,
      },
      include: {
        employee: { select: { fullName: true } },
        asset: { select: { assetTag: true } },
        accessory: { select: { assetTag: true } },
      },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error('Assignment history create error:', error);
    return NextResponse.json(
      { error: 'Failed to create assignment log' },
      { status: 500 }
    );
  }
}
