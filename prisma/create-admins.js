const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const users = [
  { name: 'ROHIT KUMAR', email: 'rohit.kumar@50hertz.com' },
  { name: 'MAHESH SHUKLA', email: 'mahesh.shukla@50hertz.com' },
  { name: 'CHANDAN KUSHWAHA', email: 'chandan.kushwaha@mpl.com' },
  { name: 'AMIT KUMAR', email: 'amit.kumar@mpl.com' },
  { name: 'MOHIT SHUKLA', email: 'mohit.shukla@mpl.com' },
  { name: 'AKHILESH YADAV', email: 'akhilesh.yadav@mpl.com' },
  { name: 'PARDEEP', email: 'pardeep@mpl.com' },
  { name: 'GOURAV BEHL', email: 'gourav.behl@mpl.com' },
  { name: 'HIMANI SHARMA', email: 'himani.sharma@mpl.com' },
  { name: 'Surendra Yadav', email: 'surendra.yadav@mpl.com' },
];

async function main() {
  console.log('Starting to create admin accounts...');
  const passwordHash = await bcrypt.hash('Admin@1221', 10);

  for (const user of users) {
    try {
      await prisma.systemUser.upsert({
        where: { email: user.email },
        update: {
          fullName: user.name,
          role: 'admin',
          passwordHash: passwordHash,
        },
        create: {
          fullName: user.name,
          email: user.email,
          role: 'admin',
          passwordHash: passwordHash,
          isActive: true
        },
      });
      console.log(`Successfully created/updated account for: ${user.name}`);
    } catch (error) {
      console.error(`Error for ${user.name}:`, error.message);
    }
  }
  console.log('All 10 accounts are ready.');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
