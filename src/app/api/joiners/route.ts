import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '../auth/[...nextauth]/route';
import { enforcePermission } from '@/lib/permissions';

const DAYS_THRESHOLD = 120;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await enforcePermission(userId, 'HR', 'JOINERS', 'canView');

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

      // Identity is considered "Ready" if they have an official employeeCode (which old/imported employees do)
      // or if they have provided personal details.
      const hasPersonalDetails = !!joiner.personalEmail && !!joiner.personalPhone;
      const identityComplete = !!joiner.employeeCode || hasPersonalDetails || hasEmail;

      return {
        id: joiner.id,
        employeeCode: joiner.employeeCode,
        fullName: joiner.fullName,
        personalEmail: joiner.personalEmail,
        personalPhone: joiner.personalPhone,
        department: joiner.department,
        designation: joiner.designation,
        companyName: joiner.companyName,
        locationJoining: joiner.locationJoining,
        deskNumber: joiner.deskNumber,
        startDate: joiner.startDate,
        photoPath: joiner.photoPath,
        createdAt: joiner.createdAt,
        pipeline: {
          identity: { 
            status: identityComplete ? 'ready' : 'pending', 
            label: identityComplete ? 'Ready' : 'Pending Details' 
          },
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
        // Fully onboarded if they have hardware, email, seating AND identity all complete
        isFullyOnboarded: identityComplete && hardwareFulfilled && hasEmail && !!joiner.deskNumber,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Joiners fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch joiners' }, { status: 500 });
  }
}
