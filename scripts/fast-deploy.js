#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting fast deployment...');

// Check if build exists and is recent
const distPath = 'dist/public';
const buildTime = fs.existsSync(distPath) ? fs.statSync(distPath).mtime : null;
const shouldRebuild = !buildTime || Date.now() - buildTime.getTime() > 5 * 60 * 1000; // 5 minutes

if (shouldRebuild) {
  console.log('📦 Building application...');
  execSync('pnpm run build', { stdio: 'inherit' });
} else {
  console.log('✅ Using existing build (less than 5 minutes old)');
}

// Pre-deployment checks
console.log('🔍 Running pre-deployment checks...');
try {
  // Check if functions are valid
  execSync('netlify functions:list', { stdio: 'pipe' });
  console.log('✅ Functions validation passed');
} catch (error) {
  console.warn('⚠️  Functions validation warning:', error.message);
}

// Deploy to Netlify with optimizations
console.log('🌐 Deploying to Netlify...');
try {
  execSync('netlify deploy --prod --timeout=600 --json', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NETLIFY_TIMEOUT: '600000', // 10 minutes timeout
      NODE_OPTIONS: '--max-old-space-size=4096', // Increase memory for large builds
    },
  });

  // Post-deployment verification
  console.log('🔍 Verifying deployment...');
  execSync('netlify status', { stdio: 'inherit' });

  console.log('✅ Deployment successful!');
  console.log('🌐 Your site is live at: https://beamish-sawine-64ddd4.netlify.app');
} catch (error) {
  console.error('❌ Deployment failed:', error.message);

  // Try to get deployment logs for debugging
  try {
    console.log('📋 Getting deployment logs...');
    execSync('netlify logs:deploy', { stdio: 'inherit' });
  } catch (logError) {
    console.warn('Could not retrieve deployment logs');
  }

  process.exit(1);
}
