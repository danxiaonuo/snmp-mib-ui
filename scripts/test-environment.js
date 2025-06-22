#!/usr/bin/env node

/**
 * This script tests the environment for compatibility with the MIB Platform
 * and provides a simple report.
 */

console.log('🧪 Testing environment compatibility for MIB Platform...');

// Test browser features
function testBrowserFeatures() {
  console.log('\n📱 Browser Features Test:');
  
  try {
    const features = {
      'CSS Variables': typeof window !== 'undefined' && window.CSS && window.CSS.supports && window.CSS.supports('--a', '0'),
      'Flexbox': typeof window !== 'undefined' && window.CSS && window.CSS.supports && window.CSS.supports('display', 'flex'),
      'Grid': typeof window !== 'undefined' && window.CSS && window.CSS.supports && window.CSS.supports('display', 'grid'),
      'LocalStorage': typeof window !== 'undefined' && !!window.localStorage,
      'SessionStorage': typeof window !== 'undefined' && !!window.sessionStorage,
      'Fetch API': typeof window !== 'undefined' && 'fetch' in window,
      'Service Workers': typeof window !== 'undefined' && 'serviceWorker' in navigator,
    };
    
    Object.entries(features).forEach(([feature, supported]) => {
      console.log(`${supported ? '✅' : '❌'} ${feature}: ${supported ? 'Supported' : 'Not supported'}`);
    });
  } catch (error) {
    console.log('❌ Browser feature detection failed. Running in Node.js environment.');
  }
}

// Test Node.js environment
function testNodeEnvironment() {
  console.log('\n🖥️ Node.js Environment Test:');
  
  console.log(`✅ Node.js version: ${process.version}`);
  console.log(`✅ Platform: ${process.platform}`);
  console.log(`✅ Architecture: ${process.arch}`);
  
  // Check for required modules
  const requiredModules = ['fs', 'path', 'os', 'child_process'];
  requiredModules.forEach(module => {
    try {
      require(module);
      console.log(`✅ Module '${module}' is available`);
    } catch (error) {
      console.log(`❌ Module '${module}' is not available`);
    }
  });
}

// Test file system access
function testFileSystemAccess() {
  console.log('\n📁 File System Access Test:');
  
  const fs = require('fs');
  const path = require('path');
  
  // Test read access
  try {
    const packageJson = fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8');
    console.log('✅ Read access: Success');
  } catch (error) {
    console.log(`❌ Read access: Failed - ${error.message}`);
  }
  
  // Test write access
  try {
    const testFile = path.join(__dirname, '../.test-write-access');
    fs.writeFileSync(testFile, 'test', 'utf8');
    fs.unlinkSync(testFile);
    console.log('✅ Write access: Success');
  } catch (error) {
    console.log(`❌ Write access: Failed - ${error.message}`);
  }
}

// Run tests
if (typeof window !== 'undefined') {
  // Browser environment
  testBrowserFeatures();
  console.log('\n✅ Environment test complete in browser');
} else {
  // Node.js environment
  testNodeEnvironment();
  testFileSystemAccess();
  console.log('\n✅ Environment test complete in Node.js');
  
  console.log('\nTo run the application in compatibility mode:');
  console.log('npm run dev:compat');
  console.log('\nFor more information, see COMPATIBILITY_GUIDE.md');
}