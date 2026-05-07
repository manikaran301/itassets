import { PrismaClient } from '@prisma/client';
// Force reload: 2026-05-06T10:06

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const prismaClientSingleton = () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 15000, // Increased to 15s to prevent timeouts during high load
    idleTimeoutMillis: 30000,
    max: 20, // Increased pool size to handle more concurrent requests
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

// Re-export with forced update: 2026-05-07T15:00
const prisma = globalThis.prismaGlobal || prismaClientSingleton();
export default prisma;

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}
