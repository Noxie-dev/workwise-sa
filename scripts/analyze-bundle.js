#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔍 Analyzing bundle size...\n');

try {
  // Build with analysis
  console.log('Building with bundle analysis...');
  execSync('pnpm run build:analyze', { stdio: 'inherit' });

  // Check if dist directory exists
  const distPath = path.join(process.cwd(), 'dist', 'public', 'assets');

  if (fs.existsSync(distPath)) {
    const files = fs.readdirSync(distPath);
    const jsFiles = files.filter(file => file.endsWith('.js'));

    console.log('\n📊 JavaScript Bundle Analysis:');
    console.log('================================');

    const bundleInfo = jsFiles
      .map(file => {
        const filePath = path.join(distPath, file);
        const stats = fs.statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(2);

        return {
          name: file,
          size: stats.size,
          sizeKB: parseFloat(sizeKB),
        };
      })
      .sort((a, b) => b.size - a.size);

    bundleInfo.forEach(({ name, sizeKB }) => {
      const status = sizeKB > 600 ? '⚠️ ' : sizeKB > 300 ? '⚡' : '✅';
      console.log(`${status} ${name}: ${sizeKB} KB`);
    });

    const totalSize = bundleInfo.reduce((sum, file) => sum + file.sizeKB, 0);
    console.log(`\n📦 Total JS Bundle Size: ${totalSize.toFixed(2)} KB`);

    const largeChunks = bundleInfo.filter(file => file.sizeKB > 600);
    if (largeChunks.length > 0) {
      console.log('\n⚠️  Large chunks (>600KB):');
      largeChunks.forEach(({ name, sizeKB }) => {
        console.log(`   - ${name}: ${sizeKB} KB`);
      });
      console.log('\n💡 Consider further code splitting for these chunks.');
    } else {
      console.log('\n✅ All chunks are under 600KB!');
    }
  } else {
    console.log('❌ Build output not found. Make sure the build completed successfully.');
  }
} catch (error) {
  console.error('❌ Error analyzing bundle:', error.message);
  process.exit(1);
}
