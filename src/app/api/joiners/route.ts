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
          select: { id: true, assetType: true, status: true },
        },
        currentAssets: {
          select: { id: true },
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

    // Compute onboarding status - keep all for frontend filtering
    const result = joiners.map((joiner) => {
      const hardwareReqs = joiner.assetRequirements;
      const hasHardwareReq = hardwareReqs.length > 0;
      // fulfilled if requirement is fulfilled OR they already have an asset
      const hardwareFulfilled = hardwareReqs.some((r) => r.status === 'fulfilled') || joiner.currentAssets.length > 0;
      const hardwarePending = hardwareReqs.some(
        (r) => r.status === 'pending' || r.status === 'approved'
      );

      // Check if email has been assigned from IT/Email system
      const hasEmail = joiner.emailAccounts.length > 0;

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
            // ✓ Email status updates automatically when email is assigned in IT/Email section
            status: hasEmail ? 'ready' : 'pending',
            label: hasEmail ? 'Ready' : 'Pending',
          },
        },
        provisioningRequests: joiner.provisioningRequests,
        // Fully onboarded if they have hardware, email, AND seating all assigned
        isFullyOnboarded: hardwareFulfilled && hasEmail && !!joiner.deskNumber,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Joiners fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch joiners' }, { status: 500 });
  }
}
