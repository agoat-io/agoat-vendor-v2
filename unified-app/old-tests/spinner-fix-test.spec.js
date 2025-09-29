import { test, expect } from '@playwright/test';

test('should load the home page after spinner fix', async ({ page }) => {
  // Enable console logging to catch errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[ERROR] ${msg.text()}`);
    }
  });

  page.on('pageerror', error => {
    console.log('Page error:', error.message);
  });

  // Navigate to the home page
  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { 
    waitUntil: 'networkidle',
    timeout: 30000 
  });

  // Wait for the page to load
  await page.waitForTimeout(3000);

  // Check if page has content
  const bodyText = await page.textContent('body');
  console.log('Body text length:', bodyText ? bodyText.length : 0);

  // Check for React root element content
  const reactRoot = await page.locator('#root');
  const rootContent = await reactRoot.textContent();
  console.log('React root content length:', rootContent ? rootContent.length : 0);
  console.log('React root content preview:', rootContent ? rootContent.substring(0, 200) : 'No content');

  // Check for specific elements that should be present
  const header = await page.locator('header, [role="banner"]').count();
  const main = await page.locator('main, [role="main"]').count();
  const heading = await page.locator('h1, h2, h3').count();

  console.log('Header elements:', header);
  console.log('Main elements:', main);
  console.log('Heading elements:', heading);

  // Take a screenshot
  await page.screenshot({ path: 'spinner-fix-test.png', fullPage: true });

  // The page should have content now
  expect(rootContent ? rootContent.length : 0).toBeGreaterThan(0);
  
  // Should have at least one heading
  expect(heading).toBeGreaterThan(0);
});
