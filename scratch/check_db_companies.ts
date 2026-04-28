import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCompanies() {
  console.log("Checking workspace companies...");
  const companies = await prisma.workspace.groupBy({
    by: ['company'],
    _count: {
      id: true
    }
  });
  console.log("Found companies in Workspace table:", companies);

  const employees = await prisma.employee.groupBy({
    by: ['companyName'],
    _count: {
      id: true
    }
  });
  console.log("Found companies in Employee table:", employees);
}

checkCompanies()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
