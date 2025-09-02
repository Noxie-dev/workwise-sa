#!/usr/bin/env tsx

/**
 * Enhanced Migration Management Script for Drizzle Kit
 * Provides easy commands for managing database migrations
 */

import { execSync } from 'child_process';
import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const MIGRATIONS_DIR = './migrations';
const SCHEMA_FILE = './shared/schema.ts';

interface MigrationInfo {
  name: string;
  file: string;
  size: number;
  modified: Date;
}

class MigrationManager {
  private migrationsDir: string;
  private schemaFile: string;

  constructor(migrationsDir: string, schemaFile: string) {
    this.migrationsDir = migrationsDir;
    this.schemaFile = schemaFile;
  }

  /**
   * Generate a new migration
   */
  generate(name: string, options: { custom?: boolean; sql?: boolean } = {}) {
    console.log(`🔄 Generating migration: ${name}`);
    
    try {
      let command = 'npx drizzle-kit generate';
      
      if (options.custom) {
        command += ' --custom';
      }
      
      if (options.sql) {
        command += ' --sql';
      }
      
      command += ` --name ${name}`;
      
      execSync(command, { stdio: 'inherit' });
      console.log(`✅ Migration generated successfully: ${name}`);
    } catch (error) {
      console.error(`❌ Failed to generate migration: ${error}`);
      process.exit(1);
    }
  }

  /**
   * Apply pending migrations
   */
  migrate(env: string = 'development') {
    console.log(`🔄 Applying migrations for environment: ${env}`);
    
    try {
      // Set environment variable for the migration
      const envVars = env === 'production' ? 'NODE_ENV=production' : 'NODE_ENV=development';
      
      execSync(`${envVars} npx drizzle-kit migrate`, { stdio: 'inherit' });
      console.log('✅ Migrations applied successfully');
    } catch (error) {
      console.error(`❌ Failed to apply migrations: ${error}`);
      process.exit(1);
    }
  }

  /**
   * Check migration status
   */
  status() {
    console.log('📊 Checking migration status...');
    
    try {
      execSync('npx drizzle-kit status', { stdio: 'inherit' });
    } catch (error) {
      console.error(`❌ Failed to check migration status: ${error}`);
      process.exit(1);
    }
  }

  /**
   * Pull existing schema from database
   */
  pull() {
    console.log('🔄 Pulling existing schema from database...');
    
    try {
      execSync('npx drizzle-kit pull', { stdio: 'inherit' });
      console.log('✅ Schema pulled successfully');
    } catch (error) {
      console.error(`❌ Failed to pull schema: ${error}`);
      process.exit(1);
    }
  }

  /**
   * Push schema changes to database (for development)
   */
  push() {
    console.log('🔄 Pushing schema changes to database...');
    
    try {
      execSync('npx drizzle-kit push', { stdio: 'inherit' });
      console.log('✅ Schema pushed successfully');
    } catch (error) {
      console.error(`❌ Failed to push schema: ${error}`);
      process.exit(1);
    }
  }

  /**
   * Open Drizzle Studio
   */
  studio() {
    console.log('🔄 Opening Drizzle Studio...');
    
    try {
      execSync('npx drizzle-kit studio', { stdio: 'inherit' });
    } catch (error) {
      console.error(`❌ Failed to open Drizzle Studio: ${error}`);
      process.exit(1);
    }
  }

  /**
   * List existing migrations
   */
  list() {
    console.log('📋 Existing migrations:');
    
    if (!existsSync(this.migrationsDir)) {
      console.log('  No migrations directory found');
      return;
    }

    const files = readdirSync(this.migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .map(file => {
        const filePath = join(this.migrationsDir, file);
        const stats = statSync(filePath);
        return {
          name: file,
          file: filePath,
          size: stats.size,
          modified: stats.mtime,
        };
      })
      .sort((a, b) => b.modified.getTime() - a.modified.getTime());

    if (files.length === 0) {
      console.log('  No migration files found');
      return;
    }

    files.forEach((file, index) => {
      const sizeKB = (file.size / 1024).toFixed(1);
      const date = file.modified.toLocaleDateString();
      console.log(`  ${index + 1}. ${file.name} (${sizeKB}KB, ${date})`);
    });
  }

  /**
   * Validate schema file
   */
  validate() {
    console.log('🔍 Validating schema file...');
    
    if (!existsSync(this.schemaFile)) {
      console.error(`❌ Schema file not found: ${this.schemaFile}`);
      process.exit(1);
    }

    try {
      // Try to compile the schema
      execSync(`npx tsc --noEmit ${this.schemaFile}`, { stdio: 'pipe' });
      console.log('✅ Schema file is valid');
    } catch (error) {
      console.error(`❌ Schema validation failed: ${error}`);
      process.exit(1);
    }
  }

  /**
   * Show help information
   */
  help() {
    console.log(`
🚀 Enhanced Migration Management Script

Usage: tsx scripts/manage-migrations.ts <command> [options]

Commands:
  generate <name>     Generate a new migration
  migrate [env]       Apply pending migrations (default: development)
  status              Check migration status
  pull                Pull existing schema from database
  push                Push schema changes to database (development only)
  studio              Open Drizzle Studio
  list                List existing migrations
  validate            Validate schema file
  help                Show this help message

Options for generate:
  --custom            Generate custom migration file
  --sql               Generate SQL migration file

Examples:
  tsx scripts/manage-migrations.ts generate add_user_profile
  tsx scripts/manage-migrations.ts generate add_job_fields --custom
  tsx scripts/manage-migrations.ts migrate production
  tsx scripts/manage-migrations.ts status
  tsx scripts/manage-migrations.ts list

Environment Variables:
  DATABASE_URL        Database connection string
  NODE_ENV            Environment (development/production)
    `);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const options = args.slice(1);

  const manager = new MigrationManager(MIGRATIONS_DIR, SCHEMA_FILE);

  switch (command) {
    case 'generate':
      if (!options[0]) {
        console.error('❌ Migration name is required');
        process.exit(1);
      }
      manager.generate(options[0], {
        custom: options.includes('--custom'),
        sql: options.includes('--sql'),
      });
      break;

    case 'migrate':
      manager.migrate(options[0]);
      break;

    case 'status':
      manager.status();
      break;

    case 'pull':
      manager.pull();
      break;

    case 'push':
      manager.push();
      break;

    case 'studio':
      manager.studio();
      break;

    case 'list':
      manager.list();
      break;

    case 'validate':
      manager.validate();
      break;

    case 'help':
    case '--help':
    case '-h':
      manager.help();
      break;

    default:
      console.error(`❌ Unknown command: ${command}`);
      console.log('Use "help" to see available commands');
      process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { MigrationManager };
