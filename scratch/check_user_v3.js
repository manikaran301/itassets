
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
  const user = await prisma.systemUser.findFirst({
    where: {
      OR: [
        { fullName: { contains: 'PREETI', mode: 'insensitive' } },
        { username: { contains: '2160', mode: 'insensitive' } }
      ]
    },
    include: {
      permissions: {
        select: {
          category: true,
          subcategory: true,
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: true,
          canImport: true,
          canExport: true
        }
      },
      company: { select: { name: true } },
      managedLocations: { select: { name: true } }
    }
  });

  if (!user) {
    console.log("User not found.");
    return;
  }

  console.log("--- USER INFO ---");
  console.log(`Full Name: ${user.fullName}`);
  console.log(`Username: ${user.username}`);
  console.log(`Role: ${user.role}`);
  console.log(`Company: ${user.company?.name || 'N/A'}`);
  console.log(`Locations: ${user.managedLocations.map(l => l.name).join(', ') || 'N/A'}`);
  console.log("\n--- PERMISSIONS ---");
  user.permissions.forEach(p => {
    const actions = [];
    if (p.canView) actions.push('VIEW');
    if (p.canCreate) actions.push('CREATE');
    if (p.canEdit) actions.push('EDIT');
    if (p.canDelete) actions.push('DELETE');
    if (p.canImport) actions.push('IMPORT');
    if (p.canExport) actions.push('EXPORT');
    console.log(`${p.category}/${p.subcategory}: [${actions.join(', ')}]`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
