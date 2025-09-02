#!/usr/bin/env node

/**
 * Validates Firebase configuration and deployment readiness
 */

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🔥 Validating Firebase configuration...\n');

let hasErrors = false;
let hasWarnings = false;

const error = (message) => {
  console.error(`❌ ${message}`);
  hasErrors = true;
};

const warning = (message) => {
  console.warn(`⚠️  ${message}`);
  hasWarnings = true;
};

const success = (message) => {
  console.log(`✅ ${message}`);
};

// Check Firebase CLI
try {
  const version = execSync('firebase --version', { encoding: 'utf8' }).trim();
  if (parseFloat(version) >= 14.0) {
    success(`Firebase CLI version: ${version}`);
  } else {
    warning(`Firebase CLI version ${version} - consider updating to 14.0+`);
  }
} catch (err) {
  error('Firebase CLI not installed or not in PATH');
}

// Check authentication
try {
  execSync('firebase projects:list', { stdio: 'pipe' });
  success('Firebase authentication verified');
} catch (err) {
  error('Firebase authentication failed - run: firebase login');
}

// Check project configuration
if (fs.existsSync('.firebaserc')) {
  success('.firebaserc configuration file exists');
  
  try {
    const firebaserc = JSON.parse(fs.readFileSync('.firebaserc', 'utf8'));
    if (firebaserc.projects && firebaserc.projects.default) {
      success(`Default project: ${firebaserc.projects.default}`);
    } else {
      error('No default project configured in .firebaserc');
    }
  } catch (err) {
    error('Invalid .firebaserc file format');
  }
} else {
  error('.firebaserc file missing - run: firebase init');
}

// Check firebase.json
if (fs.existsSync('firebase.json')) {
  success('firebase.json configuration file exists');
  
  try {
    const firebaseJson = JSON.parse(fs.readFileSync('firebase.json', 'utf8'));
    
    // Check hosting configuration
    if (firebaseJson.hosting) {
      success('Hosting configuration found');
      
      if (firebaseJson.hosting.public === 'dist/public') {
        success('Hosting public directory correctly set to dist/public');
      } else {
        warning(`Hosting public directory is ${firebaseJson.hosting.public}, expected dist/public`);
      }
      
      if (firebaseJson.hosting.rewrites && firebaseJson.hosting.rewrites.length > 0) {
        success('URL rewrites configured');
      } else {
        warning('No URL rewrites configured - SPA routing may not work');
      }
      
      if (firebaseJson.hosting.headers && firebaseJson.hosting.headers.length > 0) {
        success('Security headers configured');
      } else {
        warning('No security headers configured');
      }
    } else {
      warning('No hosting configuration found');
    }
    
    // Check functions configuration
    if (firebaseJson.functions) {
      success('Functions configuration found');
      
      if (Array.isArray(firebaseJson.functions)) {
        firebaseJson.functions.forEach((func, index) => {
          if (func.source && fs.existsSync(func.source)) {
            success(`Functions source directory exists: ${func.source}`);
          } else {
            error(`Functions source directory missing: ${func.source}`);
          }
        });
      }
    } else {
      warning('No functions configuration found');
    }
    
    // Check Firestore configuration
    if (firebaseJson.firestore) {
      success('Firestore configuration found');
      
      if (firebaseJson.firestore.rules && fs.existsSync(firebaseJson.firestore.rules)) {
        success('Firestore rules file exists');
      } else {
        warning('Firestore rules file missing or not configured');
      }
    } else {
      warning('No Firestore configuration found');
    }
    
    // Check Storage configuration
    if (firebaseJson.storage) {
      success('Storage configuration found');
      
      if (firebaseJson.storage.rules && fs.existsSync(firebaseJson.storage.rules)) {
        success('Storage rules file exists');
      } else {
        warning('Storage rules file missing or not configured');
      }
    } else {
      warning('No Storage configuration found');
    }
    
  } catch (err) {
    error('Invalid firebase.json file format');
  }
} else {
  error('firebase.json file missing - run: firebase init');
}

// Check functions directory if configured
if (fs.existsSync('functions')) {
  success('Functions directory exists');
  
  if (fs.existsSync('functions/package.json')) {
    success('Functions package.json exists');
    
    try {
      const pkg = JSON.parse(fs.readFileSync('functions/package.json', 'utf8'));
      
      if (pkg.engines && pkg.engines.node) {
        const nodeVersion = pkg.engines.node.replace(/[^\d.]/g, '');
        if (parseFloat(nodeVersion) >= 20) {
          success(`Functions Node.js version: ${pkg.engines.node}`);
        } else {
          warning(`Functions Node.js version ${pkg.engines.node} - consider updating to 20+`);
        }
      } else {
        warning('Functions Node.js version not specified');
      }
      
      // Check for required dependencies
      const requiredDeps = ['firebase-admin', 'firebase-functions'];
      requiredDeps.forEach(dep => {
        if (pkg.dependencies && pkg.dependencies[dep]) {
          success(`Functions dependency: ${dep}@${pkg.dependencies[dep]}`);
        } else {
          error(`Missing functions dependency: ${dep}`);
        }
      });
      
    } catch (err) {
      error('Invalid functions/package.json file');
    }
  } else {
    error('functions/package.json missing');
  }
  
  if (fs.existsSync('functions/index.js')) {
    success('Functions entry point exists');
  } else {
    error('functions/index.js missing');
  }
} else {
  warning('Functions directory not found');
}

// Check build output
if (fs.existsSync('dist/public')) {
  success('Build output directory exists');
  
  if (fs.existsSync('dist/public/index.html')) {
    success('Build output contains index.html');
  } else {
    warning('Build output missing index.html - run npm run build');
  }
} else {
  warning('Build output directory missing - run npm run build');
}

// Check current project
try {
  const currentProject = execSync('firebase use', { encoding: 'utf8' }).trim();
  success(`Currently using project: ${currentProject}`);
} catch (err) {
  warning('No Firebase project currently selected');
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('🔥 FIREBASE VALIDATION SUMMARY');
console.log('='.repeat(50));

if (hasErrors) {
  console.log('❌ Configuration has errors that must be fixed before deployment');
  console.log('\n🔧 Common fixes:');
  console.log('   firebase login          # Authenticate with Firebase');
  console.log('   firebase init           # Initialize Firebase project');
  console.log('   npm run build          # Build the application');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  Configuration is functional but has warnings');
  console.log('   Consider addressing warnings for optimal deployment');
  process.exit(0);
} else {
  console.log('✅ Firebase configuration is ready for deployment!');
  console.log('\n🚀 Next steps:');
  console.log('   npm run deploy:firebase     # Deploy hosting');
  console.log('   npm run deploy:firebase:all # Deploy everything');
  process.exit(0);
}