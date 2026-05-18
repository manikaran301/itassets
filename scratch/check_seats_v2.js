const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const workspaces = await prisma.workspace.findMany({
    select: { code: true, type: true, employee: { select: { fullName: true } } }
  });
  console.log(JSON.stringify(workspaces, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
