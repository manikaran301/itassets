import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const users = [
  { name: 'ROHIT KUMAR', company: '50HERTZ', email: 'rohit.kumar@50hertz.com' },
  { name: 'MAHESH SHUKLA', company: '50HERTZ', email: 'mahesh.shukla@50hertz.com' },
  { name: 'CHANDAN KUSHWAHA', company: 'MPL', email: 'chandan.kushwaha@mpl.com' },
  { name: 'AMIT KUMAR', company: 'MPL', email: 'amit.kumar@mpl.com' },
  { name: 'MOHIT SHUKLA', company: 'MPL', email: 'mohit.shukla@mpl.com' },
  { name: 'AKHILESH YADAV', company: 'MPL', email: 'akhilesh.yadav@mpl.com' },
  { name: 'PARDEEP', company: 'MPL', email: 'pardeep@mpl.com' },
  { name: 'GOURAV BEHL', company: 'MPL', email: 'gourav.behl@mpl.com' },
  { name: 'HIMANI SHARMA', company: 'MPL', email: 'himani.sharma@mpl.com' },
  { name: 'Surendra Yadav', company: 'MPL', email: 'surendra.yadav@mpl.com' },
];

async function main() {
  console.log('Starting to create admin accounts...');
  const passwordHash = await bcrypt.hash('Admin@1221', 10);

  for (const user of users) {
    try {
      const createdUser = await prisma.systemUser.upsert({
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
      console.log(`Successfully created/updated account for: ${createdUser.fullName} (${createdUser.email})`);
    } catch (error) {
      console.error(`Error creating account for ${user.name}:`, error);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
