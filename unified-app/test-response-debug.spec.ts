import { test, expect, Page } from '@playwright/test';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

test.describe('Response Debug Test', () => {
  let page: Page;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const screenshotDir = `/projects/03-project-management-common/agoat-publisher-e2e-images/${timestamp}-response-debug`;

  test.beforeAll(async () => {
    if (!existsSync(screenshotDir)) {
      mkdirSync(screenshotDir, { recursive: true });
    }
    console.log(`📁 Screenshot directory created: ${screenshotDir}`);
  });

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Capture console logs and errors
    page.on('console', msg => {
      console.log(`Console ${msg.type()}: ${msg.text()}`);
    });
    
    page.on('pageerror', error => {
      console.log(`JavaScript Error: ${error.message}`);
    });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('Debug API Response', async () => {
    console.log('🔍 Debugging API response...');

    // Set up authentication
    await page.addInitScript(() => {
      const mockUser = {
        id: '1096773348868587521',
        email: 'andrewqr@gmail.com',
        name: 'Andrew Smith',
        role: 'admin',
        authenticated: true
      };
      
      localStorage.setItem('oidc_user', JSON.stringify(mockUser));
      localStorage.setItem('auth_user', JSON.stringify(mockUser));
    });

    // Navigate to new post page
    await page.goto('/new-post');
    await page.waitForLoadState('networkidle');

    // Fill in minimal post data
    const newPostTitle = `Response Debug Test ${new Date().toISOString()}`;
    const newPostContent = `Test content for response debugging.`;

    await page.locator('input[placeholder*="title"], input[placeholder*="Title"]').fill(newPostTitle);
    await page.locator('.wysimark-editable, [data-wysimark]').fill(newPostContent);

    // Set status to published
    await page.locator('[role="combobox"], [aria-haspopup="listbox"]').click();
    await page.locator('[role="option"]:has-text("Published")').click();
    await page.waitForLoadState('networkidle');

    // Intercept the API response
    await page.route('**/api/sites/*/posts', async (route) => {
      const response = await route.fetch();
      const responseBody = await response.text();
      console.log('🔍 Intercepted API Response:');
      console.log('Status:', response.status());
      console.log('Headers:', response.headers());
      console.log('Body:', responseBody);
      
      // Continue with the original response
      route.fulfill({
        response: response,
        body: responseBody
      });
    });

    // Click save and wait for response
    console.log('🔄 Clicking save button...');
    await page.locator('button:has-text("Save")').click();
    
    // Wait for navigation or timeout
    try {
      await page.waitForURL(/.*edit-post\/.*/, { timeout: 10000 });
      console.log('✅ Successfully navigated to edit page!');
      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);
    } catch (error) {
      console.log('❌ Navigation timeout - checking current state...');
      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);
      
      // Check for any error messages
      const errorElements = await page.locator('[class*="error"], [class*="Error"], [role="alert"]').count();
      console.log('Error elements found:', errorElements);
      
      if (errorElements > 0) {
        const errorTexts = await page.locator('[class*="error"], [class*="Error"], [role="alert"]').allTextContents();
        console.log('Error texts:', errorTexts);
      }
    }

    await page.screenshot({ path: join(screenshotDir, 'final-state.png') });
    console.log('✅ Response debug test completed!');
  });
});
