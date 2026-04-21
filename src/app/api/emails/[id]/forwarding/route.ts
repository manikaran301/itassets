import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

// GET /api/emails/[id]/forwarding — list forwarding addresses
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const forwarding = await prisma.emailForwarding.findMany({
      where: { emailAccountId: id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(forwarding);
  } catch (error) {
    console.error('Forwarding fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch forwarding rules' }, { status: 500 });
  }
}

// POST /api/emails/[id]/forwarding — add a forwarding address
export async function POST(
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
    const { forwardToAddress, forwardType = 'copy' } = body;

    if (!forwardToAddress || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forwardToAddress)) {
      return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 });
    }

    // Check if email account exists
    const account = await prisma.emailAccount.findUnique({ where: { id } });
    if (!account) {
      return NextResponse.json({ error: 'Email account not found' }, { status: 404 });
    }

    // Check for duplicate
    const existing = await prisma.emailForwarding.findFirst({
      where: { emailAccountId: id, forwardToAddress },
    });
    if (existing) {
      return NextResponse.json({ error: 'This forwarding address already exists' }, { status: 409 });
    }

    const forwarding = await prisma.emailForwarding.create({
      data: {
        emailAccountId: id,
        forwardToAddress,
        forwardType: forwardType as 'copy' | 'redirect',
        isActive: true,
      },
    });

    // Ensure forwardingEnabled flag is true on the account
    await prisma.emailAccount.update({
      where: { id },
      data: { forwardingEnabled: true },
    });

    return NextResponse.json(forwarding, { status: 201 });
  } catch (error) {
    console.error('Forwarding create error:', error);
    return NextResponse.json({ error: 'Failed to add forwarding address' }, { status: 500 });
  }
}

// DELETE /api/emails/[id]/forwarding — remove a forwarding address (pass forwardingId in body)
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
    const body = await request.json();
    const { forwardingId } = body;

    if (!forwardingId) {
      return NextResponse.json({ error: 'forwardingId is required' }, { status: 400 });
    }

    await prisma.emailForwarding.delete({ where: { id: forwardingId } });

    // Update forwardingEnabled flag based on remaining rules
    const remaining = await prisma.emailForwarding.count({ where: { emailAccountId: id } });
    await prisma.emailAccount.update({
      where: { id },
      data: { forwardingEnabled: remaining > 0 },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forwarding delete error:', error);
    return NextResponse.json({ error: 'Failed to remove forwarding address' }, { status: 500 });
  }
}
