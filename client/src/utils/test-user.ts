// Test user utility for debugging Firebase authentication
import { signUpWithEmail } from '@/lib/firebase';

// Generate a random test user
export const generateTestUser = () => {
  const randomId = Math.floor(Math.random() * 10000);
  return {
    email: `test${randomId}@example.com`,
    password: 'Test123!',
    name: `Test User ${randomId}`,
    username: `testuser${randomId}`,
    location: 'Test Location',
    bio: 'This is a test user account'
  };
};

// Create a test user for debugging
export const createTestUser = async () => {
  const testUser = generateTestUser();
  
  try {
    console.log(`Creating test user with email: ${testUser.email}`);
    const user = await signUpWithEmail(testUser.email, testUser.password, testUser.name);
    console.log('Test user created successfully:', user?.uid);
    return {
      success: true,
      user,
      credentials: testUser
    };
  } catch (error) {
    console.error('Failed to create test user:', error);
    return {
      success: false,
      error,
      credentials: testUser
    };
  }
};