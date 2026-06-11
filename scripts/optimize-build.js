#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🔧 Optimizing build for deployment...');

// Clean old builds
const distPath = 'dist';
if (fs.existsSync(distPath)) {
  console.log('🧹 Cleaning old build...');
  fs.rmSync(distPath, { recursive: true, force: true });
}

// Ensure upload directories exist for file uploads
const uploadDirs = [
  'uploads/profile-images',
  'uploads/professional-images',
  'uploads/cvs',
  'uploads/temp',
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// Create .gitkeep files to ensure directories are tracked
uploadDirs.forEach(dir => {
  const gitkeepPath = path.join(dir, '.gitkeep');
  if (!fs.existsSync(gitkeepPath)) {
    fs.writeFileSync(gitkeepPath, '');
  }
});

console.log('✅ Build optimization complete');
