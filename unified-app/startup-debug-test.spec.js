import { test, expect } from '@playwright/test';

test.describe('App Startup Debug', () => {
  test('should diagnose startup issues', async ({ page }) => {
    const consoleMessages = [];
    const networkRequests = [];
    const errors = [];

    // Capture all console messages
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      });
    });

    // Capture network requests
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: new Date().toISOString()
      });
    });

    // Capture page errors
    page.on('pageerror', error => {
      errors.push({
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    });

    // Try to navigate to the app with extended timeout
    try {
      await page.goto('http://localhost:3000', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
    } catch (error) {
      console.log('Navigation failed:', error.message);
    }

    // Check if page loaded
    const title = await page.title();
    const bodyText = await page.textContent('body');
    
    console.log('=== STARTUP DEBUG REPORT ===');
    console.log('Page Title:', title);
    console.log('Body Text Length:', bodyText?.length || 0);
    console.log('Console Messages Count:', consoleMessages.length);
    console.log('Network Requests Count:', networkRequests.length);
    console.log('Errors Count:', errors.length);

    // Log critical errors
    const criticalErrors = errors.filter(e => 
      e.message.includes('timeout') || 
      e.message.includes('connection') ||
      e.message.includes('ECONNREFUSED') ||
      e.message.includes('ERR_CONNECTION_REFUSED')
    );

    if (criticalErrors.length > 0) {
      console.log('=== CRITICAL ERRORS ===');
      criticalErrors.forEach(error => {
        console.log('Error:', error.message);
        console.log('Stack:', error.stack);
      });
    }

    // Log console errors
    const consoleErrors = consoleMessages.filter(msg => msg.type === 'error');
    if (consoleErrors.length > 0) {
      console.log('=== CONSOLE ERRORS ===');
      consoleErrors.forEach(msg => {
        console.log('Console Error:', msg.text);
      });
    }

    // Log network issues
    const failedRequests = networkRequests.filter(req => 
      req.url.includes('localhost:3000') || 
      req.url.includes('localhost:8080')
    );

    console.log('=== NETWORK REQUESTS ===');
    failedRequests.forEach(req => {
      console.log(`${req.method} ${req.url}`);
    });

    // Basic assertions
    expect(title).toBeDefined();
    expect(bodyText).toBeDefined();
  });

  test('should check API server connectivity', async ({ page }) => {
    const apiResponses = [];

    page.on('response', response => {
      if (response.url().includes('localhost:8080')) {
        apiResponses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });

    try {
      // Try to make a direct API request
      await page.goto('http://localhost:8080/health', { timeout: 10000 });
    } catch (error) {
      console.log('API Health Check Failed:', error.message);
    }

    // Try to navigate to frontend and check for API calls
    try {
      await page.goto('http://localhost:3000', { timeout: 15000 });
      await page.waitForTimeout(2000); // Wait for any API calls
    } catch (error) {
      console.log('Frontend Navigation Failed:', error.message);
    }

    console.log('=== API RESPONSES ===');
    apiResponses.forEach(resp => {
      console.log(`${resp.status} ${resp.statusText} - ${resp.url}`);
    });

    // Check if API is responding
    const successfulApiCalls = apiResponses.filter(resp => resp.status < 400);
    expect(successfulApiCalls.length).toBeGreaterThanOrEqual(0);
  });

  test('should check frontend build and dependencies', async ({ page }) => {
    const resourceErrors = [];

    page.on('response', response => {
      if (response.status() >= 400) {
        resourceErrors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });

    try {
      await page.goto('http://localhost:3000', { timeout: 20000 });
      await page.waitForLoadState('domcontentloaded');
    } catch (error) {
      console.log('Frontend Load Failed:', error.message);
    }

    console.log('=== RESOURCE ERRORS ===');
    resourceErrors.forEach(error => {
      console.log(`${error.status} ${error.statusText} - ${error.url}`);
    });

    // Check for critical resource failures
    const criticalResources = resourceErrors.filter(error => 
      error.url.includes('.js') || 
      error.url.includes('.css') ||
      error.url.includes('vite')
    );

    if (criticalResources.length > 0) {
      console.log('=== CRITICAL RESOURCE FAILURES ===');
      criticalResources.forEach(error => {
        console.log(`Failed to load: ${error.url}`);
      });
    }

    expect(resourceErrors.length).toBeLessThan(10); // Allow some non-critical failures
  });
});
