const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    const floors = await prisma.workspace.findMany({
      select: { floor: true },
      distinct: ['floor']
    });
    console.log("Unique floor values in DB:", floors);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
