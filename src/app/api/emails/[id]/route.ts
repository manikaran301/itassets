import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const email = await prisma.emailAccount.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true
          }
        },
        forwarding: {
          select: {
            id: true,
            forwardToAddress: true,
            forwardType: true,
            isActive: true,
          },
        },
      },
    });

    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    return NextResponse.json(email);
  } catch (error) {
    console.error('Email fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email', details: (error as any).message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { displayName, password, status, accountType } = body;

    // Validate email exists
    const existing = await prisma.emailAccount.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    // Update email account
    const updated = await prisma.emailAccount.update({
      where: { id },
      data: {
        displayName: displayName ?? existing.displayName,
        password: password ?? existing.password,
        status: status ?? existing.status,
        accountType: accountType ?? existing.accountType,
        updatedAt: new Date(),
      },
      include: {
        employee: { select: { id: true, fullName: true, employeeCode: true } },
        forwarding: {
          select: {
            id: true,
            forwardToAddress: true,
            forwardType: true,
            isActive: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Email update error:', error);
    return NextResponse.json(
      { error: 'Failed to update email account' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Forwarding rules are deleted automatically due to onDelete: Cascade in schema

    // Delete email account
    await prisma.emailAccount.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete email account' },
      { status: 500 }
    );
  }
}
