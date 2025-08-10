// Bundle analyzer plugin for Vite
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { gzipSync } from 'zlib';

/**
 * Simple bundle analyzer plugin for Vite
 */
export function bundleAnalyzer() {
  return {
    name: 'bundle-analyzer',
    writeBundle(options, bundle) {
      const outputDir = options.dir || 'dist';
      const analysis = {};
      
      // Analyze each chunk
      Object.entries(bundle).forEach(([fileName, chunk]) => {
        if (chunk.type === 'chunk') {
          const filePath = resolve(outputDir, fileName);
          const fileSize = chunk.code.length;
          const gzipSize = gzipSync(chunk.code).length;
          
          analysis[fileName] = {
            size: fileSize,
            gzipSize,
            sizeFormatted: formatBytes(fileSize),
            gzipSizeFormatted: formatBytes(gzipSize),
            imports: chunk.imports || [],
            dynamicImports: chunk.dynamicImports || [],
          };
        }
      });
      
      // Sort by size
      const sortedAnalysis = Object.entries(analysis)
        .sort(([, a], [, b]) => b.size - a.size)
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {});
      
      // Write analysis to file
      writeFileSync(
        resolve(outputDir, 'bundle-analysis.json'),
        JSON.stringify(sortedAnalysis, null, 2)
      );
      
      // Log summary
      console.log('\n📦 Bundle Analysis:');
      Object.entries(sortedAnalysis).slice(0, 10).forEach(([fileName, info]) => {
        console.log(
          `${fileName}: ${info.sizeFormatted} (gzip: ${info.gzipSizeFormatted})`
        );
      });
    }
  };
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}