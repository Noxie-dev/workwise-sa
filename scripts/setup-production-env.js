#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const REQUIRED_ENV_VARS = [
  'NODE_ENV',
  'DATABASE_URL',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_SERVICE_ACCOUNT',
  'GOOGLE_GENAI_API_KEY',
  'VITE_USE_FIREBASE_EMULATORS',
  'VITE_BACKEND_API_URL'
];

function setNetlifyEnvVars() {
  console.log('🚀 Setting up Netlify environment variables...');
  
  const envVars = {
    'NODE_ENV': 'production',
    'FIREBASE_PROJECT_ID': 'workwise-sa-project',
    'FIREBASE_STORAGE_BUCKET': 'workwise-sa-project.appspot.com',
    'VITE_USE_FIREBASE_EMULATORS': 'false',
    'VITE_FIREBASE_PROJECT_ID': 'workwise-sa-project',
    'VITE_FIREBASE_AUTH_DOMAIN': 'workwise-sa-project.firebaseapp.com',
    'VITE_FIREBASE_STORAGE_BUCKET': 'workwise-sa-project.appspot.com',
    'VITE_FIREBASE_API_KEY': 'AIzaSyDygjMpaMXBEBcRnVVtOxW41nD7DA-cXJY',
    'VITE_FIREBASE_MESSAGING_SENDER_ID': '716919248302',
    'VITE_FIREBASE_APP_ID': '1:716919248302:web:582684fa2eb06133aca43f'
  };

  // Set basic environment variables
  for (const [key, value] of Object.entries(envVars)) {
    try {
      execSync(`netlify env:set ${key} "${value}"`, { stdio: 'inherit' });
      console.log(`✅ Set ${key}`);
    } catch (error) {
      console.error(`❌ Failed to set ${key}:`, error.message);
    }
  }

  console.log('\n⚠️  You still need to manually set these sensitive variables:');
  console.log('netlify env:set DATABASE_URL "your_production_database_url"');
  console.log('netlify env:set FIREBASE_SERVICE_ACCOUNT \'{"type":"service_account",...}\'');
  console.log('netlify env:set GOOGLE_GENAI_API_KEY "your_api_key"');
  console.log('netlify env:set VITE_BACKEND_API_URL "https://your-domain.netlify.app/api"');
}

function checkNetlifyEnv() {
  console.log('🔍 Checking Netlify environment variables...');
  try {
    execSync('netlify env:list', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Failed to list environment variables. Make sure you\'re logged in to Netlify CLI.');
  }
}

function main() {
  const command = process.argv[2];

  switch (command) {
    case 'set':
      setNetlifyEnvVars();
      break;
    case 'check':
      checkNetlifyEnv();
      break;
    case 'help':
    default:
      console.log(`
🔧 Production Environment Setup

Usage:
  node scripts/setup-production-env.js [command]

Commands:
  set     Set up basic Netlify environment variables
  check   List current Netlify environment variables
  help    Show this help message

Examples:
  node scripts/setup-production-env.js set
  node scripts/setup-production-env.js check
      `);
  }
}

main();