import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const assetTag = '50HERTZDL-PC150';
  console.log('--- ASSET CHECK ---');
  const asset = await prisma.asset.findFirst({
    where: { assetTag: { equals: assetTag, mode: 'insensitive' } },
  });
  console.log('Asset:', JSON.stringify(asset, null, 2));

  if (asset?.currentEmployeeId) {
    const emp = await prisma.employee.findUnique({
      where: { id: asset.currentEmployeeId },
      include: { workspace: true }
    });
    console.log('Employee:', JSON.stringify(emp, null, 2));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
