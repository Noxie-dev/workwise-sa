/**
 * Test runner for profile upload functionality
 * Checks server status and runs comprehensive tests
 */

import { spawn } from 'child_process';
import fetch from 'node-fetch';

async function checkNetlifyDev() {
  console.log('🔍 Checking if Netlify dev is running...');
  try {
    const response = await fetch('http://localhost:8888/.netlify/functions/files');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Netlify dev is running');
      console.log(`   Message: ${data.message}`);
      console.log(`   Firebase: ${data.firebase}`);
      return true;
    }
  } catch (error) {
    console.log('❌ Netlify dev is not running');
    return false;
  }
  return false;
}

async function startNetlifyDev() {
  console.log('🚀 Starting Netlify dev...');
  console.log('   This may take a moment...');
  
  return new Promise((resolve, reject) => {
    const netlifyProcess = spawn('netlify', ['dev', '--port', '8888'], {
      stdio: 'pipe',
      detached: false
    });
    
    let output = '';
    let started = false;
    
    netlifyProcess.stdout.on('data', (data) => {
      output += data.toString();
      console.log(`   ${data.toString().trim()}`);
      
      // Check if server has started
      if (data.toString().includes('Server now ready on') || 
          data.toString().includes('Local:') ||
          data.toString().includes('Functions server is listening')) {
        if (!started) {
          started = true;
          setTimeout(() => resolve(netlifyProcess), 3000); // Wait 3 seconds for full startup
        }
      }
    });
    
    netlifyProcess.stderr.on('data', (data) => {
      console.log(`   Error: ${data.toString().trim()}`);
    });
    
    netlifyProcess.on('error', (error) => {
      reject(error);
    });
    
    // Timeout after 30 seconds
    setTimeout(() => {
      if (!started) {
        netlifyProcess.kill();
        reject(new Error('Netlify dev failed to start within 30 seconds'));
      }
    }, 30000);
  });
}

async function runTest(testFile, testName) {
  console.log(`\n🧪 Running ${testName}...`);
  console.log('='.repeat(50));
  
  return new Promise((resolve) => {
    const testProcess = spawn('node', [testFile], {
      stdio: 'inherit'
    });
    
    testProcess.on('close', (code) => {
      console.log(`\n✅ ${testName} completed with exit code: ${code}`);
      resolve(code === 0);
    });
    
    testProcess.on('error', (error) => {
      console.log(`❌ ${testName} failed: ${error.message}`);
      resolve(false);
    });
  });
}

async function main() {
  console.log('🚀 Profile Upload Test Runner');
  console.log('==============================');
  console.log('This script will test all profile upload functionality');
  console.log('including image uploads and error handling.\n');
  
  let netlifyProcess = null;
  
  try {
    // Check if Netlify dev is already running
    const isRunning = await checkNetlifyDev();
    
    if (!isRunning) {
      console.log('\n📋 Netlify dev is not running. Starting it now...');
      try {
        netlifyProcess = await startNetlifyDev();
        console.log('✅ Netlify dev started successfully');
        
        // Wait a bit more and verify it's working
        await new Promise(resolve => setTimeout(resolve, 2000));
        const isNowRunning = await checkNetlifyDev();
        if (!isNowRunning) {
          throw new Error('Netlify dev started but is not responding');
        }
      } catch (error) {
        console.log(`❌ Failed to start Netlify dev: ${error.message}`);
        console.log('\n📝 Please manually start Netlify dev:');
        console.log('   npm run netlify:dev');
        console.log('   or');
        console.log('   netlify dev --port 8888');
        process.exit(1);
      }
    }
    
    // Run the tests
    const testResults = [];
    
    // Test 1: Simple upload tests
    testResults.push(await runTest('test-upload-simple.js', 'Simple Upload Tests'));
    
    // Test 2: Client-side profile service tests
    testResults.push(await runTest('test-profile-client.js', 'Profile Client Service Tests'));
    
    // Summary
    console.log('\n📊 Test Summary');
    console.log('================');
    const passedTests = testResults.filter(Boolean).length;
    const totalTests = testResults.length;
    
    console.log(`✅ Passed: ${passedTests}/${totalTests} test suites`);
    
    if (passedTests === totalTests) {
      console.log('\n🎉 All tests passed! Profile upload functionality is working correctly.');
      console.log('\n📝 What was tested:');
      console.log('   ✅ Profile image upload endpoint');
      console.log('   ✅ Professional image upload endpoint');
      console.log('   ✅ Client-side service functions');
      console.log('   ✅ Error handling for invalid files');
      console.log('   ✅ Firebase Storage integration');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the output above for details.');
    }
    
  } catch (error) {
    console.log(`❌ Test runner failed: ${error.message}`);
  } finally {
    // Clean up: kill Netlify dev if we started it
    if (netlifyProcess) {
      console.log('\n🧹 Cleaning up: stopping Netlify dev...');
      netlifyProcess.kill();
    }
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n🛑 Test runner interrupted by user');
  process.exit(0);
});

// Run the main function
main().catch(console.error);