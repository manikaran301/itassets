import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const EmailSchema = z.object({
  emailAddress: z.string().email("Invalid email address").trim(),
  displayName: z.string().min(1, "Display Name is required").trim(),
  employeeId: z.string().uuid("Employee ID must be a valid UUID").optional(),
  employeeCode: z.string().trim().min(1).optional(),
  accountType: z.enum(['personal', 'shared', 'alias', 'distribution', 'service']).default('personal'),
  platform: z.enum(['google_workspace', 'microsoft_365', 'zoho', 'other']),
  status: z.enum(['active', 'suspended', 'deactivated', 'deleted']).default('active'),
  passwordHash: z.string().optional().nullable(),
  forwardingEnabled: z.boolean().default(false),
  createdBy: z.string().uuid().nullable().optional(),
}).superRefine((data, ctx) => {
  if (!data.employeeId && !data.employeeCode) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Either employeeId or employeeCode is required",
      path: ["employeeCode"],
    });
  }
});

export async function GET() {
  try {
    const emails = await prisma.emailAccount.findMany({
      include: {
        employee: true,
      },
      orderBy: {
        emailAddress: 'asc',
      },
    });
    return NextResponse.json(emails);
  } catch (error) {
    console.error('Fetch emails error:', error);
    return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const rawData = await request.json();
    
    // Parse the data
    const validatedResult = EmailSchema.safeParse(rawData);
    if (!validatedResult.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validatedResult.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const data = validatedResult.data;

    // Check if email already exists
    const existing = await prisma.emailAccount.findUnique({
      where: { emailAddress: data.emailAddress }
    });

    if (existing) {
      return NextResponse.json({ error: 'This email address already exists.' }, { status: 409 });
    }

    let resolvedEmployeeId = data.employeeId;

    if (!resolvedEmployeeId && data.employeeCode) {
      const employee = await prisma.employee.findUnique({
        where: { employeeCode: data.employeeCode },
        select: { id: true },
      });

      if (!employee) {
        return NextResponse.json(
          { error: `No employee found for employeeCode: ${data.employeeCode}` },
          { status: 400 },
        );
      }

      resolvedEmployeeId = employee.id;
    }

    if (!resolvedEmployeeId) {
      return NextResponse.json(
        { error: "Could not resolve employee for this email identity." },
        { status: 400 },
      );
    }

    const email = await prisma.emailAccount.create({
      data: {
        emailAddress: data.emailAddress,
        displayName: data.displayName,
        employeeId: resolvedEmployeeId,
        accountType: data.accountType,
        platform: data.platform,
        status: data.status,
        passwordHash: data.passwordHash || null,
        forwardingEnabled: rawData.forwardingAddresses && rawData.forwardingAddresses.length > 0,
        createdBy: data.createdBy || null,
        // Create forwarding records
        forwarding: {
          create: (rawData.forwardingAddresses || []).map((addr: string) => ({
            forwardToAddress: addr,
            forwardType: 'copy',
            isActive: true,
            createdBy: data.createdBy || null,
          }))
        }
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'email_account',
        entityId: email.id,
        action: 'created',
        changedBy: data.createdBy || null,
        newValue: email as any,
      }
    });

    return NextResponse.json(email, { status: 201 });
  } catch (error: any) {
    console.error('Create email error:', error);
    return NextResponse.json({ error: 'Failed to create email account' }, { status: 500 });
  }
}
