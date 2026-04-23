import 'dotenv/config';
import prisma from '../src/lib/prisma';

async function testConnection() {
  try {
    console.log('🔗 Testing Database Connection...\n');
    console.log(`📌 DATABASE_URL: ${process.env.DATABASE_URL?.substring(0, 50)}...`);

    // Test basic connection
    const result = await prisma.$queryRaw`SELECT NOW() as timestamp, version();`;
    console.log('✅ Database Connection Successful!\n');
    console.log('📊 Database Info:');
    console.log(result);

    // Count existing assets
    const assetCount = await prisma.asset.count();
    console.log(`\n📦 Existing Assets: ${assetCount}`);

    // Count existing employees
    const employeeCount = await prisma.employee.count();
    console.log(`👥 Existing Employees: ${employeeCount}`);

    // Count system users
    const userCount = await prisma.systemUser.count();
    console.log(`👤 System Users: ${userCount}`);

    // Get first system user
    const firstUser = await prisma.systemUser.findFirst();
    if (firstUser) {
      console.log(`\n👤 Default User for Import: ${firstUser.fullName} (${firstUser.email})`);
    }

    console.log('\n✅ All database operations successful!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Database Connection Error:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code}`);
    console.error(`   Endpoint: ${error.meta?.serverVersion || 'Unknown'}`);
    
    console.log('\n⚠️  Make sure:');
    console.log('   1. PostgreSQL is running');
    console.log('   2. .env.local has correct DATABASE_URL');
    console.log('   3. Database exists and migrations are applied');
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
