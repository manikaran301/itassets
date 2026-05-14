const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companies = await prisma.company.findMany();
  const workspaces = await prisma.workspace.findMany();
  
  console.log('MASTER_COMPANIES_START');
  console.log(JSON.stringify(companies));
  console.log('MASTER_COMPANIES_END');
  
  console.log('WORKSPACES_START');
  console.log(JSON.stringify(workspaces));
  console.log('WORKSPACES_END');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
