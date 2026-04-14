const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

async function testPrisma() {
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    console.log("Connecting...");
    const user = await prisma.systemUser.findFirst({
      where: {
        OR: [
          { email: { equals: "sonubhagat", mode: 'insensitive' } },
          { username: { equals: "sonubhagat", mode: 'insensitive' } }
        ]
      }
    });
    console.log("Found:", user);
  } catch (err) {
    console.error("Prisma Error:", err);
  }
}

testPrisma();
