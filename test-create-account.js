// Simple test for create account function
import fetch from 'node-fetch';

async function testCreateAccount() {
  const baseUrl = 'http://localhost:3000/api/v1';
  
  // Test data
  const testUser = {
    username: 'testuser123',
    email: 'test@example.com',
    name: 'Test User',
    password: 'securepassword123',
    location: 'Cape Town, South Africa'
  };
  
  try {
    console.log('Testing user registration...');
    
    const response = await fetch(`${baseUrl}/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });
    
    const result = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ User registration successful!');
      
      // Test login
      console.log('\nTesting user login...');
      const loginResponse = await fetch(`${baseUrl}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: testUser.username,
          password: testUser.password
        })
      });
      
      const loginResult = await loginResponse.json();
      console.log('Login Status:', loginResponse.status);
      console.log('Login Response:', JSON.stringify(loginResult, null, 2));
      
      if (loginResponse.ok) {
        console.log('✅ User login successful!');
      } else {
        console.log('❌ User login failed');
      }
    } else {
      console.log('❌ User registration failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testCreateAccount();