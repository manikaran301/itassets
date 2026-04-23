const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        fullName: true,
        photoPath: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    console.log('DEBUG_START');
    console.log(JSON.stringify(employees, null, 2));
    console.log('DEBUG_END');
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
