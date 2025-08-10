#!/usr/bin/env node

/**
 * Tests the deployed Netlify site to ensure everything is working
 */

import https from 'https';
import { execSync } from 'child_process';

const SITE_URL = 'https://beamish-sawine-64ddd4.netlify.app';

console.log('🧪 Testing deployed Netlify site...\n');

// Helper function to make HTTP requests
const makeRequest = (url) => {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        resolve({
          statusCode: response.statusCode,
          headers: response.headers,
          body: data
        });
      });
    });
    
    request.on('error', reject);
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
};

const tests = [
  {
    name: 'Homepage loads',
    url: SITE_URL,
    expectedStatus: 200,
    expectedContent: ['WorkWise', 'html']
  },
  {
    name: 'API endpoint responds',
    url: `${SITE_URL}/api`,
    expectedStatus: 200,
    expectedContent: ['WorkWise SA API', 'version']
  },
  {
    name: 'Build info available',
    url: `${SITE_URL}/build-info.json`,
    expectedStatus: 200,
    expectedContent: ['buildTime', 'nodeVersion']
  },
  {
    name: 'Static assets load',
    url: `${SITE_URL}/assets`,
    expectedStatus: [200, 404], // 404 is ok for directory listing
    expectedContent: null
  }
];

let passed = 0;
let failed = 0;

console.log('Running tests...\n');

for (const test of tests) {
  try {
    console.log(`🔍 ${test.name}...`);
    const response = await makeRequest(test.url);
    
    // Check status code
    const expectedStatuses = Array.isArray(test.expectedStatus) 
      ? test.expectedStatus 
      : [test.expectedStatus];
    
    if (!expectedStatuses.includes(response.statusCode)) {
      throw new Error(`Expected status ${test.expectedStatus}, got ${response.statusCode}`);
    }
    
    // Check content if specified
    if (test.expectedContent) {
      for (const content of test.expectedContent) {
        if (!response.body.includes(content)) {
          throw new Error(`Expected content "${content}" not found`);
        }
      }
    }
    
    // Check security headers
    const securityHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection'
    ];
    
    const missingHeaders = securityHeaders.filter(header => 
      !response.headers[header] && !response.headers[header.toLowerCase()]
    );
    
    if (missingHeaders.length > 0) {
      console.warn(`   ⚠️  Missing security headers: ${missingHeaders.join(', ')}`);
    }
    
    console.log(`   ✅ Passed (${response.statusCode})`);
    passed++;
    
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`);
    failed++;
  }
}

// Test Netlify Functions specifically
console.log('\n🔧 Testing Netlify Functions...');

try {
  const functionsOutput = execSync('netlify functions:list', { encoding: 'utf8' });
  if (functionsOutput.includes('api') || functionsOutput.includes('auth')) {
    console.log('   ✅ Functions deployed successfully');
    passed++;
  } else {
    console.log('   ⚠️  No functions found in deployment');
  }
} catch (error) {
  console.error('   ❌ Could not check functions:', error.message);
  failed++;
}

// Performance check
console.log('\n⚡ Performance Check...');
try {
  const start = Date.now();
  await makeRequest(SITE_URL);
  const loadTime = Date.now() - start;
  
  if (loadTime < 2000) {
    console.log(`   ✅ Fast load time: ${loadTime}ms`);
  } else if (loadTime < 5000) {
    console.log(`   ⚠️  Moderate load time: ${loadTime}ms`);
  } else {
    console.log(`   ❌ Slow load time: ${loadTime}ms`);
  }
} catch (error) {
  console.error('   ❌ Performance test failed:', error.message);
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 TEST RESULTS');
console.log('='.repeat(50));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);

if (failed === 0) {
  console.log('\n🎉 All tests passed! Deployment is successful.');
  console.log(`🌐 Site URL: ${SITE_URL}`);
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Check the deployment.');
  process.exit(1);
}