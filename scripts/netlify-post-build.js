#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🔧 Running Netlify post-build optimizations...');

const distPath = 'dist/public';

// Ensure dist directory exists
if (!fs.existsSync(distPath)) {
  console.error('❌ Build directory not found. Build may have failed.');
  process.exit(1);
}

// Create _redirects file for better SPA routing (backup to netlify.toml)
const redirectsContent = `
# SPA fallback
/*    /index.html   200

# API redirects (handled by netlify.toml but backup here)
/api/*  /.netlify/functions/:splat  200
`;

fs.writeFileSync(path.join(distPath, '_redirects'), redirectsContent.trim());
console.log('✅ Created _redirects file');

// Create _headers file for additional security headers
const headersContent = `# Security headers for all pages
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.openai.com https://api.anthropic.com https://*.googleapis.com https://*.firebaseapp.com https://*.cloudfunctions.net wss://*.firebaseio.com; frame-ancestors 'self'

# Cache static assets
/assets/*
  Cache-Control: public, max-age=31536000, immutable
  X-Content-Type-Options: nosniff

# Cache JS and CSS files
*.js
  Cache-Control: public, max-age=31536000, immutable
  X-Content-Type-Options: nosniff

*.css
  Cache-Control: public, max-age=31536000, immutable
  X-Content-Type-Options: nosniff

# API endpoints - no cache
/api/*
  Cache-Control: no-cache, no-store, must-revalidate
  Pragma: no-cache
  Expires: 0
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block

# Netlify functions - no cache
/.netlify/functions/*
  Cache-Control: no-cache, no-store, must-revalidate
  Pragma: no-cache
  Expires: 0
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block`;

fs.writeFileSync(path.join(distPath, '_headers'), headersContent.trim());
console.log('✅ Created _headers file');

// Generate build info
const buildInfo = {
  buildTime: new Date().toISOString(),
  nodeVersion: process.version,
  platform: process.platform,
  arch: process.arch,
  commit: process.env.COMMIT_REF || 'unknown',
  branch: process.env.BRANCH || 'unknown',
  buildId: process.env.BUILD_ID || 'unknown'
};

fs.writeFileSync(
  path.join(distPath, 'build-info.json'), 
  JSON.stringify(buildInfo, null, 2)
);
console.log('✅ Generated build info');

// Verify critical files exist
const criticalFiles = ['index.html', 'assets'];
const missingFiles = criticalFiles.filter(file => 
  !fs.existsSync(path.join(distPath, file))
);

if (missingFiles.length > 0) {
  console.error('❌ Missing critical files:', missingFiles);
  process.exit(1);
}

// Calculate build size
const calculateSize = (dirPath) => {
  let totalSize = 0;
  const files = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = path.join(dirPath, file.name);
    if (file.isDirectory()) {
      totalSize += calculateSize(filePath);
    } else {
      totalSize += fs.statSync(filePath).size;
    }
  }
  
  return totalSize;
};

const buildSize = calculateSize(distPath);
const buildSizeMB = (buildSize / (1024 * 1024)).toFixed(2);

console.log(`📊 Build size: ${buildSizeMB} MB`);

if (buildSize > 50 * 1024 * 1024) { // 50MB warning
  console.warn('⚠️  Build size is quite large. Consider optimizing assets.');
}

console.log('✅ Post-build optimizations complete');