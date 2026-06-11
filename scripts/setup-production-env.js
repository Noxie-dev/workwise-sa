#!/usr/bin/env node

const REQUIRED_ENV_VARS = [
  'NODE_ENV',
  'DATABASE_URL',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'GOOGLE_GENAI_API_KEY',
  'VITE_USE_FIREBASE_EMULATORS',
  'VITE_API_URL',
];

function printPrimaryEnvTemplate() {
  console.log('Primary Express deployment environment template:\n');
  console.log(`NODE_ENV=production
PORT=3001
DATABASE_URL=postgres://postgres:postgres@localhost:5432/workwise_sa
FILE_SERVE_URL=https://your-domain.example/uploads
UPLOAD_DIR=uploads
FIREBASE_PROJECT_ID=workwise-sa-project
FIREBASE_STORAGE_BUCKET=workwise-sa-project.appspot.com
GOOGLE_GENAI_API_KEY=your_google_genai_api_key_here
SCRAPING_INGEST_TOKEN=your_scraping_ingest_token_here
VITE_API_URL=/api
VITE_USE_FIREBASE_EMULATORS=false
VITE_USE_MOCK_PUBLIC_DATA=false
VITE_FIREBASE_PROJECT_ID=workwise-sa-project
VITE_FIREBASE_AUTH_DOMAIN=workwise-sa-project.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=workwise-sa-project.appspot.com
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_APP_ID=your_firebase_app_id_here`);
}

function checkPrimaryEnv() {
  console.log('Checking canonical production environment...');

  let hasErrors = false;
  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key]) {
      console.error(`❌ Missing ${key}`);
      hasErrors = true;
    } else {
      console.log(`✅ ${key}`);
    }
  }

  if ((process.env.DATABASE_URL || '').startsWith('sqlite')) {
    console.error('❌ DATABASE_URL points to SQLite. Primary production requires PostgreSQL.');
    hasErrors = true;
  }

  if (process.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
    console.error('❌ VITE_USE_FIREBASE_EMULATORS must be false in primary production.');
    hasErrors = true;
  }

  if (process.env.VITE_USE_MOCK_PUBLIC_DATA === 'true') {
    console.error('❌ VITE_USE_MOCK_PUBLIC_DATA must be false in primary production.');
    hasErrors = true;
  }

  if (!process.env.FILE_SERVE_URL) {
    console.warn('⚠️  FILE_SERVE_URL is not set. Uploaded file URLs may be incorrect.');
  }

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.warn(
      '⚠️  No Firebase Admin credential hint found. Ensure workload identity or GOOGLE_APPLICATION_CREDENTIALS is configured in the target environment.'
    );
  }

  if (hasErrors) {
    process.exit(1);
  }

  console.log('✅ Canonical production environment looks valid');
}

function main() {
  const command = process.argv[2];

  switch (command) {
    case 'set':
      printPrimaryEnvTemplate();
      break;
    case 'check':
      checkPrimaryEnv();
      break;
    case 'help':
    default:
      console.log(`
🔧 Production Environment Setup

Usage:
  node scripts/setup-production-env.js [command]

Commands:
  set     Print the canonical Express production env template
  check   Validate the current environment for the primary production path
  help    Show this help message

Examples:
  node scripts/setup-production-env.js set
  node scripts/setup-production-env.js check
      `);
  }
}

main();
