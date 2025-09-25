import { test, expect } from '@playwright/test';

test.describe('Blank Page Debug', () => {
  test('should load the home page without blank screen', async ({ page }) => {
    // Enable console logging to catch errors
    page.on('console', msg => {
      console.log(`[${msg.type()}] ${msg.text()}`);
    });

    // Enable network logging
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log(`[${response.status()}] ${response.url()}`);
      }
    });

    // Navigate to the home page
    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // Wait for the page to load
    await page.waitForTimeout(2000);

    // Check if page has content
    const bodyText = await page.textContent('body');
    console.log('Body text length:', bodyText ? bodyText.length : 0);
    console.log('Body text preview:', bodyText ? bodyText.substring(0, 200) : 'No body text');

    // Check for React root element
    const reactRoot = await page.locator('#root').count();
    console.log('React root element count:', reactRoot);

    // Check for any error messages
    const errorElements = await page.locator('[data-testid="error"], .error, [class*="error"]').count();
    console.log('Error elements count:', errorElements);

    // Check for loading indicators
    const loadingElements = await page.locator('[data-testid="loading"], .loading, [class*="loading"]').count();
    console.log('Loading elements count:', loadingElements);

    // Take a screenshot for debugging
    await page.screenshot({ path: 'blank-page-debug.png', fullPage: true });

    // Check if the page has any visible content
    const visibleElements = await page.locator('body > *').count();
    console.log('Visible elements in body:', visibleElements);

    // Check for specific elements that should be present
    const header = await page.locator('header, [role="banner"]').count();
    const main = await page.locator('main, [role="main"]').count();
    const nav = await page.locator('nav, [role="navigation"]').count();

    console.log('Header elements:', header);
    console.log('Main elements:', main);
    console.log('Navigation elements:', nav);

    // Check for any JavaScript errors
    const jsErrors = [];
    page.on('pageerror', error => {
      jsErrors.push(error.message);
      console.log('JavaScript error:', error.message);
    });

    // Wait a bit more to catch any delayed errors
    await page.waitForTimeout(3000);

    // Basic assertion - page should not be completely blank
    expect(visibleElements).toBeGreaterThan(0);
    
    // If there are JS errors, log them
    if (jsErrors.length > 0) {
      console.log('JavaScript errors found:', jsErrors);
    }
  });

  test('should check network requests', async ({ page }) => {
    const requests = [];
    const responses = [];

    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers()
      });
    });

    page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    });

    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    console.log('Network requests made:');
    requests.forEach(req => {
      console.log(`  ${req.method} ${req.url}`);
    });

    console.log('Network responses:');
    responses.forEach(res => {
      console.log(`  ${res.status} ${res.statusText} - ${res.url}`);
    });

    // Check for failed requests
    const failedRequests = responses.filter(res => res.status >= 400);
    if (failedRequests.length > 0) {
      console.log('Failed requests:');
      failedRequests.forEach(req => {
        console.log(`  ${req.status} ${req.statusText} - ${req.url}`);
      });
    }
  });

  test('should check console for errors', async ({ page }) => {
    const consoleMessages = [];

    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
    });

    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    await page.waitForTimeout(3000);

    console.log('Console messages:');
    consoleMessages.forEach(msg => {
      console.log(`  [${msg.type}] ${msg.text}`);
      if (msg.location) {
        console.log(`    at ${msg.location.url}:${msg.location.lineNumber}:${msg.location.columnNumber}`);
      }
    });

    // Check for error messages
    const errorMessages = consoleMessages.filter(msg => msg.type === 'error');
    if (errorMessages.length > 0) {
      console.log('Error messages found:');
      errorMessages.forEach(msg => {
        console.log(`  ERROR: ${msg.text}`);
      });
    }
  });
});
