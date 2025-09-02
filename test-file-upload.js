// Simple test script to verify file upload functionality
import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

async function testFileUpload() {
  try {
    // Test the health check first
    console.log('Testing health check...');
    const healthResponse = await fetch('http://localhost:8888/.netlify/functions/files');
    const healthData = await healthResponse.json();
    console.log('Health check:', healthData);

    // Create a simple test image file
    const testImagePath = 'test-image.png';
    if (!fs.existsSync(testImagePath)) {
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
      fs.writeFileSync(testImagePath, pngData);
      console.log('Created test image file');
    }

    // Test profile image upload
    console.log('Testing profile image upload...');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testImagePath));
    formData.append('userId', 'test-user-123');

    const uploadResponse = await fetch('http://localhost:8888/.netlify/functions/files/upload-profile-image', {
      method: 'POST',
      body: formData
    });

    console.log('Upload response status:', uploadResponse.status);
    const uploadResult = await uploadResponse.text();
    console.log('Upload result:', uploadResult);

    // Clean up
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
      console.log('Cleaned up test file');
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testFileUpload();