import { test, expect, Page } from '@playwright/test';

// Debug test to investigate page loading issues
test.describe('Debug Page Loading Issues', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('Debug New Post Page Loading', async () => {
    console.log('🔍 Debugging new post page loading...');

    // Capture console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(`Console ${msg.type()}: ${msg.text()}`);
    });

    // Capture network requests
    const networkRequests: string[] = [];
    page.on('request', request => {
      networkRequests.push(`Request: ${request.method()} ${request.url()}`);
    });

    // Capture network responses
    const networkResponses: string[] = [];
    page.on('response', response => {
      networkResponses.push(`Response: ${response.status()} ${response.url()}`);
    });

    // Navigate to new post page
    console.log('1. Navigating to new post page...');
    await page.goto('https://dev.np-topvitaminsupply.com/new-post', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // Wait longer for content to load
    await page.waitForTimeout(5000);

    // Take screenshot after waiting
    await page.screenshot({ 
      path: '/projects/03-project-management-common/agoat-publisher-e2e-images/debug-01-new-post-after-wait.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved: debug-01-new-post-after-wait.png');

    // Check what's actually on the page
    const pageContent = await page.content();
    console.log(`Page content length: ${pageContent.length}`);
    
    // Check for specific elements
    const body = await page.locator('body').textContent();
    console.log(`Body content length: ${body?.length || 0}`);
    
    // Check for React root
    const reactRoot = await page.locator('#root').count();
    console.log(`React root elements found: ${reactRoot}`);
    
    // Check for any error messages
    const errorElements = await page.locator('[class*="error"], [class*="Error"]').count();
    console.log(`Error elements found: ${errorElements}`);

    // Log console messages
    console.log('Console logs:');
    consoleLogs.forEach(log => console.log(`  ${log}`));

    // Log network requests
    console.log('Network requests:');
    networkRequests.forEach(req => console.log(`  ${req}`));

    // Log network responses
    console.log('Network responses:');
    networkResponses.forEach(res => console.log(`  ${res}`));

    // Check current URL
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    // Check page title
    const title = await page.title();
    console.log(`Page title: ${title}`);
  });

  test('Debug Login Page Loading', async () => {
    console.log('🔍 Debugging login page loading...');

    // Capture console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(`Console ${msg.type()}: ${msg.text()}`);
    });

    // Navigate to login page
    console.log('1. Navigating to login page...');
    await page.goto('https://dev.np-topvitaminsupply.com/login', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // Wait longer for content to load
    await page.waitForTimeout(5000);

    // Take screenshot after waiting
    await page.screenshot({ 
      path: '/projects/03-project-management-common/agoat-publisher-e2e-images/debug-02-login-after-wait.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved: debug-02-login-after-wait.png');

    // Check what's actually on the page
    const pageContent = await page.content();
    console.log(`Page content length: ${pageContent.length}`);
    
    // Check for specific elements
    const body = await page.locator('body').textContent();
    console.log(`Body content length: ${body?.length || 0}`);

    // Log console messages
    console.log('Console logs:');
    consoleLogs.forEach(log => console.log(`  ${log}`));

    // Check current URL
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    // Check page title
    const title = await page.title();
    console.log(`Page title: ${title}`);
  });

  test('Debug Home Page Loading', async () => {
    console.log('🔍 Debugging home page loading...');

    // Navigate to home page
    console.log('1. Navigating to home page...');
    await page.goto('https://dev.np-topvitaminsupply.com/', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // Wait for content to load
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({ 
      path: '/projects/03-project-management-common/agoat-publisher-e2e-images/debug-03-home-page.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved: debug-03-home-page.png');

    // Check what's actually on the page
    const pageContent = await page.content();
    console.log(`Page content length: ${pageContent.length}`);
    
    // Check for specific elements
    const body = await page.locator('body').textContent();
    console.log(`Body content length: ${body?.length || 0}`);

    // Check current URL
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    // Check page title
    const title = await page.title();
    console.log(`Page title: ${title}`);
  });
});
