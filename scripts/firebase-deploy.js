#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🔥 Starting Firebase deployment...');

// Check if we're logged in to Firebase
try {
  const projects = execSync('firebase projects:list', { encoding: 'utf8' });
  console.log('✅ Firebase authentication verified');
  
  // Check current project
  const currentProject = execSync('firebase use', { encoding: 'utf8' });
  console.log(`📋 Current project: ${currentProject.trim()}`);
} catch (error) {
  console.error('❌ Firebase authentication failed. Please run: firebase login');
  process.exit(1);
}

// Validate Firebase configuration
if (!fs.existsSync('firebase.json')) {
  console.error('❌ firebase.json not found');
  process.exit(1);
}

if (!fs.existsSync('.firebaserc')) {
  console.error('❌ .firebaserc not found');
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

// Validate build output
const criticalFiles = ['index.html'];
const missingFiles = criticalFiles.filter(file => 
  !fs.existsSync(`${distPath}/${file}`)
);

if (missingFiles.length > 0) {
  console.error('❌ Missing critical files in build:', missingFiles);
  process.exit(1);
}

// Deploy to Firebase
console.log('🚀 Deploying to Firebase...');
try {
  // Get deployment target from command line args or default to hosting
  const deployTarget = process.argv[2] || 'hosting';
  
  if (deployTarget === 'all') {
    console.log('📡 Deploying all services (hosting + functions + firestore)...');
    execSync('firebase deploy', { stdio: 'inherit' });
  } else if (deployTarget === 'functions') {
    console.log('⚡ Deploying functions only...');
    execSync('firebase deploy --only functions', { stdio: 'inherit' });
  } else {
    console.log('📡 Deploying hosting...');
    execSync('firebase deploy --only hosting', { stdio: 'inherit' });
  }
  
  // Post-deployment verification
  console.log('🔍 Verifying deployment...');
  try {
    const projectInfo = execSync('firebase projects:list --json', { encoding: 'utf8' });
    const projects = JSON.parse(projectInfo);
    const currentProject = projects.find(p => p.id === 'workwise-sa-project');
    
    if (currentProject) {
      console.log('✅ Firebase deployment successful!');
      console.log(`🌐 Your app is live at: https://${currentProject.id}.web.app`);
      console.log(`🌐 Custom domain: https://${currentProject.id}.firebaseapp.com`);
    }
  } catch (verifyError) {
    console.warn('⚠️  Could not verify deployment, but deploy command succeeded');
  }
  
  // Show next steps
  console.log('\n📋 Post-deployment checklist:');
  console.log('□ Test the live site');
  console.log('□ Check Firebase Console for any issues');
  console.log('□ Verify security rules if updated');
  console.log('□ Monitor function logs if functions were deployed');
  
} catch (error) {
  console.error('❌ Firebase deployment failed:', error.message);
  
  // Try to get more detailed error info
  try {
    console.log('📋 Getting Firebase project status...');
    execSync('firebase projects:list', { stdio: 'inherit' });
  } catch (statusError) {
    console.warn('Could not get project status');
  }
  
  process.exit(1);
}