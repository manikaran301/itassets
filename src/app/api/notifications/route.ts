import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

const JOINER_THRESHOLD_DAYS = 120;

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - JOINER_THRESHOLD_DAYS);

    // Count pending provisioning requests
    const pendingProvisioning = await prisma.provisioningRequest.count({
      where: { status: 'pending' },
    });

    // Count in-progress provisioning requests
    const inProgressProvisioning = await prisma.provisioningRequest.count({
      where: { status: 'in_progress' },
    });

    // Count joiners with incomplete pipeline
    const joiners = await prisma.employee.findMany({
      where: {
        status: 'active',
        OR: [
          { startDate: { gte: cutoffDate } },
          { startDate: null, createdAt: { gte: cutoffDate } },
        ],
      },
      select: {
        id: true,
        assetRequirements: { select: { status: true } },
        emailAccounts: { where: { status: 'active' }, select: { id: true } },
        deskNumber: true,
      },
    });

    // Count joiners that need action
    const incompleteJoiners = joiners.filter((j) => {
      const hardwareDone = j.assetRequirements.some((r) => r.status === 'fulfilled');
      const emailDone = j.emailAccounts.length > 0;
      const seatDone = !!j.deskNumber;
      return !(hardwareDone && emailDone && seatDone);
    }).length;

    return NextResponse.json({
      provisioning: {
        pending: pendingProvisioning,
        inProgress: inProgressProvisioning,
        total: pendingProvisioning + inProgressProvisioning,
      },
      joiners: {
        incomplete: incompleteJoiners,
        total: joiners.length,
      },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
