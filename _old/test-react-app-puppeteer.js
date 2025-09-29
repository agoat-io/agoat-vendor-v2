#!/usr/bin/env node

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

// Configuration
const CONFIG = {
  apiUrl: 'http://localhost:8080',
  frontendUrl: 'http://localhost:3000',
  timeout: 30000,
  screenshotDir: './test-screenshots',
  headless: false, // Set to true for CI/CD
  slowMo: 1000, // Slow down actions for debugging
};

// Test results
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

async function takeScreenshot(page, name) {
  if (!fs.existsSync(CONFIG.screenshotDir)) {
    fs.mkdirSync(CONFIG.screenshotDir, { recursive: true });
  }
  const filename = `${CONFIG.screenshotDir}/${name}-${Date.now()}.png`;
  await page.screenshot({ path: filename, fullPage: true });
  log(`Screenshot saved: ${filename}`);
  return filename;
}

async function waitForElement(page, selector, timeout = 10000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    log(`Element not found: ${selector}`, 'error');
    return false;
  }
}

async function testApiEndpoints() {
  log('Testing API endpoints...');
  
  try {
    // Test API status endpoint
    const response = await fetch(`${CONFIG.apiUrl}/api/status`);
    if (response.ok) {
      const data = await response.json();
      log(`API Status: ${JSON.stringify(data)}`, 'success');
      testResults.passed++;
    } else {
      log(`API Status failed: ${response.status}`, 'error');
      testResults.failed++;
    }
  } catch (error) {
    log(`API test error: ${error.message}`, 'error');
    testResults.failed++;
    testResults.errors.push(error.message);
  }
}

async function testFrontendNavigation(page) {
  log('Testing frontend navigation...');
  
  try {
    // Navigate to home page
    await page.goto(CONFIG.frontendUrl, { waitUntil: 'networkidle0' });
    await takeScreenshot(page, 'home-page');
    
    // Check if page loaded
    const title = await page.title();
    log(`Page title: ${title}`, 'success');
    
    // Wait for React to render
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test navigation to different routes
    const routes = [
      { path: '/', name: 'Home' },
      { path: '/login', name: 'Login' },
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/new-post', name: 'New Post' }
    ];
    
    for (const route of routes) {
      try {
        log(`Testing route: ${route.path}`);
        await page.goto(`${CONFIG.frontendUrl}${route.path}`, { waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if page loaded without errors
        const pageTitle = await page.title();
        log(`Route ${route.path} loaded: ${pageTitle}`, 'success');
        
        // Take screenshot
        await takeScreenshot(page, `route-${route.name.toLowerCase().replace(/\s+/g, '-')}`);
        
        testResults.passed++;
      } catch (error) {
        log(`Route ${route.path} failed: ${error.message}`, 'error');
        testResults.failed++;
        testResults.errors.push(`Route ${route.path}: ${error.message}`);
      }
    }
    
  } catch (error) {
    log(`Frontend navigation test error: ${error.message}`, 'error');
    testResults.failed++;
    testResults.errors.push(error.message);
  }
}

async function testReactComponents(page) {
  log('Testing React components...');
  
  try {
    // Go to home page
    await page.goto(CONFIG.frontendUrl, { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test if React components are rendering
    const reactRoot = await page.$('#root');
    if (reactRoot) {
      log('React root element found', 'success');
      testResults.passed++;
    } else {
      log('React root element not found', 'error');
      testResults.failed++;
    }
    
    // Test for common UI elements
    const commonSelectors = [
      'nav', 'header', 'main', 'footer',
      '[data-testid]', '.container', '.app'
    ];
    
    for (const selector of commonSelectors) {
      const element = await page.$(selector);
      if (element) {
        log(`UI element found: ${selector}`, 'success');
        testResults.passed++;
      }
    }
    
    // Test for JavaScript errors in console
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (consoleErrors.length > 0) {
      log(`JavaScript errors found: ${consoleErrors.length}`, 'error');
      consoleErrors.forEach(error => log(`  - ${error}`, 'error'));
      testResults.failed++;
    } else {
      log('No JavaScript errors detected', 'success');
      testResults.passed++;
    }
    
  } catch (error) {
    log(`React components test error: ${error.message}`, 'error');
    testResults.failed++;
    testResults.errors.push(error.message);
  }
}

async function testResponsiveDesign(page) {
  log('Testing responsive design...');
  
  try {
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewport(viewport);
      await page.goto(CONFIG.frontendUrl, { waitUntil: 'networkidle0' });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await takeScreenshot(page, `responsive-${viewport.name}`);
      log(`Responsive test for ${viewport.name} viewport`, 'success');
      testResults.passed++;
    }
    
  } catch (error) {
    log(`Responsive design test error: ${error.message}`, 'error');
    testResults.failed++;
    testResults.errors.push(error.message);
  }
}

async function testPerformance(page) {
  log('Testing performance...');
  
  try {
    const startTime = Date.now();
    
    await page.goto(CONFIG.frontendUrl, { waitUntil: 'networkidle0' });
    
    const loadTime = Date.now() - startTime;
    log(`Page load time: ${loadTime}ms`, 'info');
    
    if (loadTime < 5000) {
      log('Page load time is acceptable', 'success');
      testResults.passed++;
    } else {
      log('Page load time is too slow', 'error');
      testResults.failed++;
    }
    
    // Test memory usage
    const metrics = await page.metrics();
    log(`Memory usage: ${Math.round(metrics.JSHeapUsedSize / 1024 / 1024)}MB`, 'info');
    
  } catch (error) {
    log(`Performance test error: ${error.message}`, 'error');
    testResults.failed++;
    testResults.errors.push(error.message);
  }
}

async function runTests() {
  log('🚀 Starting Puppeteer tests for AGoat Publisher React App...');
  log(`API URL: ${CONFIG.apiUrl}`);
  log(`Frontend URL: ${CONFIG.frontendUrl}`);
  log(`Headless mode: ${CONFIG.headless}`);
  log('');
  
  let browser;
  
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: CONFIG.headless,
      slowMo: CONFIG.slowMo,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Test API endpoints
    await testApiEndpoints();
    
    // Test frontend navigation
    await testFrontendNavigation(page);
    
    // Test React components
    await testReactComponents(page);
    
    // Test responsive design
    await testResponsiveDesign(page);
    
    // Test performance
    await testPerformance(page);
    
  } catch (error) {
    log(`Test execution error: ${error.message}`, 'error');
    testResults.failed++;
    testResults.errors.push(error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  // Print results
  log('');
  log('📊 Test Results Summary:');
  log(`✅ Passed: ${testResults.passed}`);
  log(`❌ Failed: ${testResults.failed}`);
  log(`📈 Success Rate: ${testResults.passed + testResults.failed > 0 ? Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100) : 0}%`);
  
  if (testResults.errors.length > 0) {
    log('');
    log('🚨 Errors:');
    testResults.errors.forEach(error => log(`  - ${error}`, 'error'));
  }
  
  log('');
  log('📸 Screenshots saved in: ' + CONFIG.screenshotDir);
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  log(`Fatal error: ${error.message}`, 'error');
  process.exit(1);
});
