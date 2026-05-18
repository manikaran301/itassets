import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { id?: string; role?: string } | undefined;

    if (!user?.id || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const userId = resolvedParams.id;

    const companyAccess = await prisma.userCompanyAccess.findMany({
      where: { userId },
      select: { companyId: true }
    });

    const companyIds = companyAccess.map(a => a.companyId);

    return NextResponse.json({ companyIds });
  } catch (error) {
    console.error('Failed to fetch company access:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
