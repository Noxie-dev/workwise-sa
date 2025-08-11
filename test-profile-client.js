/**
 * Test script for client-side profile functionality
 * Simulates how the frontend would interact with profile services
 */

import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

// Mock the client-side profile service functions
class ProfileService {
  constructor(apiUrl = 'http://localhost:8888/.netlify/functions/files') {
    this.apiUrl = apiUrl;
  }

  async uploadProfileImage(file, userId) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);
      
      const response = await fetch(`${this.apiUrl}/upload-profile-image`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Failed to upload profile image');
      }
      
      const data = await response.json();
      return data.data.fileUrl;
    } catch (error) {
      console.error('Profile image upload error:', error);
      throw error;
    }
  }

  async uploadProfessionalImage(file, userId) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);
      
      const response = await fetch(`${this.apiUrl}/upload-professional-image`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Failed to upload professional image');
      }
      
      const data = await response.json();
      return data.data.fileUrl;
    } catch (error) {
      console.error('Professional image upload error:', error);
      throw error;
    }
  }

  async updateProfile(profileData, profileImage, userId) {
    // This would typically call a profile update endpoint
    // For now, we'll just test the image upload part
    let profileImageUrl = null;
    
    if (profileImage) {
      profileImageUrl = await this.uploadProfileImage(profileImage, userId);
    }
    
    return {
      success: true,
      profileImageUrl,
      message: 'Profile updated successfully'
    };
  }
}

// Test utilities
function createTestImage(filename) {
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE,
    0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54,
    0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01,
    0xE2, 0x21, 0xBC, 0x33, 0x00, 0x00, 0x00, 0x00,
    0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
  
  fs.writeFileSync(filename, pngData);
  return fs.createReadStream(filename);
}

async function testProfileClientFunctions() {
  console.log('🚀 Testing Profile Client Functions');
  console.log('===================================');
  
  const profileService = new ProfileService();
  
  // Test 1: Check service availability
  console.log('\n1. 🔍 Checking service availability...');
  try {
    const response = await fetch('http://localhost:8888/.netlify/functions/files');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Profile service is available');
      console.log(`   Firebase: ${data.firebase}`);
    } else {
      console.log('❌ Profile service is not available');
      console.log('   Please run: netlify dev');
      return;
    }
  } catch (error) {
    console.log(`❌ Cannot connect to profile service: ${error.message}`);
    console.log('   Please run: netlify dev');
    return;
  }
  
  // Test 2: Profile image upload through service
  console.log('\n2. 📸 Testing profile image upload service...');
  const profileImageFile = 'test-client-profile.png';
  const profileImageStream = createTestImage(profileImageFile);
  
  try {
    const imageUrl = await profileService.uploadProfileImage(profileImageStream, 'client-test-user-1');
    console.log('✅ Profile image upload service successful');
    console.log(`   Image URL: ${imageUrl}`);
  } catch (error) {
    console.log('❌ Profile image upload service failed');
    console.log(`   Error: ${error.message}`);
  } finally {
    if (fs.existsSync(profileImageFile)) {
      fs.unlinkSync(profileImageFile);
    }
  }
  
  // Test 3: Professional image upload through service
  console.log('\n3. 🏢 Testing professional image upload service...');
  const professionalImageFile = 'test-client-professional.png';
  const professionalImageStream = createTestImage(professionalImageFile);
  
  try {
    const imageUrl = await profileService.uploadProfessionalImage(professionalImageStream, 'client-test-user-2');
    console.log('✅ Professional image upload service successful');
    console.log(`   Image URL: ${imageUrl}`);
  } catch (error) {
    console.log('❌ Professional image upload service failed');
    console.log(`   Error: ${error.message}`);
  } finally {
    if (fs.existsSync(professionalImageFile)) {
      fs.unlinkSync(professionalImageFile);
    }
  }
  
  // Test 4: Complete profile update with image
  console.log('\n4. 📝 Testing complete profile update...');
  const updateImageFile = 'test-client-update.png';
  const updateImageStream = createTestImage(updateImageFile);
  
  const profileData = {
    personal: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      location: 'Cape Town, South Africa'
    },
    skills: ['JavaScript', 'React', 'Node.js']
  };
  
  try {
    const result = await profileService.updateProfile(profileData, updateImageStream, 'client-test-user-3');
    if (result.success) {
      console.log('✅ Profile update service successful');
      console.log(`   Message: ${result.message}`);
      if (result.profileImageUrl) {
        console.log(`   Profile image URL: ${result.profileImageUrl}`);
      }
    } else {
      console.log('❌ Profile update service failed');
    }
  } catch (error) {
    console.log('❌ Profile update service failed');
    console.log(`   Error: ${error.message}`);
  } finally {
    if (fs.existsSync(updateImageFile)) {
      fs.unlinkSync(updateImageFile);
    }
  }
  
  // Test 5: Error handling with invalid file
  console.log('\n5. 🚫 Testing error handling...');
  const invalidFile = 'test-client-invalid.txt';
  fs.writeFileSync(invalidFile, 'Invalid file content');
  const invalidStream = fs.createReadStream(invalidFile);
  
  try {
    await profileService.uploadProfileImage(invalidStream, 'client-test-user-4');
    console.log('❌ Invalid file was incorrectly accepted');
  } catch (error) {
    console.log('✅ Invalid file correctly rejected');
    console.log(`   Error: ${error.message}`);
  } finally {
    if (fs.existsSync(invalidFile)) {
      fs.unlinkSync(invalidFile);
    }
  }
  
  console.log('\n🎯 Profile client function testing completed!');
  console.log('============================================');
  console.log('✅ Profile image upload service tested');
  console.log('✅ Professional image upload service tested');
  console.log('✅ Complete profile update tested');
  console.log('✅ Error handling tested');
  console.log('\n📝 These tests simulate how the frontend React components');
  console.log('   would interact with the profile upload functionality.');
}

// Run the test
testProfileClientFunctions().catch(console.error);