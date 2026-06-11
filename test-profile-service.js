/**
 * Test script for client-side profile service functions
 * Tests the profile service API calls from the frontend perspective
 */

import fs from 'fs';
import fetch from 'node-fetch';
import FormData from 'form-data';

// Mock the environment for testing
const API_URL = 'http://localhost:5001';

// Mock profile service functions (since we can't import ES modules directly)
async function updateProfile(params) {
  try {
    const { profileData, profileImage, cvFile } = params;

    const formData = new FormData();
    formData.append('profileData', JSON.stringify(profileData));

    if (profileImage) {
      formData.append('profileImage', profileImage);
    }

    if (cvFile) {
      formData.append('cvFile', cvFile);
    }

    const response = await fetch(`${API_URL}/api/profile/update`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Profile update error:', error);
    return {
      success: false,
      message: error.message || 'An unexpected error occurred',
    };
  }
}

async function uploadProfileImage(file) {
  try {
    const formData = new FormData();
    formData.append('profileImage', file);

    const response = await fetch(`${API_URL}/api/profile/upload-image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to upload profile image');
    }

    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error('Profile image upload error:', error);
    throw error;
  }
}

async function scanCV(file) {
  try {
    const formData = new FormData();
    formData.append('cvFile', file);

    const response = await fetch(`${API_URL}/api/profile/scan-cv`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to scan CV');
    }

    return await response.json();
  } catch (error) {
    console.error('CV scan error:', error);
    throw error;
  }
}

async function getProfile(userId) {
  try {
    const response = await fetch(`${API_URL}/api/profile/${userId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Profile fetch error:', error);
    throw error;
  }
}

// Test utilities
function createTestImage(filename) {
  const pngData = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
    0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
    0xff, 0xff, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xe2, 0x21, 0xbc, 0x33, 0x00, 0x00, 0x00, 0x00,
    0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);

  fs.writeFileSync(filename, pngData);
  return fs.createReadStream(filename);
}

function createTestPDF(filename) {
  const pdfContent = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj
4 0 obj<</Length 44>>stream
BT/F1 12 Tf 72 720 Td(Test CV Document)Tj ET
endstream endobj
xref 0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer<</Size 5/Root 1 0 R>>startxref 300 %%EOF`;

  fs.writeFileSync(filename, pdfContent);
  return fs.createReadStream(filename);
}

// Test functions
async function testProfileImageUpload() {
  console.log('\n📸 Testing profile image upload service...');

  const testFile = 'test-profile-service-image.png';
  const fileStream = createTestImage(testFile);

  try {
    const imageUrl = await uploadProfileImage(fileStream);
    console.log('✅ Profile image upload service successful');
    console.log(`   Image URL: ${imageUrl}`);
    return true;
  } catch (error) {
    console.log('❌ Profile image upload service failed');
    console.log(`   Error: ${error.message}`);
    return false;
  } finally {
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
  }
}

async function testCVScan() {
  console.log('\n🔍 Testing CV scan service...');

  const testFile = 'test-cv-scan.pdf';
  const fileStream = createTestPDF(testFile);

  try {
    const scanResult = await scanCV(fileStream);
    console.log('✅ CV scan service successful');
    console.log(`   Scan result:`, scanResult);
    return true;
  } catch (error) {
    console.log('❌ CV scan service failed');
    console.log(`   Error: ${error.message}`);
    return false;
  } finally {
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
  }
}

async function testProfileUpdate() {
  console.log('\n📝 Testing profile update service...');

  const profileImageFile = 'test-update-image.png';
  const cvFile = 'test-update-cv.pdf';

  const profileImage = createTestImage(profileImageFile);
  const cvFileStream = createTestPDF(cvFile);

  const profileData = {
    personal: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      location: 'Cape Town, South Africa',
    },
    education: [
      {
        institution: 'University of Cape Town',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        startDate: '2018',
        endDate: '2022',
      },
    ],
    experience: [
      {
        company: 'Tech Company',
        position: 'Software Developer',
        startDate: '2022',
        endDate: 'Present',
        description: 'Developing web applications',
      },
    ],
    skills: ['JavaScript', 'React', 'Node.js', 'Python'],
  };

  try {
    const result = await updateProfile({
      profileData,
      profileImage,
      cvFile: cvFileStream,
    });

    if (result.success) {
      console.log('✅ Profile update service successful');
      console.log(`   Message: ${result.message}`);
      if (result.profileImageUrl) {
        console.log(`   Profile image URL: ${result.profileImageUrl}`);
      }
      if (result.cvUrl) {
        console.log(`   CV URL: ${result.cvUrl}`);
      }
      return true;
    } else {
      console.log('❌ Profile update service failed');
      console.log(`   Message: ${result.message}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Profile update service failed');
    console.log(`   Error: ${error.message}`);
    return false;
  } finally {
    [profileImageFile, cvFile].forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });
  }
}

async function testGetProfile() {
  console.log('\n👤 Testing get profile service...');

  const testUserId = 'test-user-123';

  try {
    const profile = await getProfile(testUserId);
    console.log('✅ Get profile service successful');
    console.log(`   Profile data:`, profile);
    return true;
  } catch (error) {
    console.log('❌ Get profile service failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testServerConnection() {
  console.log('\n🔗 Testing server connection...');

  try {
    const response = await fetch(`${API_URL}/health`);
    if (response.ok) {
      console.log('✅ Server connection successful');
      return true;
    } else {
      console.log(`❌ Server responded with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Server connection failed: ${error.message}`);
    console.log('   Make sure the server is running on port 5001');
    return false;
  }
}

// Main test runner
async function runProfileServiceTests() {
  console.log('🚀 Starting Profile Service Tests');
  console.log('==================================');

  const results = {
    serverConnection: false,
    profileImageUpload: false,
    cvScan: false,
    profileUpdate: false,
    getProfile: false,
  };

  // Test server connection first
  results.serverConnection = await testServerConnection();

  if (!results.serverConnection) {
    console.log('\n❌ Cannot connect to server. Skipping other tests.');
    console.log('   Please ensure the server is running: npm run dev:server');
    return;
  }

  // Run service tests
  results.profileImageUpload = await testProfileImageUpload();
  results.cvScan = await testCVScan();
  results.profileUpdate = await testProfileUpdate();
  results.getProfile = await testGetProfile();

  // Summary
  console.log('\n📊 Profile Service Test Summary');
  console.log('================================');
  console.log(`Server Connection: ${results.serverConnection ? '✅' : '❌'}`);
  console.log(`Profile Image Upload: ${results.profileImageUpload ? '✅' : '❌'}`);
  console.log(`CV Scan: ${results.cvScan ? '✅' : '❌'}`);
  console.log(`Profile Update: ${results.profileUpdate ? '✅' : '❌'}`);
  console.log(`Get Profile: ${results.getProfile ? '✅' : '❌'}`);

  const successCount = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;

  console.log(`\n🎯 Overall: ${successCount}/${totalTests} tests passed`);

  if (successCount === totalTests) {
    console.log('🎉 All profile service tests passed!');
  } else {
    console.log('⚠️  Some profile service tests failed. Check server endpoints and configuration.');
  }
}

// Run the tests
runProfileServiceTests().catch(console.error);
