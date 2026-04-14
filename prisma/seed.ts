import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 1. Clear existing data (in reverse order of dependencies)
  console.log('Cleaning existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.emailForwarding.deleteMany();
  await prisma.emailAccount.deleteMany();
  await prisma.assignmentHistory.deleteMany();
  await prisma.provisioningRequest.deleteMany();
  await prisma.employeeAssetRequirement.deleteMany();
  await prisma.accessory.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.systemUser.deleteMany();

  console.log('Seeding fresh enterprise data...');

  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  // 2. Seed System Users (IT/Admin)
  const masterAdmin = await prisma.systemUser.create({
    data: {
      fullName: 'Master Admin',
      username: 'masteradmin',
      email: 'admin@mams.com',
      passwordHash: hashedPassword,
      companyName: 'MAMS',
      role: 'admin',
    },
  });
  const hrUser = await prisma.systemUser.create({
    data: {
      fullName: 'HR Jane',
      username: 'janehr',
      email: 'jane.hr@mams.com',
      passwordHash: hashedPassword,
      companyName: 'MAMS',
      role: 'hr',
    },
  });
  const itUser = await prisma.systemUser.create({
    data: {
      fullName: 'IT Ramesh',
      username: 'rameshit',
      email: 'ramesh.it@mams.com',
      passwordHash: hashedPassword,
      companyName: 'MAMS',
      role: 'it',
    },
  });

  // 3. Seed Employees (HR)
  const ceo = await prisma.employee.create({
    data: {
      employeeCode: 'CEO-001',
      fullName: 'Vikram Sarabhai',
      personalEmail: 'vikram@personal.com',
      personalPhone: '9876543210',
      department: 'Leadership',
      designation: 'CEO',
      locationJoining: 'HQ-Bengaluru',
      deskNumber: 'OFFICE-01',
      startDate: new Date('2020-01-01'),
      status: 'active',
      createdBy: masterAdmin.id,
    },
  });

  const engineeringHead = await prisma.employee.create({
    data: {
      employeeCode: 'DIR-001',
      fullName: 'Rahul Sharma',
      personalEmail: 'rahul.eng@personal.com',
      personalPhone: '9888877777',
      department: 'Engineering',
      designation: 'Director of Engineering',
      reportingManagerId: ceo.id,
      locationJoining: 'HQ-Bengaluru',
      deskNumber: 'F2-D01',
      startDate: new Date('2021-05-15'),
      status: 'active',
      createdBy: masterAdmin.id,
    },
  });

  const dev = await prisma.employee.create({
    data: {
      employeeCode: 'EMP-102',
      fullName: 'Anjali Gupta',
      personalEmail: 'anjali.g@personal.com',
      personalPhone: '9999911111',
      department: 'Engineering',
      designation: 'Senior Developer',
      reportingManagerId: engineeringHead.id,
      locationJoining: 'HQ-Bengaluru',
      deskNumber: 'F2-D12',
      startDate: new Date('2023-11-20'),
      status: 'active',
      createdBy: hrUser.id,
    },
  });

  // 4. Employee Asset Requirements (HR -> IT)
  await prisma.employeeAssetRequirement.createMany({
    data: [
      { employeeId: dev.id, assetType: 'laptop', quantity: 1, specialNotes: 'Required MacBook Pro M3', status: 'fulfilled' },
      { employeeId: dev.id, assetType: 'phone', quantity: 1, specialNotes: 'iPhone 15 Pro', status: 'pending' },
    ],
  });

  // 5. Assets (IT)
  const laptop = await prisma.asset.create({
    data: {
      assetTag: 'LPT-2301',
      type: 'laptop',
      make: 'Apple',
      model: 'MacBook Pro M3 Max',
      serialNumber: 'SN-APPLE-8822',
      macAddress: '00:1A:2B:3C:4D:5E',
      cpu: 'M3 Max 14-core',
      ramGb: "64",
      ssdGb: 1024,
      status: 'assigned',
      currentEmployeeId: dev.id,
      cost: 320000.00,
    },
  });

  await prisma.asset.create({
    data: {
      assetTag: 'DSK-9901',
      type: 'desktop',
      make: 'Dell',
      model: 'Optiplex 7000',
      serialNumber: 'SN-DELL-P092',
      status: 'available',
      cost: 85000.00,
    },
  });

  // 6. Accessories (IT)
  const mouse = await prisma.accessory.create({
    data: {
      assetTag: 'ACC-M012',
      type: 'mouse',
      make: 'Logitech',
      model: 'MX Master 3S',
      serialNumber: 'SN-LOGI-M1',
      status: 'assigned',
      currentEmployeeId: dev.id,
      condition: 'excellent',
    },
  });

  // 7. Assignment History (IT - Append-only)
  await prisma.assignmentHistory.create({
    data: {
      logCode: 'LOG-88001',
      assetId: laptop.id,
      assetCategory: 'asset',
      actionType: 'new_assignment',
      employeeId: dev.id,
      assignedBy: itUser.id,
      assignedDate: new Date(),
      notes: 'Initial assignment for Senior Developer onboarding.',
    }
  });

  // 8. Provisioning Requests (HR -> IT Workflow)
  await prisma.provisioningRequest.create({
    data: {
      requestCode: 'REQ-OCT-001',
      employeeId: dev.id,
      requestedBy: hrUser.id,
      priority: 'urgent',
      dueDate: new Date('2026-10-25'),
      status: 'fulfilled',
      assignedAssetId: laptop.id,
      notes: 'Onboarding completed on schedule.',
    }
  });

  // 9. Email Accounts (IT Identities)
  const emailAcc = await prisma.emailAccount.create({
    data: {
      employeeId: dev.id,
      accountType: 'personal',
      emailAddress: 'anjali.gupta@mams.com',
      displayName: 'Anjali Gupta',
      platform: 'google_workspace',
      status: 'active',
      createdBy: itUser.id,
    }
  });

  // 10. Email Forwarding (IT Rules)
  await prisma.emailForwarding.create({
    data: {
      emailAccountId: emailAcc.id,
      forwardToAddress: 'anjali.g@personal.com',
      forwardType: 'copy',
      isActive: true,
      createdBy: itUser.id,
    }
  });

  // 11. Audit Logs (System History)
  await prisma.auditLog.create({
    data: {
      entityType: 'system_user',
      entityId: masterAdmin.id,
      action: 'created',
      changedBy: masterAdmin.id,
      newValue: { fullName: 'Master Admin', role: 'admin' },
    }
  });

  console.log('Seeding sequence completed successfully! All 10 tables updated.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
