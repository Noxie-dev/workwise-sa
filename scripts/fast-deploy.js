#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting fast deployment...');

// Check if build exists and is recent
const distPath = 'dist/public';
const buildTime = fs.existsSync(distPath) ? fs.statSync(distPath).mtime : null;
const shouldRebuild = !buildTime || (Date.now() - buildTime.getTime()) > 5 * 60 * 1000; // 5 minutes

if (shouldRebuild) {
  console.log('📦 Building application...');
  execSync('npm run build', { stdio: 'inherit' });
} else {
  console.log('✅ Using existing build (less than 5 minutes old)');
}

// Deploy to Netlify with optimizations
console.log('🌐 Deploying to Netlify...');
try {
  execSync('netlify deploy --prod --timeout=300', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      NETLIFY_TIMEOUT: '300000', // 5 minutes timeout
    }
  });
  console.log('✅ Deployment successful!');
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}