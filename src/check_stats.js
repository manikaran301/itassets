const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const fs = require('fs');
const path = require('path');

// Basic .env loader
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not found in .env');
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const totalEmployees = await prisma.employee.count();
    
    const departments = await prisma.employee.groupBy({
      by: ['department'],
      _count: { id: true },
      where: { department: { not: null, not: "" } }
    });

    const companies = await prisma.employee.groupBy({
      by: ['companyName'],
      _count: { id: true },
      where: { companyName: { not: null, not: "" } }
    });

    const locations = await prisma.employee.groupBy({
      by: ['locationJoining'],
      _count: { id: true },
      where: { locationJoining: { not: null, not: "" } }
    });

    console.log('\n--- DATABASE STATS REPORT ---');
    console.log('Total Employees:', totalEmployees);
    console.log('\nUnique Departments:', departments.length);
    departments.sort((a,b) => b._count.id - a._count.id).forEach(d => console.log(`- ${d.department}: ${d._count.id}`));
    
    console.log('\nUnique Companies:', companies.length);
    companies.sort((a,b) => b._count.id - a._count.id).forEach(c => console.log(`- ${c.companyName}: ${c._count.id}`));
    
    console.log('\nUnique Locations:', locations.length);
    locations.sort((a,b) => b._count.id - a._count.id).forEach(l => console.log(`- ${l.locationJoining}: ${l._count.id}`));
    console.log('-----------------------------\n');

  } catch (err) {
    console.error('Error fetching stats:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
