import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const result = await prisma.asset.updateMany({
    where: {
      createdBy: 'cc60bbc7-d2d4-4c80-b16e-0024a8d6772b' // sonubhagat
    },
    data: {
      createdBy: '9935235d-38a3-464c-b98a-ed98ec7b0b66' // amitkumar
    }
  });
  console.log(`Successfully updated ${result.count} assets from sonubhagat to amitkumar.`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
