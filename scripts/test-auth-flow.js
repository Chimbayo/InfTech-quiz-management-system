const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAuthFlow() {
  console.log('🔍 Testing Authentication Flow...\n');

  try {
    // 1. Check existing users
    console.log('1. Checking existing users:');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        createdAt: true
      }
    });
    
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.role}) - Password: "${user.password}"`);
    });
    console.log('');

    // 2. Test registration
    console.log('2. Testing registration...');
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'testpass123';
    
    try {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test User',
          email: testEmail,
          password: testPassword,
        }),
      });

      const registerResult = await response.json();
      console.log('Registration response:', registerResult);
      console.log('Registration status:', response.status);
      console.log('');

      if (response.ok) {
        // 3. Test login with the same credentials
        console.log('3. Testing login with same credentials...');
        const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: testEmail,
            password: testPassword,
          }),
        });

        const loginResult = await loginResponse.json();
        console.log('Login response:', loginResult);
        console.log('Login status:', loginResponse.status);
        console.log('');

        // 4. Check the user in database after registration
        console.log('4. Checking user in database after registration:');
        const newUser = await prisma.user.findUnique({
          where: { email: testEmail },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true
          }
        });
        console.log('User in DB:', newUser);
      }
    } catch (error) {
      console.error('Error during registration/login test:', error);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuthFlow();
