import { test, expect, Page } from '@playwright/test';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

test.describe('Debug API Requests', () => {
  let page: Page;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const screenshotDir = `/projects/03-project-management-common/agoat-publisher-e2e-images/${timestamp}-api-debug`;

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

    // Capture network requests
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        console.log(`🌐 API Request: ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log(`📡 API Response: ${response.status()} ${response.url()}`);
        if (response.status() >= 400) {
          console.log(`❌ API Error: ${response.status()} ${response.statusText()}`);
        }
      }
    });

    page.on('requestfailed', request => {
      if (request.url().includes('/api/')) {
        console.log(`💥 API Request Failed: ${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
      }
    });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('Debug API Request Issues', async () => {
    console.log('🔍 Debugging API request issues...');

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
    await page.screenshot({ path: join(screenshotDir, '01-new-post-page.png') });

    // Check if we're on the new post page
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    if (currentUrl.includes('/login') || currentUrl.includes('/cognito-login')) {
      console.log('❌ Still redirected to login page');
      return;
    }

    console.log('✅ Successfully on new post page');

    // Fill in the title
    const newPostTitle = `API Debug Test Post ${new Date().toISOString()}`;
    await page.locator('input[placeholder*="title"], input[placeholder*="Title"]').fill(newPostTitle);
    await page.screenshot({ path: join(screenshotDir, '02-after-title-entry.png') });

    // Fill in content
    const newPostContent = `This is content for API debugging at ${new Date().toISOString()}.`;
    await page.locator('.wysimark-editable, [data-wysimark]').fill(newPostContent);
    await page.screenshot({ path: join(screenshotDir, '03-after-content-entry.png') });

    // Change status to published
    await page.locator('[role="combobox"], [aria-haspopup="listbox"]').click();
    await page.locator('[role="option"]:has-text("Published")').click();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: join(screenshotDir, '04-after-status-change.png') });

    // Click save and monitor the network request
    console.log('🔄 Clicking save button...');
    await page.locator('button:has-text("Save")').click();
    
    // Wait for network activity to complete
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: join(screenshotDir, '05-after-save.png') });

    // Check the final URL
    const finalUrl = page.url();
    console.log('Final URL after save:', finalUrl);

    // Check if there are any error messages on the page
    const errorElements = await page.locator('[class*="error"], [class*="Error"], [role="alert"]').count();
    console.log('Error elements found:', errorElements);

    if (errorElements > 0) {
      const errorTexts = await page.locator('[class*="error"], [class*="Error"], [role="alert"]').allTextContents();
      console.log('Error texts:', errorTexts);
    }

    // Check for any success indicators
    const successElements = await page.locator('[class*="success"], [class*="Success"]').count();
    console.log('Success elements found:', successElements);

    console.log('✅ API debug test completed!');
  });
});
