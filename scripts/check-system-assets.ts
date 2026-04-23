import 'dotenv/config';
import prisma from '../src/lib/prisma';

async function checkSystemAddedAssets() {
  try {
    console.log('🔍 Checking N-Computing Assets Added By System\n');

    // Get all system users
    const systemUsers = await prisma.systemUser.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    });

    console.log('System Users:');
    systemUsers.forEach((user) => {
      console.log(`  • ${user.fullName} (${user.email})`);
    });

    // Check assets for each system user
    for (const user of systemUsers) {
      const assets = await prisma.asset.findMany({
        where: {
          type: 'n_computing',
          createdBy: user.id,
        },
        select: {
          id: true,
          assetTag: true,
          make: true,
          model: true,
          status: true,
          ipAddress: true,
          currentEmployee: {
            select: {
              fullName: true,
              employeeCode: true,
            },
          },
        },
      });

      if (assets.length > 0) {
        console.log(
          `\n📊 N-Computing Assets Added by ${user.fullName}:`
        );
        console.log(`   Total: ${assets.length}`);
        assets.forEach((asset) => {
          const employee = asset.currentEmployee
            ? `${asset.currentEmployee.fullName} (${asset.currentEmployee.employeeCode})`
            : 'Unassigned';
          console.log(
            `   • ${asset.assetTag} | ${asset.make} ${asset.model} | IP: ${asset.ipAddress} | Status: ${asset.status} | Assigned: ${employee}`
          );
        });
      }
    }

    // Total n_computing count
    const totalNComputing = await prisma.asset.count({
      where: { type: 'n_computing' },
    });

    console.log(`\n${'='.repeat(70)}`);
    console.log(`Total N-Computing Assets in Database: ${totalNComputing}`);
    console.log(`${'='.repeat(70)}`);

    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkSystemAddedAssets();
