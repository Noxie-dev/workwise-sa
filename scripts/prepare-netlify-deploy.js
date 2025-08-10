/**
 * Enhanced script to prepare environment variables for Netlify deployment
 * Compatible with Netlify CLI v23.1.3+ and latest best practices
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('🔧 Preparing Netlify deployment configuration...\n');

// Path to service account key file
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  path.join(rootDir, 'workwise-sa-project-firebase-adminsdk-fbsvc-727ba80ab5.json');

// Check if service account file exists
if (!fs.existsSync(serviceAccountPath)) {
  console.error(`❌ Service account key file not found at: ${serviceAccountPath}`);
  console.error('Please generate a service account key from the Firebase console');
  console.error('and save it to the root directory of your project.');
  console.error('Then set GOOGLE_APPLICATION_CREDENTIALS environment variable to point to this file.');
  process.exit(1);
}

try {
  // Read the service account key file
  const serviceAccount = fs.readFileSync(serviceAccountPath, 'utf8');

  // Parse and stringify to ensure it's valid JSON
  const serviceAccountData = JSON.parse(serviceAccount);
  const serviceAccountJson = JSON.stringify(serviceAccountData);

  console.log('✅ Firebase service account key validated\n');

  console.log('='.repeat(60));
  console.log('🔑 NETLIFY ENVIRONMENT VARIABLES');
  console.log('='.repeat(60));
  console.log('\nCopy these environment variables to your Netlify dashboard:');
  console.log('(Site settings > Environment variables)\n');

  // Core Firebase configuration
  console.log('📋 Firebase Configuration:');
  console.log('─'.repeat(30));
  console.log(`FIREBASE_PROJECT_ID=${serviceAccountData.project_id || 'workwise-sa-project'}`);
  console.log(`FIREBASE_STORAGE_BUCKET=${serviceAccountData.project_id || 'workwise-sa-project'}.appspot.com`);
  console.log('\nFIREBASE_SERVICE_ACCOUNT');
  console.log('Value (copy entire JSON):');
  console.log(serviceAccountJson);

  // Build configuration
  console.log('\n📋 Build Configuration:');
  console.log('─'.repeat(30));
  console.log('NODE_VERSION=20');
  console.log('NODE_OPTIONS=--max-old-space-size=4096');
  console.log('NPM_FLAGS=--production=false');
  console.log('NETLIFY_CACHE_NEXTJS=true');

  // AI Integration (placeholders)
  console.log('\n📋 AI Integration (add your keys):');
  console.log('─'.repeat(30));
  console.log('GOOGLE_GENAI_API_KEY=your_google_genai_api_key_here');
  console.log('ANTHROPIC_API_KEY=your_anthropic_api_key_here');

  // Client-side environment variables
  console.log('\n📋 Client-side Variables:');
  console.log('─'.repeat(30));
  console.log(`VITE_FIREBASE_PROJECT_ID=${serviceAccountData.project_id || 'workwise-sa-project'}`);
  console.log(`VITE_FIREBASE_AUTH_DOMAIN=${serviceAccountData.project_id || 'workwise-sa-project'}.firebaseapp.com`);
  console.log(`VITE_FIREBASE_STORAGE_BUCKET=${serviceAccountData.project_id || 'workwise-sa-project'}.appspot.com`);
  console.log('VITE_USE_FIREBASE_EMULATORS=false');
  console.log('VITE_API_URL=https://beamish-sawine-64ddd4.netlify.app');

  // Create enhanced .env.production file for local testing
  const envContent = `# WorkWise SA - Production Environment Configuration
# Generated on ${new Date().toISOString()}

# Firebase Configuration
FIREBASE_PROJECT_ID=${serviceAccountData.project_id || 'workwise-sa-project'}
FIREBASE_STORAGE_BUCKET=${serviceAccountData.project_id || 'workwise-sa-project'}.appspot.com
FIREBASE_SERVICE_ACCOUNT='${serviceAccountJson}'

# Build Configuration
NODE_VERSION=20
NODE_OPTIONS=--max-old-space-size=4096
NPM_FLAGS=--production=false

# Client-side Configuration
VITE_FIREBASE_PROJECT_ID=${serviceAccountData.project_id || 'workwise-sa-project'}
VITE_FIREBASE_AUTH_DOMAIN=${serviceAccountData.project_id || 'workwise-sa-project'}.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=${serviceAccountData.project_id || 'workwise-sa-project'}.appspot.com
VITE_USE_FIREBASE_EMULATORS=false
VITE_API_URL=https://beamish-sawine-64ddd4.netlify.app

# AI Integration (add your actual keys)
# GOOGLE_GENAI_API_KEY=your_google_genai_api_key_here
# ANTHROPIC_API_KEY=your_anthropic_api_key_here
`;

  fs.writeFileSync(path.join(rootDir, '.env.production'), envContent);
  console.log('\n✅ Created .env.production file for local testing');

  // Validate current Netlify configuration
  console.log('\n📋 Deployment Checklist:');
  console.log('─'.repeat(30));
  console.log('□ Environment variables added to Netlify dashboard');
  console.log('□ Firebase service account configured');
  console.log('□ AI API keys added (if using AI features)');
  console.log('□ Build configuration optimized');
  console.log('□ Security headers configured in netlify.toml');

  console.log('\n🚀 Ready for deployment! Run:');
  console.log('   npm run deploy:fast    # For quick deployment');
  console.log('   npm run deploy:prod    # For production deployment');

} catch (error) {
  console.error('❌ Error processing service account key:', error.message);
  if (error.name === 'SyntaxError') {
    console.error('The service account file appears to be invalid JSON.');
  }
  process.exit(1);
}
