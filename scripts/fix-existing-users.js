const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixExistingUsers() {
  console.log('🔧 Fixing existing users...\n');

  try {
    // Get all users
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users to check:`);

    for (const user of users) {
      console.log(`\n📧 User: ${user.email}`);
      console.log(`   Current password: "${user.password}"`);
      
      // If the user has password "password123", it means they were created 
      // during the old system where all passwords were set to "password123"
      // We should ask what their intended password should be
      if (user.password === 'password123') {
        console.log(`   ⚠️  This user has the default password "password123"`);
        console.log(`   💡 This user can login with: password123`);
      } else {
        console.log(`   ✅ This user can login with: ${user.password}`);
      }
    }

    console.log('\n📋 Summary:');
    console.log('- Users with "password123" can login using "password123"');
    console.log('- Users with other passwords can login using their stored password');
    console.log('- New users registered after the fix will work normally');
    
    console.log('\n🔍 To test:');
    console.log('1. Try logging in with chimbayopeter03@gmail.com and password "password123"');
    console.log('2. Or create a new account and login with those new credentials');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixExistingUsers();
