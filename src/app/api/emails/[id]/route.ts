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
    const { emailAddress, displayName, password, status, accountType, platform, employeeId, forwardingAddresses } = body;

    // Validate email exists
    const existing = await prisma.emailAccount.findUnique({ 
      where: { id },
      include: { forwarding: true }
    });
    
    if (!existing) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    // Update email account and handle forwarding rules
    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update the main account
      const account = await tx.emailAccount.update({
        where: { id },
        data: {
          emailAddress: emailAddress ?? existing.emailAddress,
          displayName: displayName ?? existing.displayName,
          password: password ?? existing.password,
          status: status ?? (existing.status as any),
          accountType: accountType ?? (existing.accountType as any),
          platform: platform ?? (existing.platform as any),
          employeeId: employeeId !== undefined ? employeeId : existing.employeeId,
          updatedAt: new Date(),
        },
      });

      // 2. Handle forwarding rules if provided
      if (forwardingAddresses && Array.isArray(forwardingAddresses)) {
        // Delete existing rules for this account
        await tx.emailForwarding.deleteMany({
          where: { emailAccountId: id }
        });

        // Create new ones
        if (forwardingAddresses.length > 0) {
          await tx.emailForwarding.createMany({
            data: forwardingAddresses.map(addr => ({
              emailAccountId: id,
              forwardToAddress: addr,
              isActive: true,
              createdBy: session.user.id
            }))
          });
        }
      }

      return account;
    });

    // Fetch the fully updated record with inclusions
    const finalRecord = await prisma.emailAccount.findUnique({
      where: { id: updated.id },
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

    return NextResponse.json(finalRecord);
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
