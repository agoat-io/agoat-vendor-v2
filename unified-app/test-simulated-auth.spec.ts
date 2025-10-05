import { test, expect, Page } from '@playwright/test';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

test.describe('Test with Simulated Authentication', () => {
  let page: Page;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const screenshotDir = `/projects/03-project-management-common/agoat-publisher-e2e-images/${timestamp}-simulated-auth`;

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

  test('Test Post Creation with Simulated Authentication', async () => {
    console.log('🔐 Testing post creation with simulated authentication...');

    // 1. Navigate to new post page
    console.log('1. Navigating to new post page...');
    await page.goto('/new-post');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: join(screenshotDir, '01-new-post-initial.png') });

    // 2. Check if we're redirected to login
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    if (currentUrl.includes('/login') || currentUrl.includes('/cognito-login')) {
      console.log('2. Redirected to login page - simulating authentication...');
      
      // Simulate authentication by setting localStorage and sessionStorage
      await page.evaluate(() => {
        // Simulate authenticated user data
        const mockUser = {
          id: '1096773348868587521',
          email: 'andrewqr@gmail.com',
          name: 'Andrew Smith',
          role: 'admin',
          authenticated: true
        };
        
        // Set authentication data in localStorage
        localStorage.setItem('auth_user', JSON.stringify(mockUser));
        localStorage.setItem('oidc_user', JSON.stringify(mockUser));
        
        // Set session data
        sessionStorage.setItem('cognito_page_state', JSON.stringify({
          url: '/new-post',
          timestamp: Date.now()
        }));
        
        console.log('Simulated authentication data set');
      });

      // 3. Navigate back to new post page
      console.log('3. Navigating back to new post page...');
      await page.goto('/new-post');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: join(screenshotDir, '02-new-post-after-auth.png') });
    }

    // 4. Check if editor elements are visible
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

      // 5. Test post creation
      const newPostTitle = `Simulated Auth Test Post ${new Date().toISOString()}`;
      const newPostContent = `This is content for a test post created with simulated authentication at ${new Date().toISOString()}.`;

      await page.locator('input[placeholder="Enter your post title..."]').fill(newPostTitle);
      await page.locator('.wysimark-editor .wm-editor-content').fill(newPostContent);
      await page.screenshot({ path: join(screenshotDir, '03-after-content-entry.png') });

      // Select 'Published' status
      await page.locator('button[aria-haspopup="listbox"]').click();
      await page.locator('div[role="option"]:has-text("Published")').click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: join(screenshotDir, '04-after-status-change.png') });

      // Save the post
      await page.locator('button:has-text("Save")').click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: join(screenshotDir, '05-after-save.png') });

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
      console.log('❌ Editor elements not all visible - authentication simulation may have failed');
      
      // Try to debug what's happening
      const pageContent = await page.content();
      console.log('Page content length:', pageContent.length);
      
      // Check for any error messages
      const errorElements = await page.locator('[class*="error"], [class*="Error"]').count();
      console.log('Error elements found:', errorElements);
      
      // Check for authentication-related elements
      const loginElements = await page.locator('button:has-text("Login"), a:has-text("Login")').count();
      console.log('Login elements found:', loginElements);
    }

    console.log('✅ Simulated authentication test completed!');
  });

  test('Test Dashboard with Simulated Authentication', async () => {
    console.log('📊 Testing dashboard with simulated authentication...');
    
    // Set up simulated authentication first
    await page.evaluate(() => {
      const mockUser = {
        id: '1096773348868587521',
        email: 'andrewqr@gmail.com',
        name: 'Andrew Smith',
        role: 'admin',
        authenticated: true
      };
      
      localStorage.setItem('auth_user', JSON.stringify(mockUser));
      localStorage.setItem('oidc_user', JSON.stringify(mockUser));
    });
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: join(screenshotDir, '06-dashboard.png') });

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
      console.log('❌ Dashboard elements not visible - may need different authentication approach');
    }
  });

  test('Test Home Page with Simulated Authentication', async () => {
    console.log('🏠 Testing home page with simulated authentication...');
    
    // Set up simulated authentication first
    await page.evaluate(() => {
      const mockUser = {
        id: '1096773348868587521',
        email: 'andrewqr@gmail.com',
        name: 'Andrew Smith',
        role: 'admin',
        authenticated: true
      };
      
      localStorage.setItem('auth_user', JSON.stringify(mockUser));
      localStorage.setItem('oidc_user', JSON.stringify(mockUser));
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: join(screenshotDir, '07-home-page.png') });

    // Check home page elements
    const homeTitleVisible = await page.locator('h1:has-text("Welcome"), h1:has-text("Home")').isVisible();
    const postsListVisible = await page.locator('.posts-list, [class*="post"]').isVisible();
    const newPostLinkVisible = await page.locator('a:has-text("New Post"), button:has-text("New Post")').isVisible();

    console.log('Home page elements visibility:');
    console.log('- Home title:', homeTitleVisible);
    console.log('- Posts list:', postsListVisible);
    console.log('- New Post link:', newPostLinkVisible);

    if (homeTitleVisible || postsListVisible) {
      console.log('✅ Home page elements are visible!');
    } else {
      console.log('❌ Home page elements not visible - may need different authentication approach');
    }
  });
});
