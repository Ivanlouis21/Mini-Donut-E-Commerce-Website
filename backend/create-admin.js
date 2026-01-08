const axios = require('axios');

const API_URL = 'http://localhost:3001';

async function createAdmin() {
  const email = process.argv[2] || 'admin@example.com';
  const password = process.argv[3] || 'admin123';
  const firstName = process.argv[4] || 'Admin';
  const lastName = process.argv[5] || 'User';

  try {
    console.log('Creating admin account...');
    console.log(`Email: ${email}`);
    
    // Step 1: Register user (if not exists)
    try {
      const registerResponse = await axios.post(`${API_URL}/auth/register`, {
        email,
        password,
        firstName,
        lastName
      });
      console.log('✓ User registered successfully');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already registered')) {
        console.log('✓ User already exists, skipping registration');
      } else {
        throw error;
      }
    }
    
    // Step 2: Promote to admin
    const promoteResponse = await axios.post(`${API_URL}/auth/promote-admin`, {
      email
    });
    
    console.log('\n✓ Admin account created successfully!');
    console.log('\nLogin credentials:');
    console.log(`  Email: ${promoteResponse.data.user.email}`);
    console.log(`  Password: ${password}`);
    console.log(`  Role: ${promoteResponse.data.user.role}`);
    console.log('\nYou can now log in and access the admin dashboard at /admin');
  } catch (error) {
    console.error('\n✗ Error creating admin account:');
    if (error.response) {
      console.error(`  Status: ${error.response.status}`);
      console.error(`  Message: ${error.response.data?.message || error.response.statusText}`);
    } else {
      console.error(`  ${error.message}`);
    }
    console.error('\nMake sure the backend server is running on http://localhost:3001');
    process.exit(1);
  }
}

createAdmin();
