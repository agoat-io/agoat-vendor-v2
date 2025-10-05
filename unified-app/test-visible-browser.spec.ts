import { test, expect, Page } from '@playwright/test';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

test.describe('Test with Visible Browser', () => {
  let page: Page;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const screenshotDir = `/projects/03-project-management-common/agoat-publisher-e2e-images/${timestamp}-visible-browser`;

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

  test('Test Login and Post Creation with Visible Browser', async () => {
    console.log('🔐 Testing login and post creation with visible browser...');

    // 1. Navigate to new post page (should redirect to login if not authenticated)
    console.log('1. Navigating to new post page...');
    await page.goto('/new-post');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: join(screenshotDir, '01-new-post-initial.png') });

    // Check if we're on login page or new post page
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    if (currentUrl.includes('/login') || currentUrl.includes('/cognito-login')) {
      console.log('2. On login page, performing login...');
      
      // Look for login button or form
      const loginButton = page.locator('button:has-text("Login")');
      if (await loginButton.isVisible()) {
        console.log('Found login button, clicking...');
        await loginButton.click();
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: join(screenshotDir, '02-after-login-click.png') });
      }

      // Look for "Other ways" to login
      const otherWaysButton = page.locator('button:has-text("Other ways to log in")');
      if (await otherWaysButton.isVisible()) {
        console.log('3. Clicking "Other ways to log in"...');
        await otherWaysButton.click();
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: join(screenshotDir, '03-after-other-ways.png') });
      }

      // Enter credentials
      const emailField = page.locator('input[type="email"], input[name="username"], input[name="email"]');
      if (await emailField.isVisible()) {
        console.log('4. Entering email...');
        await emailField.fill('andrewqr@gmail.com');
      }

      const passwordField = page.locator('input[type="password"], input[name="password"]');
      if (await passwordField.isVisible()) {
        console.log('5. Entering password...');
        await passwordField.fill('Bremi-turp-443@');
      }
      
      await page.screenshot({ path: join(screenshotDir, '04-after-credentials.png') });

      // Submit login
      const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")');
      if (await submitButton.isVisible()) {
        console.log('6. Clicking submit button...');
        await submitButton.click();
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: join(screenshotDir, '05-after-login-submit.png') });
      }

      // Wait for redirect back to app
      console.log('7. Waiting for redirect back to app...');
      await page.waitForURL(/dev.np-topvitaminsupply.com/, { timeout: 60000 });
      console.log('Redirected to:', page.url());
      await page.screenshot({ path: join(screenshotDir, '06-after-redirect.png') });
    }

    // 8. Navigate to new post page (should now be authenticated)
    console.log('8. Navigating to new post page...');
    await page.goto('/new-post');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: join(screenshotDir, '07-new-post-authenticated.png') });

    // Check if we can see the editor
    const editorVisible = await page.locator('.wysimark-editor').isVisible();
    const titleFieldVisible = await page.locator('input[placeholder="Enter your post title..."]').isVisible();
    const contentFieldVisible = await page.locator('.wm-editor-content').isVisible();
    const statusDropdownVisible = await page.locator('button[aria-haspopup="listbox"]').isVisible();
    const saveButtonVisible = await page.locator('button:has-text("Save")').isVisible();

    console.log('Editor elements visibility:');
    console.log('- Editor:', editorVisible);
    console.log('- Title field:', titleFieldVisible);
    console.log('- Content field:', contentFieldVisible);
    console.log('- Status dropdown:', statusDropdownVisible);
    console.log('- Save button:', saveButtonVisible);

    if (editorVisible && titleFieldVisible && contentFieldVisible && statusDropdownVisible && saveButtonVisible) {
      console.log('✅ All editor elements are visible! Testing post creation...');

      // 9. Test post creation
      const newPostTitle = `Visible Browser Test Post ${new Date().toISOString()}`;
      const newPostContent = `This is content for a test post created with visible browser at ${new Date().toISOString()}.`;

      await page.locator('input[placeholder="Enter your post title..."]').fill(newPostTitle);
      await page.locator('.wysimark-editor .wm-editor-content').fill(newPostContent);
      await page.screenshot({ path: join(screenshotDir, '08-after-content-entry.png') });

      // Select 'Published' status
      await page.locator('button[aria-haspopup="listbox"]').click();
      await page.locator('div[role="option"]:has-text("Published")').click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: join(screenshotDir, '09-after-status-change.png') });

      // Save the post
      await page.locator('button:has-text("Save")').click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: join(screenshotDir, '10-after-save.png') });

      // Check if redirected to edit page
      const currentUrlAfterSave = page.url();
      console.log('URL after save:', currentUrlAfterSave);
      
      if (currentUrlAfterSave.includes('/edit-post/')) {
        console.log('✅ Successfully redirected to edit page!');
        await expect(page.locator('input[placeholder="Enter your post title..."]')).toHaveValue(newPostTitle);
      } else {
        console.log('❌ Not redirected to edit page as expected');
      }
    } else {
      console.log('❌ Editor elements not all visible - authentication may have failed');
    }

    console.log('✅ Visible browser test completed!');
  });

  test('Test Dashboard with Visible Browser', async () => {
    console.log('📊 Testing dashboard with visible browser...');
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: join(screenshotDir, '11-dashboard.png') });

    // Check dashboard elements
    const dashboardTitleVisible = await page.locator('h1:has-text("Dashboard")').isVisible();
    const newPostButtonVisible = await page.locator('button:has-text("New Post")').isVisible();
    const postsListVisible = await page.locator('.posts-list').isVisible();

    console.log('Dashboard elements visibility:');
    console.log('- Dashboard title:', dashboardTitleVisible);
    console.log('- New Post button:', newPostButtonVisible);
    console.log('- Posts list:', postsListVisible);

    if (dashboardTitleVisible && newPostButtonVisible) {
      console.log('✅ Dashboard elements are visible!');
    } else {
      console.log('❌ Dashboard elements not visible - may need authentication');
    }
  });
});
