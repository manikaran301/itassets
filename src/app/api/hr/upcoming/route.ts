import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
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

    const [upcoming, total] = await Promise.all([
      prisma.upcomingJoining.findMany({
        orderBy: { joiningDate: 'asc' },
        ...(take > 0 ? { skip, take } : {}),
      }),
      prisma.upcomingJoining.count(),
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
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      joiningLocation 
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
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Create upcoming error:', error);
    return NextResponse.json({ error: 'Failed to create upcoming joining record' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      statusReason
    } = body;

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
        statusReason
      },
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error('Update upcoming error:', error);
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await prisma.upcomingJoining.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete upcoming error:', error);
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 });
  }
}
