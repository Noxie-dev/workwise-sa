#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🔥 Starting Firebase deployment...');

// Check if we're logged in to Firebase
try {
  execSync('firebase projects:list', { stdio: 'pipe' });
  console.log('✅ Firebase authentication verified');
} catch (error) {
  console.error('❌ Firebase authentication failed. Please run: firebase login');
  process.exit(1);
}

// Check if build exists and is recent
const distPath = 'dist/public';
const buildTime = fs.existsSync(distPath) ? fs.statSync(distPath).mtime : null;
const shouldRebuild = !buildTime || (Date.now() - buildTime.getTime()) > 5 * 60 * 1000; // 5 minutes

if (shouldRebuild) {
  console.log('📦 Building application...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build completed successfully');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Using existing build (less than 5 minutes old)');
}

// Deploy to Firebase
console.log('🚀 Deploying to Firebase...');
try {
  // Deploy hosting first (faster)
  console.log('📡 Deploying hosting...');
  execSync('firebase deploy --only hosting', { stdio: 'inherit' });
  
  // Ask if user wants to deploy functions too
  console.log('🔧 Hosting deployed successfully!');
  console.log('💡 To deploy functions as well, run: npm run firebase:deploy:functions');
  
  console.log('✅ Firebase deployment successful!');
  console.log('🌐 Your app is now live at: https://workwise-sa-project.web.app');
} catch (error) {
  console.error('❌ Firebase deployment failed:', error.message);
  process.exit(1);
}