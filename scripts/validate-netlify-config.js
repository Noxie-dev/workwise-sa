#!/usr/bin/env node

/**
 * Validates Netlify deployment configuration
 * Ensures all required files and settings are in place
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🔍 Validating Netlify deployment configuration...\n');

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

// Check Netlify CLI
try {
  const version = execSync('netlify --version', { encoding: 'utf8' }).trim();
  if (version.includes('23.1.3') || version.includes('23.')) {
    success(`Netlify CLI version: ${version}`);
  } else {
    warning(`Netlify CLI version ${version} - consider updating to 23.1.3+`);
  }
} catch (err) {
  error('Netlify CLI not installed or not in PATH');
}

// Check netlify.toml
if (fs.existsSync('netlify.toml')) {
  success('netlify.toml configuration file exists');
  
  const tomlContent = fs.readFileSync('netlify.toml', 'utf8');
  
  // Check for required sections
  if (tomlContent.includes('[build]')) {
    success('Build configuration found');
  } else {
    error('Missing [build] section in netlify.toml');
  }
  
  if (tomlContent.includes('[functions]')) {
    success('Functions configuration found');
  } else {
    warning('No [functions] section in netlify.toml');
  }
  
  if (tomlContent.includes('NODE_VERSION = "20"')) {
    success('Node.js 20 configured');
  } else {
    warning('Node.js version not set to 20 in netlify.toml');
  }
  
  if (tomlContent.includes('streaming = true')) {
    success('Function streaming enabled');
  } else {
    warning('Function streaming not enabled - consider adding for better performance');
  }
  
} else {
  error('netlify.toml configuration file missing');
}

// Check build directory structure
if (fs.existsSync('dist/public')) {
  success('Build output directory exists');
} else {
  warning('Build output directory (dist/public) not found - run npm run build first');
}

// Check functions directory
if (fs.existsSync('netlify/functions')) {
  success('Functions directory exists');
  
  const functionsPackageJson = 'netlify/functions/package.json';
  if (fs.existsSync(functionsPackageJson)) {
    success('Functions package.json exists');
    
    const pkg = JSON.parse(fs.readFileSync(functionsPackageJson, 'utf8'));
    if (pkg.type === 'module') {
      success('Functions configured as ES modules');
    } else {
      warning('Functions not configured as ES modules - consider updating');
    }
    
    if (pkg.engines && pkg.engines.node && pkg.engines.node.includes('20')) {
      success('Functions Node.js version specified');
    } else {
      warning('Functions Node.js version not specified');
    }
  } else {
    warning('Functions package.json missing');
  }
} else {
  warning('Functions directory not found');
}

// Check environment files
if (fs.existsSync('.env.example')) {
  success('Environment example file exists');
} else {
  warning('No .env.example file found');
}

if (fs.existsSync('.env.production')) {
  success('Production environment file exists');
} else {
  warning('No .env.production file - run npm run netlify:prepare');
}

// Check package.json scripts
if (fs.existsSync('package.json')) {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const requiredScripts = [
    'netlify:build',
    'netlify:prepare',
    'deploy:fast',
    'deploy:prod'
  ];
  
  requiredScripts.forEach(script => {
    if (pkg.scripts && pkg.scripts[script]) {
      success(`Script "${script}" configured`);
    } else {
      warning(`Script "${script}" missing from package.json`);
    }
  });
} else {
  error('package.json not found');
}

// Check for security files
const securityFiles = [
  'scripts/netlify-post-build.js',
  'NETLIFY_DEPLOYMENT_GUIDE.md'
];

securityFiles.forEach(file => {
  if (fs.existsSync(file)) {
    success(`${file} exists`);
  } else {
    warning(`${file} missing - deployment may not be optimized`);
  }
});

// Check Netlify site connection
try {
  const status = execSync('netlify status', { encoding: 'utf8' });
  if (status.includes('Current project:')) {
    success('Connected to Netlify site');
  } else {
    warning('Not connected to a Netlify site - run netlify link');
  }
} catch (err) {
  warning('Could not check Netlify site connection');
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 VALIDATION SUMMARY');
console.log('='.repeat(50));

if (hasErrors) {
  console.log('❌ Configuration has errors that must be fixed before deployment');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  Configuration is functional but has warnings');
  console.log('   Consider addressing warnings for optimal deployment');
  process.exit(0);
} else {
  console.log('✅ Configuration is ready for deployment!');
  console.log('\n🚀 Next steps:');
  console.log('   1. npm run netlify:prepare  # Set up environment variables');
  console.log('   2. npm run deploy:fast      # Deploy to Netlify');
  process.exit(0);
}