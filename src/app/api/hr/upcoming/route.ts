import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '../../auth/[...nextauth]/route';
import { enforcePermission } from '@/lib/permissions';
import { getDataScope } from '@/lib/scoping';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await enforcePermission(userId, 'HR', 'REQUIREMENTS', 'canView');
    const scope = await getDataScope();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const record = await prisma.upcomingJoining.findUnique({ where: { id } });
      if (!record) {
        return NextResponse.json({ error: 'Record not found' }, { status: 404 });
      }
      return NextResponse.json(record);
    }

    const skip = parseInt(searchParams.get('skip') || '0');
    const take = parseInt(searchParams.get('take') || '0');
    const search = searchParams.get('search')?.toLowerCase();
    const company = searchParams.get('company');
    const location = searchParams.get('location');
    const status = searchParams.get('status') || 'active_pipeline';
    const period = searchParams.get('period');

    let where: any = {
      ...scope
    };
    
    // Use IDs if available, fallback to names for backward compatibility
    if (scope.companyId) {
      where.companyId = scope.companyId;
    } else if (scope.companyName) {
      where.companyName = scope.companyName;
    }

    if (scope.locationId) {
      where.locationId = scope.locationId;
    } else if (scope.locationName) {
      where.placeOfPosting = scope.locationName;
    }

    // Clean up non-existent fields from where clause
    delete where.companyName; 
    delete where.locationName;
    if (where.companyId && where.companyName) delete where.companyName;
    if (where.locationId && where.placeOfPosting) delete where.placeOfPosting;
    
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { designation: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
        { reportingManager: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (company && company !== 'all') {
      where.companyName = company;
    }

    if (location && location !== 'all') {
      where.placeOfPosting = location;
    }

    if (status === 'active_pipeline') {
      where.status = { not: 'joined' };
    } else if (status && status !== 'all') {
      where.status = status;
    }

    if (period === 'week') {
      const now = new Date();
      const first = now.getDate() - now.getDay() + 1; // Monday
      const last = first + 6;
      const start = new Date(now.setDate(first));
      start.setHours(0,0,0,0);
      const end = new Date(now.setDate(last));
      end.setHours(23,59,59,999);
      where.joiningDate = { gte: start, lte: end };
    } else if (period === 'month') {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      where.joiningDate = { gte: start, lte: end };
    }


    const [upcoming, total] = await Promise.all([
      prisma.upcomingJoining.findMany({
        where,
        orderBy: { joiningDate: 'asc' },
        ...(take > 0 ? { skip, take } : {}),
      }),
      prisma.upcomingJoining.count({ where }),
    ]);

    if (take > 0) {
      return NextResponse.json({
        data: upcoming,
        total,
        hasMore: skip + take < total,
      });
    }

    return NextResponse.json(upcoming);
  } catch (error) {
    console.error('Fetch upcoming error:', error);
    return NextResponse.json({ error: 'Failed to fetch upcoming joiners' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await enforcePermission(userId, 'HR', 'REQUIREMENTS', 'canCreate');

    const body = await request.json();
    const { 
      fullName, 
      designation, 
      department,
      email,
      phoneNumber,
      companyName, 
      reportingManager, 
      joiningDate, 
      experience, 
      placeOfPosting, 
      joiningLocation,
      companyId,
      locationId
    } = body;

    const record = await prisma.upcomingJoining.create({
      data: {
        fullName,
        designation,
        department,
        email,
        phoneNumber,
        companyName,
        reportingManager,
        joiningDate: new Date(joiningDate),
        experience,
        placeOfPosting,
        joiningLocation,
        companyId,
        locationId,
      },
    });

    // Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          entityType: 'upcoming_joining',
          entityId: record.id,
          action: 'created',
          changedBy: userId,
          newValue: JSON.parse(JSON.stringify(record))
        }
      });
    } catch (e) {
      console.error('Audit log failed:', e);
    }

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Create upcoming error:', error);
    return NextResponse.json({ error: 'Failed to create upcoming joining record' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await enforcePermission(userId, 'HR', 'REQUIREMENTS', 'canEdit');

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const body = await request.json();
    const { 
      fullName, 
      designation, 
      department,
      email,
      phoneNumber,
      companyName, 
      reportingManager, 
      joiningDate, 
      experience, 
      placeOfPosting, 
      joiningLocation,
      status,
      statusReason,
      companyId,
      locationId
    } = body;

    const existing = await prisma.upcomingJoining.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const record = await prisma.upcomingJoining.update({
      where: { id },
      data: {
        fullName,
        designation,
        department,
        email,
        phoneNumber,
        companyName,
        reportingManager,
        joiningDate: joiningDate ? new Date(joiningDate) : undefined,
        experience,
        placeOfPosting,
        joiningLocation,
        status,
        statusReason,
        companyId,
        locationId,
      },
    });

    // Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          entityType: 'upcoming_joining',
          entityId: record.id,
          action: status !== existing.status ? 'status_changed' : 'updated',
          changedBy: userId,
          oldValue: JSON.parse(JSON.stringify(existing)),
          newValue: JSON.parse(JSON.stringify(record))
        }
      });
    } catch (e) {
      console.error('Audit log failed:', e);
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error('Update upcoming error:', error);
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await enforcePermission(userId, 'HR', 'REQUIREMENTS', 'canDelete');

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const existing = await prisma.upcomingJoining.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await prisma.upcomingJoining.delete({ where: { id } });

    // Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          entityType: 'upcoming_joining',
          entityId: id,
          action: 'deleted',
          changedBy: userId,
          oldValue: JSON.parse(JSON.stringify(existing))
        }
      });
    } catch (e) {
      console.error('Audit log failed:', e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete upcoming error:', error);
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 });
  }
}
