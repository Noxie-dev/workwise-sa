#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const mode = process.argv[2] || 'primary';
const rootDir = process.cwd();

dotenv.config({ path: path.join(rootDir, '.env') });
dotenv.config({ path: path.join(rootDir, 'client/.env') });

const errors = [];
const warnings = [];
const passes = [];

const addPass = (message) => passes.push(message);
const addWarning = (message) => warnings.push(message);
const addError = (message) => errors.push(message);

const has = (key) => typeof process.env[key] === 'string' && process.env[key].trim().length > 0;
const value = (key) => process.env[key]?.trim() || '';
const looksPlaceholder = (input) => {
  if (!input) return false;
  const normalized = input.toLowerCase();
  return ['your_', 'placeholder', 'changeme', 'example', 'dummy'].some((token) => normalized.includes(token));
};

const checkFileExists = (label, targetPath) => {
  if (!targetPath) {
    addError(`${label} is missing`);
    return;
  }

  if (!fs.existsSync(targetPath)) {
    addError(`${label} does not exist: ${targetPath}`);
    return;
  }

  addPass(`${label} exists`);
};

const verifyDatabase = () => {
  const databaseUrl = value('DATABASE_URL');
  if (!databaseUrl) {
    addError('DATABASE_URL is missing');
    return;
  }

  if (mode === 'primary' && databaseUrl.startsWith('sqlite')) {
    addError('Primary production mode requires PostgreSQL, not SQLite');
    return;
  }

  if (databaseUrl.startsWith('sqlite')) {
    addPass('SQLite database configured for local/dev mode');
  } else {
    addPass('PostgreSQL-style DATABASE_URL configured');
  }
};

const verifyFileStorage = () => {
  const uploadDir = value('UPLOAD_DIR') || 'uploads';
  const absoluteUploadDir = path.isAbsolute(uploadDir) ? uploadDir : path.join(rootDir, uploadDir);
  const baseUrl = value('FILE_SERVE_URL');

  if (!fs.existsSync(absoluteUploadDir)) {
    addWarning(`Upload directory does not exist yet: ${absoluteUploadDir}`);
  } else {
    addPass(`Upload directory exists: ${absoluteUploadDir}`);
  }

  if (!baseUrl) {
    if (mode === 'primary') {
      addError('FILE_SERVE_URL is required for primary production file URLs');
    } else {
      addWarning('FILE_SERVE_URL is missing; local file URLs will rely on runtime fallbacks');
    }
  } else {
    addPass('FILE_SERVE_URL is configured');
  }
};

const verifyFirebase = () => {
  const serverKeys = ['FIREBASE_PROJECT_ID', 'FIREBASE_STORAGE_BUCKET'];
  const clientKeys = [
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_APP_ID',
  ];

  for (const key of serverKeys) {
    if (!has(key)) addError(`Missing Firebase server config: ${key}`);
    else addPass(`${key} configured`);
  }

  for (const key of clientKeys) {
    if (!has(key) || looksPlaceholder(value(key))) {
      if (mode === 'local' && value('VITE_USE_FIREBASE_EMULATORS') === 'true') {
        addWarning(`Firebase client key ${key} is missing or placeholder, but emulator mode is enabled`);
      } else {
        addError(`Missing or placeholder Firebase client config: ${key}`);
      }
    } else {
      addPass(`${key} configured`);
    }
  }

  if (mode === 'primary') {
    if (value('VITE_USE_FIREBASE_EMULATORS') === 'true') {
      addError('Primary production mode cannot use Firebase emulators');
    } else {
      addPass('Firebase emulators disabled for primary mode');
    }

    if (!has('GOOGLE_APPLICATION_CREDENTIALS') && !has('FIREBASE_SERVICE_ACCOUNT')) {
      addWarning('No Firebase Admin credential hint found; ensure workload identity or mounted credentials exist in the deployment environment');
    } else if (has('GOOGLE_APPLICATION_CREDENTIALS')) {
      checkFileExists('GOOGLE_APPLICATION_CREDENTIALS', value('GOOGLE_APPLICATION_CREDENTIALS'));
    } else {
      addPass('FIREBASE_SERVICE_ACCOUNT is set');
    }
  } else if (value('VITE_USE_FIREBASE_EMULATORS') === 'true') {
    addPass('Firebase emulator mode enabled for local development');
  } else {
    addWarning('Firebase emulator mode is disabled in local mode; real Firebase credentials will be used');
  }
};

const verifyFeatureProviders = () => {
  if (has('GOOGLE_GENAI_API_KEY') && !looksPlaceholder(value('GOOGLE_GENAI_API_KEY'))) {
    addPass('Gemini API key configured');
  } else {
    addWarning('GOOGLE_GENAI_API_KEY is missing; production AI features will fail');
  }

  if (has('REDIS_URL')) {
    addPass('REDIS_URL configured');
  } else {
    addWarning('REDIS_URL is missing; cache service will run without Redis');
  }

  if (has('SCRAPING_INGEST_TOKEN')) {
    addPass('SCRAPING_INGEST_TOKEN configured');
  } else {
    addWarning('SCRAPING_INGEST_TOKEN is missing; protected ingest should remain disabled or internal-only');
  }

  const smsProvider = value('SMS_PROVIDER');
  const smsApiKey = value('SMS_API_KEY');
  if (!smsProvider && !smsApiKey) {
    addWarning('SMS provider is not configured; SMS delivery remains stubbed');
  } else if (!smsProvider || !smsApiKey) {
    addError('SMS configuration is partial; both SMS_PROVIDER and SMS_API_KEY are required together');
  } else {
    addPass(`SMS provider configured: ${smsProvider}`);
  }
};

const verifyFrontendFlags = () => {
  if (mode === 'primary' && value('VITE_USE_MOCK_PUBLIC_DATA') === 'true') {
    addError('Primary production mode cannot use VITE_USE_MOCK_PUBLIC_DATA=true');
  } else if (value('VITE_USE_MOCK_PUBLIC_DATA') === 'true') {
    addWarning('Mock public data is enabled');
  } else {
    addPass('Mock public data disabled');
  }

  const viteApiUrl = value('VITE_API_URL');
  if (!viteApiUrl) {
    addWarning('VITE_API_URL is not set; browser clients will rely on same-origin defaults');
  } else {
    addPass(`VITE_API_URL configured: ${viteApiUrl}`);
  }
};

console.log(`Verifying supported environment wiring for mode: ${mode}`);

if (!['primary', 'local'].includes(mode)) {
  addError(`Unsupported mode "${mode}". Use "primary" or "local".`);
} else {
  verifyDatabase();
  verifyFileStorage();
  verifyFirebase();
  verifyFeatureProviders();
  verifyFrontendFlags();
}

for (const pass of passes) {
  console.log(`PASS: ${pass}`);
}

for (const warning of warnings) {
  console.warn(`WARN: ${warning}`);
}

for (const error of errors) {
  console.error(`ERROR: ${error}`);
}

if (errors.length > 0) {
  process.exit(1);
}

console.log('Supported environment verification completed without blocking errors.');
