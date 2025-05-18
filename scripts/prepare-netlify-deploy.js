/**
 * This script prepares environment variables for Netlify deployment
 * It reads the service account key file and converts it to a JSON string
 * for use in Netlify environment variables
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Path to service account key file
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  path.join(rootDir, 'workwise-sa-project-firebase-adminsdk-fbsvc-727ba80ab5.json');

// Check if service account file exists
if (!fs.existsSync(serviceAccountPath)) {
  console.error(`Service account key file not found at: ${serviceAccountPath}`);
  console.error('Please generate a service account key from the Firebase console');
  console.error('and save it to the root directory of your project.');
  console.error('Then set GOOGLE_APPLICATION_CREDENTIALS environment variable to point to this file.');
  process.exit(1);
}

try {
  // Read the service account key file
  const serviceAccount = fs.readFileSync(serviceAccountPath, 'utf8');

  // Parse and stringify to ensure it's valid JSON
  const serviceAccountJson = JSON.stringify(JSON.parse(serviceAccount));

  console.log('\n=== Firebase Service Account for Netlify ===');
  console.log('Add the following environment variable to your Netlify site:');
  console.log('\nFIREBASE_SERVICE_ACCOUNT');
  console.log('\nValue:');
  console.log(serviceAccountJson);
  console.log('\n=== Other Required Environment Variables ===');
  console.log('FIREBASE_PROJECT_ID=workwise-sa-project');
  console.log('FIREBASE_STORAGE_BUCKET=workwise-sa-project.appspot.com');

  // Create a .env.production file for local testing
  const envContent = `
# Firebase Configuration
FIREBASE_PROJECT_ID=workwise-sa-project
FIREBASE_STORAGE_BUCKET=workwise-sa-project.appspot.com
FIREBASE_SERVICE_ACCOUNT='${serviceAccountJson}'
`;

  fs.writeFileSync(path.join(rootDir, '.env.production'), envContent);
  console.log('\nCreated .env.production file for local testing');

} catch (error) {
  console.error('Error processing service account key:', error);
  process.exit(1);
}
