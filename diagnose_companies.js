const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companies = await prisma.company.findMany();
  const workspaces = await prisma.workspace.findMany({ take: 10 });
  
  console.log('--- MASTER COMPANIES ---');
  console.log(companies.map(c => ({ id: c.id, name: c.name, code: c.code })));
  
  console.log('\n--- WORKSPACES (SEATS) ---');
  console.log(workspaces.map(w => ({ id: w.id, code: w.code, company: w.company })));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
