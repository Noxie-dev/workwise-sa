#!/usr/bin/env node

/**
 * Validates security headers and configuration
 */

import https from 'https';

const SITE_URL = 'https://beamish-sawine-64ddd4.netlify.app';

console.log('🔒 Validating security configuration...\n');

// Required security headers
const requiredHeaders = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': ['SAMEORIGIN', 'DENY'],
  'x-xss-protection': '1; mode=block',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'strict-transport-security': 'max-age=31536000',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()'
};

// Helper function to make HTTP requests
const checkHeaders = (url) => {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      resolve({
        statusCode: response.statusCode,
        headers: response.headers
      });
    });
    
    request.on('error', reject);
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
};

const testEndpoints = [
  { name: 'Homepage', url: SITE_URL },
  { name: 'API Endpoint', url: `${SITE_URL}/api` },
  { name: 'Static Asset', url: `${SITE_URL}/assets` }
];

let totalTests = 0;
let passedTests = 0;

for (const endpoint of testEndpoints) {
  console.log(`🔍 Testing ${endpoint.name}: ${endpoint.url}`);
  
  try {
    const response = await checkHeaders(endpoint.url);
    
    for (const [headerName, expectedValue] of Object.entries(requiredHeaders)) {
      totalTests++;
      const actualValue = response.headers[headerName] || response.headers[headerName.toLowerCase()];
      
      if (!actualValue) {
        console.log(`   ❌ Missing header: ${headerName}`);
        continue;
      }
      
      // Check if expected value is an array (multiple valid values)
      if (Array.isArray(expectedValue)) {
        if (expectedValue.some(val => actualValue.includes(val))) {
          console.log(`   ✅ ${headerName}: ${actualValue}`);
          passedTests++;
        } else {
          console.log(`   ❌ ${headerName}: ${actualValue} (expected one of: ${expectedValue.join(', ')})`);
        }
      } else {
        if (actualValue.includes(expectedValue)) {
          console.log(`   ✅ ${headerName}: ${actualValue}`);
          passedTests++;
        } else {
          console.log(`   ❌ ${headerName}: ${actualValue} (expected: ${expectedValue})`);
        }
      }
    }
    
    // Check Content Security Policy
    totalTests++;
    const csp = response.headers['content-security-policy'];
    if (csp) {
      console.log(`   ✅ content-security-policy: Present`);
      passedTests++;
    } else {
      console.log(`   ❌ content-security-policy: Missing`);
    }
    
    console.log('');
    
  } catch (error) {
    console.error(`   ❌ Failed to test ${endpoint.name}: ${error.message}\n`);
  }
}

// Security score
const score = Math.round((passedTests / totalTests) * 100);

console.log('='.repeat(50));
console.log('🔒 SECURITY VALIDATION RESULTS');
console.log('='.repeat(50));
console.log(`Score: ${score}% (${passedTests}/${totalTests} tests passed)`);

if (score >= 90) {
  console.log('🎉 Excellent security configuration!');
} else if (score >= 70) {
  console.log('⚠️  Good security, but some improvements needed');
} else {
  console.log('❌ Security configuration needs significant improvement');
}

console.log('\n📋 Security Checklist:');
console.log('□ HTTPS enforced');
console.log('□ Content Security Policy configured');
console.log('□ XSS protection enabled');
console.log('□ Clickjacking protection (X-Frame-Options)');
console.log('□ MIME type sniffing disabled');
console.log('□ Referrer policy configured');
console.log('□ Permissions policy set');

if (score < 100) {
  console.log('\n🔧 To fix issues:');
  console.log('1. Redeploy with: npm run deploy:fast');
  console.log('2. Check Netlify dashboard for any configuration overrides');
  console.log('3. Verify _headers file is being generated correctly');
}

process.exit(score >= 70 ? 0 : 1);