#!/usr/bin/env node

/**
 * Environment Setup Script
 *
 * This script helps manage environment variables for different environments.
 * It copies the appropriate .env file based on the NODE_ENV or provided argument.
 */

const fs = require('fs');
const path = require('path');

// Available environments
const environments = ['development', 'staging', 'production'];

// Get environment from command line argument or NODE_ENV
const targetEnv = process.argv[2] || process.env.NODE_ENV || 'development';

// Validate environment
if (!environments.includes(targetEnv)) {
  console.error(`❌ Invalid environment: ${targetEnv}`);
  console.error(`   Available environments: ${environments.join(', ')}`);
  process.exit(1);
}

// File paths
const envFile = path.join(__dirname, '..', '.env');
const sourceFile = path.join(__dirname, '..', `env.${targetEnv}`);

// Check if source file exists
if (!fs.existsSync(sourceFile)) {
  console.error(`❌ Environment file not found: ${sourceFile}`);
  console.error(`   Please create env.${targetEnv} file first`);
  process.exit(1);
}

// Copy environment file
try {
  fs.copyFileSync(sourceFile, envFile);
  console.log(`✅ Environment configured for: ${targetEnv}`);
  console.log(`   Source: ${sourceFile}`);
  console.log(`   Target: ${envFile}`);

  // Display current configuration
  console.log('\n📋 Current Configuration:');
  const envContent = fs.readFileSync(envFile, 'utf8');
  const lines = envContent.split('\n').filter(line =>
    line.trim() && !line.startsWith('#')
  );

  lines.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      // Mask sensitive values
      const displayValue = key.toLowerCase().includes('password') ||
                          key.toLowerCase().includes('secret') ||
                          key.toLowerCase().includes('key')
        ? '*'.repeat(value.length)
        : value;
      console.log(`   ${key}=${displayValue}`);
    }
  });

} catch (error) {
  console.error(`❌ Error setting up environment: ${error.message}`);
  process.exit(1);
}

console.log('\n🚀 Environment setup complete!');
console.log('   Run: npm run dev (for development)');
console.log('   Run: npm start (for production)');
