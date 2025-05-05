#!/usr/bin/env node

/**
 * This script sanitizes .env files by replacing sensitive values with placeholders.
 * It reads from .env and creates a sanitized version that can be safely shared.
 * 
 * Usage: node scripts/sanitize-env.js [output-file]
 * Default output: .env.example
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';

// Configuration
const INPUT_FILE = '.env';
const DEFAULT_OUTPUT_FILE = '.env.example';
const CLIENT_ENV_FILE = 'client/.env';
const CLIENT_OUTPUT_FILE = 'client/.env.example';

// Patterns to identify sensitive values that should be sanitized
const SENSITIVE_PATTERNS = [
  /API_KEY/i,
  /SECRET/i,
  /PASSWORD/i,
  /CREDENTIAL/i,
  /TOKEN/i,
  /FIREBASE.*KEY/i,
  /FIREBASE.*ID/i,
  /FIREBASE.*APP_ID/i,
];

// Values that should be preserved (not sanitized)
const PRESERVE_VALUES = [
  'development',
  'production',
  'test',
  'true',
  'false',
  'http://localhost',
  'https://localhost',
  'localhost',
  'uploads',
];

/**
 * Determines if a line contains a sensitive value that should be sanitized
 */
function containsSensitiveValue(line) {
  // Skip comments and empty lines
  if (line.trim().startsWith('#') || line.trim() === '') {
    return false;
  }
  
  // Check if line contains an environment variable
  if (!line.includes('=')) {
    return false;
  }
  
  // Extract the key and value
  const [key, ...valueParts] = line.split('=');
  const value = valueParts.join('=').trim();
  
  // Check if the key matches any sensitive pattern
  const isSensitiveKey = SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
  
  // Check if the value should be preserved
  const shouldPreserve = PRESERVE_VALUES.some(preserveValue => 
    value === preserveValue || 
    value.startsWith(`${preserveValue}/`) ||
    value.startsWith(`${preserveValue}:`)
  );
  
  // If it's a sensitive key and the value shouldn't be preserved, sanitize it
  return isSensitiveKey && !shouldPreserve;
}

/**
 * Sanitizes a line by replacing sensitive values with placeholders
 */
function sanitizeLine(line) {
  if (!containsSensitiveValue(line)) {
    return line;
  }
  
  const [key, ...valueParts] = line.split('=');
  const value = valueParts.join('=').trim();
  
  // Create a placeholder based on the key
  const placeholder = `your_${key.trim().toLowerCase()}_here`;
  
  return `${key}=${placeholder}`;
}

/**
 * Sanitizes an env file
 */
async function sanitizeEnvFile(inputFile, outputFile) {
  console.log(`Sanitizing ${inputFile} to ${outputFile}...`);
  
  const fileStream = fs.createReadStream(inputFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  const sanitizedLines = [];
  let exportLines = [];
  
  // Process each line
  for await (const line of rl) {
    // Skip export statements but collect them
    if (line.trim().startsWith('export ')) {
      exportLines.push(line);
      continue;
    }
    
    const sanitizedLine = sanitizeLine(line);
    sanitizedLines.push(sanitizedLine);
  }
  
  // Add a warning comment at the top
  const warningComment = [
    '# WARNING: This is an example environment file.',
    '# DO NOT add real API keys or secrets to this file.',
    '# Create a copy named .env and add your actual values there.',
    '#',
    '# This file should be committed to version control.',
    '# The actual .env files should NEVER be committed.',
    ''
  ];
  
  // Write the sanitized content to the output file
  const outputContent = [...warningComment, ...sanitizedLines].join('\n');
  fs.writeFileSync(outputFile, outputContent);
  
  console.log(`Successfully sanitized ${inputFile} to ${outputFile}`);
  
  // Return the number of sanitized lines
  return sanitizedLines.filter((line, index) => line !== sanitizedLines[index]).length;
}

// Main execution
async function main() {
  const outputFile = process.argv[2] || DEFAULT_OUTPUT_FILE;
  
  try {
    // Sanitize the main .env file
    const mainChanges = await sanitizeEnvFile(INPUT_FILE, outputFile);
    
    // Check if client/.env exists and sanitize it too
    if (fs.existsSync(CLIENT_ENV_FILE)) {
      const clientChanges = await sanitizeEnvFile(CLIENT_ENV_FILE, CLIENT_OUTPUT_FILE);
      console.log(`Made ${mainChanges + clientChanges} sanitization changes in total.`);
    } else {
      console.log(`Made ${mainChanges} sanitization changes.`);
      console.log(`Note: ${CLIENT_ENV_FILE} not found, skipping client environment sanitization.`);
    }
    
    console.log('\nReminder: NEVER commit your actual .env files to version control!');
  } catch (error) {
    console.error('Error sanitizing environment files:', error);
    process.exit(1);
  }
}

main();
