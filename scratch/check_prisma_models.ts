import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Prisma models:", Object.keys(prisma).filter(k => !k.startsWith("_") && !k.startsWith("$")));
  try {
    const count = await (prisma as any).userPermission.count();
    console.log("UserPermission count:", count);
  } catch (e: any) {
    console.error("Error accessing userPermission:", e.message);
  }
}

main().finally(() => prisma.$disconnect());
