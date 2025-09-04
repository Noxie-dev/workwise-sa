#!/usr/bin/env node

/**
 * Development Environment Setup Script
 * This script helps set up the development environment and validates the configuration
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkCommand(command) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function checkFile(filePath) {
  return existsSync(filePath);
}

function checkEnvironmentVariables() {
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_APP_ID'
  ];

  const missingVars = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  return missingVars;
}

function createEnvFile() {
  const envContent = `# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=workwise-sa-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=workwise-sa-project
VITE_FIREBASE_STORAGE_BUCKET=workwise-sa-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here

# Development Settings
VITE_USE_FIREBASE_EMULATORS=false
VITE_AUTH_EMAIL_LINK_SIGN_IN_URL=http://localhost:5173/auth/email-signin-complete

# Server Configuration
PORT=3001
NODE_ENV=development
SESSION_SECRET=your_session_secret_here

# Database
DATABASE_URL=your_database_url_here

# AI Services (Optional)
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_GENAI_API_KEY=your_google_genai_api_key_here

# Twilio (for 2FA)
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_VERIFY_SERVICE_SID=your_twilio_verify_service_sid_here
`;

  if (!checkFile('.env')) {
    writeFileSync('.env', envContent);
    log('✅ Created .env file with template', 'green');
    log('⚠️  Please update the .env file with your actual values', 'yellow');
  } else {
    log('✅ .env file already exists', 'green');
  }

  if (!checkFile('client/.env')) {
    writeFileSync('client/.env', envContent);
    log('✅ Created client/.env file with template', 'green');
  } else {
    log('✅ client/.env file already exists', 'green');
  }
}

function checkDependencies() {
  log('\n🔍 Checking dependencies...', 'cyan');
  
  if (!checkFile('node_modules')) {
    log('📦 Installing dependencies...', 'yellow');
    try {
      execSync('npm install', { stdio: 'inherit' });
      log('✅ Dependencies installed successfully', 'green');
    } catch (error) {
      log('❌ Failed to install dependencies', 'red');
      return false;
    }
  } else {
    log('✅ Dependencies already installed', 'green');
  }

  if (!checkFile('client/node_modules')) {
    log('📦 Installing client dependencies...', 'yellow');
    try {
      execSync('cd client && npm install', { stdio: 'inherit' });
      log('✅ Client dependencies installed successfully', 'green');
    } catch (error) {
      log('❌ Failed to install client dependencies', 'red');
      return false;
    }
  } else {
    log('✅ Client dependencies already installed', 'green');
  }

  return true;
}

function checkDatabase() {
  log('\n🗄️  Checking database setup...', 'cyan');
  
  if (checkFile('workwise.db') || checkFile('database.db')) {
    log('✅ Database file exists', 'green');
  } else {
    log('⚠️  No database file found. Run database migrations:', 'yellow');
    log('   npm run db:migrate', 'blue');
  }
}

function checkFirebaseSetup() {
  log('\n🔥 Checking Firebase setup...', 'cyan');
  
  if (checkFile('firebase.json')) {
    log('✅ Firebase configuration exists', 'green');
  } else {
    log('❌ Firebase configuration missing', 'red');
    return false;
  }

  if (checkFile('service-account.json') || checkFile('workwise-sa-project-firebase-adminsdk-fbsvc-727ba80ab5.json')) {
    log('✅ Firebase service account exists', 'green');
  } else {
    log('⚠️  Firebase service account missing', 'yellow');
    log('   Download it from Firebase Console > Project Settings > Service Accounts', 'blue');
  }

  return true;
}

function checkPorts() {
  log('\n🌐 Checking port availability...', 'cyan');
  
  const ports = [3001, 5173];
  
  for (const port of ports) {
    try {
      execSync(`lsof -ti:${port}`, { stdio: 'ignore' });
      log(`⚠️  Port ${port} is in use`, 'yellow');
    } catch {
      log(`✅ Port ${port} is available`, 'green');
    }
  }
}

function runHealthCheck() {
  log('\n🏥 Running health check...', 'cyan');
  
  try {
    // Check if server can start
    log('Testing server startup...', 'blue');
    execSync('timeout 10s npm run dev:server || true', { stdio: 'pipe' });
    log('✅ Server startup test completed', 'green');
  } catch (error) {
    log('⚠️  Server startup test failed', 'yellow');
  }
}

function main() {
  log('🚀 WorkWise SA Development Environment Setup', 'bright');
  log('===============================================', 'bright');

  // Check system requirements
  log('\n🔧 Checking system requirements...', 'cyan');
  
  const requiredCommands = ['node', 'npm', 'git'];
  const missingCommands = requiredCommands.filter(cmd => !checkCommand(cmd));
  
  if (missingCommands.length > 0) {
    log(`❌ Missing required commands: ${missingCommands.join(', ')}`, 'red');
    process.exit(1);
  }
  
  log('✅ All required commands are available', 'green');

  // Check Node.js version
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    log(`✅ Node.js version: ${nodeVersion}`, 'green');
  } catch {
    log('❌ Could not determine Node.js version', 'red');
  }

  // Create environment files
  log('\n📝 Setting up environment files...', 'cyan');
  createEnvFile();

  // Check environment variables
  const missingVars = checkEnvironmentVariables();
  if (missingVars.length > 0) {
    log(`⚠️  Missing environment variables: ${missingVars.join(', ')}`, 'yellow');
    log('   Please update your .env files with the correct values', 'blue');
  } else {
    log('✅ All required environment variables are set', 'green');
  }

  // Check dependencies
  if (!checkDependencies()) {
    log('❌ Dependency installation failed', 'red');
    process.exit(1);
  }

  // Check database
  checkDatabase();

  // Check Firebase
  if (!checkFirebaseSetup()) {
    log('❌ Firebase setup incomplete', 'red');
  }

  // Check ports
  checkPorts();

  // Run health check
  runHealthCheck();

  // Final instructions
  log('\n🎉 Setup completed!', 'green');
  log('\n📋 Next steps:', 'cyan');
  log('1. Update your .env files with actual values', 'blue');
  log('2. Run database migrations: npm run db:migrate', 'blue');
  log('3. Start the development server: npm run dev', 'blue');
  log('4. Open http://localhost:5173 in your browser', 'blue');
  
  log('\n🔧 Troubleshooting:', 'cyan');
  log('- If you see 404 errors, check that the server is running on port 3001', 'blue');
  log('- If you see 500 errors, check the server logs and database connection', 'blue');
  log('- For Facebook login issues, ensure you\'re using HTTPS in production', 'blue');
  log('- For Firebase issues, check your service account and configuration', 'blue');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}