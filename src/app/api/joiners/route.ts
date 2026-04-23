import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

const DAYS_THRESHOLD = 120;

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - DAYS_THRESHOLD);

    // Fetch employees who joined in the last 120 days
    // OR who were created recently (for those without startDate)
    const joiners = await prisma.employee.findMany({
      where: {
        status: 'active',
        OR: [
          { startDate: { gte: cutoffDate } },
          { startDate: null, createdAt: { gte: cutoffDate } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        assetRequirements: {
          select: {
            id: true,
            assetType: true,
            status: true,
          },
        },
        emailAccounts: {
          where: { status: 'active' },
          select: { id: true, emailAddress: true },
        },
        provisioningRequests: {
          select: {
            id: true,
            requestCode: true,
            deviceTypeNeeded: true,
            specialRequirements: true,
            status: true,
            priority: true,
            createdAt: true,
          },
        },
      },
    });

    // Compute onboarding status for each joiner
    const result = joiners.map((joiner) => {
      const hardwareReqs = joiner.assetRequirements;
      const hasHardwareReq = hardwareReqs.length > 0;
      const hardwareFulfilled = hardwareReqs.some((r) => r.status === 'fulfilled');
      const hardwarePending = hardwareReqs.some(
        (r) => r.status === 'pending' || r.status === 'approved'
      );

      const hasProvisioningReqs = joiner.provisioningRequests.length > 0;
      const allProvisioningDone = hasProvisioningReqs && 
        joiner.provisioningRequests.every((r) => r.status === 'fulfilled' || r.status === 'cancelled');

      return {
        id: joiner.id,
        employeeCode: joiner.employeeCode,
        fullName: joiner.fullName,
        department: joiner.department,
        designation: joiner.designation,
        companyName: joiner.companyName,
        locationJoining: joiner.locationJoining,
        deskNumber: joiner.deskNumber,
        startDate: joiner.startDate,
        photoPath: joiner.photoPath,
        createdAt: joiner.createdAt,
        pipeline: {
          identity: { status: 'ready', label: 'Ready' },
          hardware: {
            status: hardwareFulfilled ? 'ready' : hardwarePending ? 'awaiting_it' : hasHardwareReq ? 'pending' : 'not_raised',
            label: hardwareFulfilled ? 'Ready' : hardwarePending ? 'Awaiting IT' : hasHardwareReq ? 'Pending' : 'Not Raised',
          },
          seating: {
            status: joiner.deskNumber ? 'ready' : 'pending',
            label: joiner.deskNumber ? 'Allocated' : 'Pending',
          },
          access: {
            status: joiner.emailAccounts.length > 0 ? 'ready' : 'pending',
            label: joiner.emailAccounts.length > 0 ? 'Ready' : 'Pending',
          },
        },
        provisioningRequests: joiner.provisioningRequests,
        isFullyOnboarded: 
          hardwareFulfilled &&
          !!joiner.deskNumber &&
          joiner.emailAccounts.length > 0,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Joiners fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch joiners' }, { status: 500 });
  }
}
