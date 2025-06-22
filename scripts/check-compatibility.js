#!/usr/bin/env node

/**
 * This script checks the environment for compatibility issues
 * and provides recommendations for fixing them.
 */

const os = require('os');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Checking environment compatibility...');

// Check Node.js version
const nodeVersion = process.version;
console.log(`Node.js version: ${nodeVersion}`);
const nodeVersionNum = Number(nodeVersion.replace('v', '').split('.')[0]);
if (nodeVersionNum < 16) {
  console.warn('⚠️ Warning: Node.js version is below recommended (v16+)');
  console.warn('Some features may not work correctly.');
  console.warn('Recommendation: Update Node.js to v16 or higher');
}

// Check available memory
const totalMemory = Math.round(os.totalmem() / (1024 * 1024));
const freeMemory = Math.round(os.freemem() / (1024 * 1024));
console.log(`System memory: ${totalMemory}MB (${freeMemory}MB free)`);
if (totalMemory < 4000) {
  console.warn('⚠️ Warning: System has less than 4GB of RAM');
  console.warn('Build processes may fail or be very slow');
  console.warn('Recommendation: Use the "dev:simple" script or increase memory');
}

// Check for common environment issues
try {
  // Check if we're in a Docker container
  const isDocker = fs.existsSync('/.dockerenv') || fs.existsSync('/proc/1/cgroup') && 
    fs.readFileSync('/proc/1/cgroup', 'utf8').includes('docker');
  
  if (isDocker) {
    console.log('🐳 Running in Docker environment');
    console.log('Recommendation: Ensure container has at least 2GB memory limit');
  }
  
  // Check for package manager
  let packageManager = 'npm';
  if (fs.existsSync('pnpm-lock.yaml')) {
    packageManager = 'pnpm';
  } else if (fs.existsSync('yarn.lock')) {
    packageManager = 'yarn';
  }
  console.log(`Package manager detected: ${packageManager}`);
  
  // Check for browser compatibility
  console.log('Checking browser compatibility settings...');
  const nextConfig = fs.readFileSync(path.join(__dirname, '../next.config.mjs'), 'utf8');
  if (!nextConfig.includes('crossOrigin')) {
    console.warn('⚠️ Warning: Cross-origin settings not found in next.config.mjs');
    console.warn('This may cause issues with some browsers');
  }
  
  console.log('\n✅ Compatibility check complete');
  console.log('To run the app with simplified settings, use:');
  console.log('  npm run dev:simple');
  console.log('or');
  console.log(`  ${packageManager} run dev:simple`);
  
} catch (error) {
  console.error('Error during compatibility check:', error);
}