import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { enforcePermission } from '@/lib/permissions';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await enforcePermission(userId, 'IT', 'EMAILS', 'canView');

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
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await enforcePermission(userId, 'IT', 'EMAILS', 'canEdit');

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
          emailAddress: emailAddress || existing.emailAddress,
          displayName: displayName || existing.displayName,
          password: password !== undefined ? password : existing.password,
          status: (status || existing.status) as any,
          accountType: (accountType || existing.accountType) as any,
          platform: (platform || existing.platform) as any,
          employeeId: employeeId === undefined ? existing.employeeId : (employeeId || null),
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

    // AUTO-FULFILL PROVISIONING REQUEST
    if (finalRecord) {
      const effectiveEmployeeId = employeeId || finalRecord.employeeId;
      
      if (effectiveEmployeeId && finalRecord.status === 'active') {
      try {
        // Find matching provisioning request
        // Broaden the search: any pending/in_progress request that mentions "email" 
        // OR any request with null deviceType that might be an email request
        const pendingReq = await prisma.provisioningRequest.findFirst({
          where: {
            employeeId: effectiveEmployeeId,
            status: { in: ['pending', 'in_progress'] },
            OR: [
              { specialRequirements: { contains: 'email', mode: 'insensitive' } },
              { specialRequirements: { contains: 'mail', mode: 'insensitive' } },
              { specialRequirements: { contains: 'access', mode: 'insensitive' } },
              // If it's a generic request and we just assigned an email, it's likely a match
              { AND: [{ deviceTypeNeeded: null }, { specialRequirements: null }] }
            ]
          }
        });

        if (pendingReq) {
          await prisma.provisioningRequest.update({
            where: { id: pendingReq.id },
            data: {
              status: 'fulfilled',
              fulfilledBy: (session.user as any).id || null,
              fulfilledAt: new Date(),
              notes: (pendingReq.notes || '') + `\nAuto-fulfilled via email assignment (${finalRecord.emailAddress})`
            }
          });
          
          console.log(`Auto-fulfilled provisioning request ${pendingReq.requestCode} for employee ${effectiveEmployeeId}`);
        }
      } catch (autoFulfillError) {
        console.error('Email auto-fulfillment error:', autoFulfillError);
      }
    }
  }

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
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await enforcePermission(userId, 'IT', 'EMAILS', 'canDelete');

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
