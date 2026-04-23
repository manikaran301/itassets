import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const employees = await prisma.employee.findMany({
    select: {
      id: true,
      fullName: true,
      photoPath: true,
    },
    take: 5,
  });
  console.log('Last 5 employees:', JSON.stringify(employees, null, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
