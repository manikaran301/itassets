const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    const workspaces = await prisma.workspace.findMany({
      where: {
        OR: [
          { floor: '03' },
          { floor: '3' }
        ]
      },
      select: { id: true, code: true, floor: true }
    });
    console.log("3rd Floor Workspaces:", workspaces);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
