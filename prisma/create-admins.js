const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const users = [
  { name: 'ROHIT KUMAR', company: '50HERTZ', email: 'rohit.kumar@50hertz.com', username: 'rohitkumar' },
  { name: 'MAHESH SHUKLA', company: '50HERTZ', email: 'mahesh.shukla@50hertz.com', username: 'maheshshukla' },
  { name: 'CHANDAN KUSHWAHA', company: 'MPL', email: 'chandan.kushwaha@mpl.com', username: 'chandankushwaha' },
  { name: 'AMIT KUMAR', company: 'MPL', email: 'amit.kumar@mpl.com', username: 'amitkumar' },
  { name: 'MOHIT SHUKLA', company: 'MPL', email: 'mohit.shukla@mpl.com', username: 'mohitshukla' },
  { name: 'AKHILESH YADAV', company: 'MPL', email: 'akhilesh.yadav@mpl.com', username: 'akhileshyadav' },
  { name: 'PARDEEP', company: 'MPL', email: 'pardeep@mpl.com', username: 'pardeep' },
  { name: 'GOURAV BEHL', company: 'MPL', email: 'gourav.behl@mpl.com', username: 'gouravbehl' },
  { name: 'HIMANI SHARMA', company: 'MPL', email: 'himani.sharma@mpl.com', username: 'himanisharma' },
  { name: 'Surendra Yadav', company: 'MPL', email: 'surendra.yadav@mpl.com', username: 'surendrayadav' },
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
          username: user.username,
          companyName: user.company,
          role: 'admin',
          passwordHash: passwordHash,
        },
        create: {
          fullName: user.name,
          username: user.username,
          email: user.email,
          companyName: user.company,
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
