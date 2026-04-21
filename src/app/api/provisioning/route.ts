import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requests = await prisma.provisioningRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
            department: true,
            designation: true,
            companyName: true,
            locationJoining: true,
            deskNumber: true,
          },
        },
        fulfiller: { select: { id: true, fullName: true } },
        requester: { select: { id: true, fullName: true } },
      },
    });

    return NextResponse.json(requests);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch provisioning requests' }, { status: 500 });
  }
}

// Generate unique request code: PRV-YYYYMMDD-XXXX
async function generateRequestCode(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `PRV-${dateStr}`;

  const lastReq = await prisma.provisioningRequest.findFirst({
    where: { requestCode: { startsWith: prefix } },
    orderBy: { requestCode: 'desc' },
  });

  let seq = 1;
  if (lastReq) {
    const lastSeq = parseInt(lastReq.requestCode.split('-').pop() || '0');
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
    const { employeeId, requestedBy, deviceTypeNeeded, specialRequirements, priority, dueDate } = body;

    if (!employeeId || !requestedBy) {
      return NextResponse.json({ error: 'employeeId and requestedBy are required' }, { status: 400 });
    }

    const requestCode = await generateRequestCode();

    // Create provisioning request
    const provReq = await prisma.provisioningRequest.create({
      data: {
        requestCode,
        employeeId,
        requestedBy,
        deviceTypeNeeded: deviceTypeNeeded || null,
        specialRequirements: specialRequirements || null,
        priority: priority || 'normal',
        dueDate: dueDate ? new Date(dueDate) : null,
        status: 'pending',
      },
      include: {
        employee: { select: { fullName: true, employeeCode: true } },
      },
    });

    // Also create/update EmployeeAssetRequirement if deviceTypeNeeded is provided
    if (deviceTypeNeeded) {
      await prisma.employeeAssetRequirement.upsert({
        where: {
          employeeId_assetType: {
            employeeId,
            assetType: deviceTypeNeeded,
          },
        },
        create: {
          employeeId,
          assetType: deviceTypeNeeded,
          isRequired: true,
          quantity: 1,
          status: 'pending',
        },
        update: {
          status: 'pending',
          isRequired: true,
        },
      });
    }

    return NextResponse.json(provReq, { status: 201 });
  } catch (error) {
    console.error('Provisioning create error:', error);
    return NextResponse.json({ error: 'Failed to create provisioning request' }, { status: 500 });
  }
}
