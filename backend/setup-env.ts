#!/usr/bin/env node

/**
 * Environment Setup Script
 * Creates .env file from .env.example if it doesn't exist
 */

import * as fs from 'fs';
import * as path from 'path';

const envExamplePath: string = path.join(__dirname, '.env.example');
const envPath: string = path.join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Created .env file from .env.example');
    console.log('📝 Please update the database credentials in .env file');
  } else {
    console.log('❌ .env.example file not found');
    process.exit(1);
  }
} else {
  console.log('✅ .env file already exists');
}

console.log('🚀 Environment setup complete!');
