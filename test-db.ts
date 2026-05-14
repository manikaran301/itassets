import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const companies = await prisma.company.findMany();
  const workspaces = await prisma.workspace.findMany({ take: 20 });
  
  console.log('--- MASTER COMPANIES ---');
  console.log(JSON.stringify(companies.map(c => ({ id: c.id, name: c.name, code: c.code })), null, 2));
  
  console.log('\n--- WORKSPACES (SEATS) ---');
  console.log(JSON.stringify(workspaces.map(w => ({ id: w.id, code: w.code, company: w.company })), null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
