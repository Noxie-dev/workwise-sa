/**
 * Simple test for profile upload functions
 * Tests the upload functionality using the existing test patterns
 */

import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

// Create test files
function createTestImage(filename) {
  // Create a minimal PNG file (1x1 pixel)
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // width: 1
    0x00, 0x00, 0x00, 0x01, // height: 1
    0x08, 0x02, 0x00, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
    0x90, 0x77, 0x53, 0xDE, // CRC
    0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // data
    0xE2, 0x21, 0xBC, 0x33, // CRC
    0x00, 0x00, 0x00, 0x00, // IEND chunk length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);
  
  fs.writeFileSync(filename, pngData);
  console.log(`✓ Created test image: ${filename}`);
}

async function testUploadFunctions() {
  console.log('🚀 Testing Profile Upload Functions');
  console.log('===================================');
  
  // Test 1: Check if Netlify dev is running
  console.log('\n1. 🔍 Checking Netlify dev server...');
  try {
    const healthResponse = await fetch('http://localhost:8888/.netlify/functions/files');
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Netlify dev server is running');
      console.log(`   Message: ${healthData.message}`);
      console.log(`   Firebase: ${healthData.firebase}`);
      console.log(`   Endpoints: ${healthData.endpoints.join(', ')}`);
    } else {
      console.log(`❌ Netlify dev server responded with status: ${healthResponse.status}`);
      console.log('   Please run: netlify dev');
      return;
    }
  } catch (error) {
    console.log(`❌ Cannot connect to Netlify dev server: ${error.message}`);
    console.log('   Please run: netlify dev');
    return;
  }
  
  // Test 2: Profile image upload
  console.log('\n2. 📸 Testing profile image upload...');
  const profileImageFile = 'test-profile-upload.png';
  createTestImage(profileImageFile);
  
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(profileImageFile));
    formData.append('userId', 'test-user-123');
    
    const response = await fetch('http://localhost:8888/.netlify/functions/files/upload-profile-image', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ Profile image upload successful');
      console.log(`   File URL: ${result.data.fileUrl}`);
      console.log(`   Original name: ${result.data.originalName}`);
      console.log(`   Size: ${result.data.size} bytes`);
    } else {
      console.log('❌ Profile image upload failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${result.error || result.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.log(`❌ Profile image upload error: ${error.message}`);
  } finally {
    if (fs.existsSync(profileImageFile)) {
      fs.unlinkSync(profileImageFile);
    }
  }
  
  // Test 3: Professional image upload
  console.log('\n3. 🏢 Testing professional image upload...');
  const professionalImageFile = 'test-professional-upload.png';
  createTestImage(professionalImageFile);
  
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(professionalImageFile));
    formData.append('userId', 'test-user-456');
    
    const response = await fetch('http://localhost:8888/.netlify/functions/files/upload-professional-image', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ Professional image upload successful');
      console.log(`   File URL: ${result.data.fileUrl}`);
      console.log(`   Original name: ${result.data.originalName}`);
      console.log(`   Size: ${result.data.size} bytes`);
    } else {
      console.log('❌ Professional image upload failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${result.error || result.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.log(`❌ Professional image upload error: ${error.message}`);
  } finally {
    if (fs.existsSync(professionalImageFile)) {
      fs.unlinkSync(professionalImageFile);
    }
  }
  
  // Test 4: Invalid file type (should fail)
  console.log('\n4. 🚫 Testing invalid file upload (should fail)...');
  const invalidFile = 'test-invalid.txt';
  fs.writeFileSync(invalidFile, 'This is a text file that should be rejected');
  
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(invalidFile));
    formData.append('userId', 'test-user-789');
    
    const response = await fetch('http://localhost:8888/.netlify/functions/files/upload-profile-image', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (!response.ok || !result.success) {
      console.log('✅ Invalid file correctly rejected');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${result.error || result.message || 'Unknown error'}`);
    } else {
      console.log('❌ Invalid file was incorrectly accepted');
    }
  } catch (error) {
    console.log(`✅ Invalid file correctly rejected with error: ${error.message}`);
  } finally {
    if (fs.existsSync(invalidFile)) {
      fs.unlinkSync(invalidFile);
    }
  }
  
  console.log('\n🎯 Upload function testing completed!');
  console.log('=====================================');
  console.log('✅ Profile image upload endpoint tested');
  console.log('✅ Professional image upload endpoint tested');
  console.log('✅ Invalid file rejection tested');
  console.log('\n📝 Note: These tests use Firebase Storage for file storage.');
  console.log('   Make sure Firebase credentials are properly configured.');
}

// Run the test
testUploadFunctions().catch(console.error);