const { execSync } = require('child_process');

async function globalSetup() {
  console.log('Setting up E2E test environment...');
  
  try {
    // Check if Docker is running
    execSync('docker --version', { stdio: 'pipe' });
    console.log('Docker is available');
    
    // Check if services are already running
    try {
      execSync('docker compose ps', { stdio: 'pipe', cwd: process.cwd() });
      console.log('Docker Compose services status checked');
    } catch (error) {
      console.log('Starting Docker Compose services...');
      execSync('docker compose up -d', { stdio: 'inherit', cwd: process.cwd() });
    }
    
    // Wait for services to be ready
    console.log('Waiting for services to be ready...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    // Verify services are responding
    const fetch = require('node-fetch');
    
    // Check backend health
    try {
      const response = await fetch('http://localhost:8080/health');
      if (response.ok) {
        console.log('Backend health check passed');
      } else {
        throw new Error(`Backend health check failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Backend health check failed:', error.message);
      throw error;
    }
    
    // Check frontend availability
    try {
      const response = await fetch('http://localhost:8080/');
      if (response.ok) {
        console.log('Frontend availability check passed');
      } else {
        throw new Error(`Frontend check failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Frontend availability check failed:', error.message);
      throw error;
    }
    
    console.log('E2E test environment setup completed successfully');
    
  } catch (error) {
    console.error('Failed to set up E2E test environment:', error.message);
    throw error;
  }
}

async function globalTeardown() {
  console.log('Cleaning up E2E test environment...');
  
  // Optional: Clean up test data
  // You might want to keep services running for development
  // execSync('docker compose down', { stdio: 'inherit', cwd: process.cwd() });
  
  console.log('E2E test environment cleanup completed');
}

module.exports = { globalSetup, globalTeardown };