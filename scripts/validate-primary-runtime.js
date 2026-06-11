#!/usr/bin/env node

import fs from 'fs';

const errors = [];
const warnings = [];

const requiredEnv = ['DATABASE_URL', 'FIREBASE_PROJECT_ID', 'FIREBASE_STORAGE_BUCKET'];

const optionalButImportantEnv = ['FILE_SERVE_URL', 'GOOGLE_GENAI_API_KEY', 'SCRAPING_INGEST_TOKEN'];

function checkFile(path) {
  if (!fs.existsSync(path)) {
    errors.push(`Missing required build artifact: ${path}`);
  }
}

function checkEnv(name) {
  if (!process.env[name]) {
    errors.push(`Missing required environment variable: ${name}`);
  }
}

for (const name of requiredEnv) {
  checkEnv(name);
}

for (const name of optionalButImportantEnv) {
  if (!process.env[name]) {
    warnings.push(`Optional but recommended environment variable is not set: ${name}`);
  }
}

if ((process.env.DATABASE_URL || '').startsWith('sqlite')) {
  errors.push('Primary production deployment cannot use a SQLite DATABASE_URL');
}

if (process.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  errors.push('Primary production deployment cannot run with VITE_USE_FIREBASE_EMULATORS=true');
}

if (process.env.VITE_USE_MOCK_PUBLIC_DATA === 'true') {
  errors.push('Primary production deployment cannot run with VITE_USE_MOCK_PUBLIC_DATA=true');
}

checkFile('dist/index.js');
checkFile('dist/public/index.html');

console.log('Validating canonical Express deployment artifacts...');

if (warnings.length) {
  for (const warning of warnings) {
    console.warn(`WARN: ${warning}`);
  }
}

if (errors.length) {
  for (const error of errors) {
    console.error(`ERROR: ${error}`);
  }
  process.exit(1);
}

console.log('Primary deployment contract validated.');
