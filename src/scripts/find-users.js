const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.systemUser.findMany({
    where: {
      username: { in: ['sonubhagat', 'amitkumar'] }
    },
    select: {
      id: true,
      username: true,
      fullName: true
    }
  });
  console.log(users);
}

main().catch(console.error).finally(() => prisma.$disconnect());
