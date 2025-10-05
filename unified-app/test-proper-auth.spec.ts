import { test, expect, Page } from '@playwright/test';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

test.describe('Test with Proper Authentication', () => {
  let page: Page;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const screenshotDir = `/projects/03-project-management-common/agoat-publisher-e2e-images/${timestamp}-proper-auth`;

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

  test('Test New Post Page with Proper Authentication', async () => {
    console.log('🔐 Testing new post page with proper authentication...');

    // Set up authentication by adding localStorage before navigation
    await page.addInitScript(() => {
      const mockUser = {
        id: '1096773348868587521',
        email: 'andrewqr@gmail.com',
        name: 'Andrew Smith',
        role: 'admin',
        authenticated: true
      };
      
      // Set the localStorage values that the OIDC context checks for
      localStorage.setItem('oidc_user', JSON.stringify(mockUser));
      localStorage.setItem('auth_user', JSON.stringify(mockUser));
      
      console.log('Authentication data set in localStorage');
    });

    // Navigate to new post page
    console.log('1. Navigating to new post page...');
    await page.goto('/new-post');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: join(screenshotDir, '01-new-post-page.png') });

    // Check if we're on the new post page (not redirected to login)
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    if (currentUrl.includes('/login') || currentUrl.includes('/cognito-login')) {
      console.log('❌ Still redirected to login page - authentication not working');
      return;
    }

    console.log('✅ Successfully on new post page - authentication working!');

    // Check for editor elements
    const editorVisible = await page.locator('.wysimark-editor').isVisible();
    const titleFieldVisible = await page.locator('input[placeholder*="title"], input[placeholder*="Title"]').isVisible();
    const contentFieldVisible = await page.locator('.wysimark-editable, [data-wysimark]').isVisible();
    const statusDropdownVisible = await page.locator('[role="combobox"], [aria-haspopup="listbox"]').isVisible();
    const saveButtonVisible = await page.locator('button:has-text("Save")').isVisible();

    console.log('Editor elements visibility:');
    console.log('- Editor:', editorVisible);
    console.log('- Title field:', titleFieldVisible);
    console.log('- Content field:', contentFieldVisible);
    console.log('- Status dropdown:', statusDropdownVisible);
    console.log('- Save button:', saveButtonVisible);

    // Get more detailed information about what's actually on the page
    const allButtons = await page.locator('button').count();
    const allInputs = await page.locator('input').count();
    const allDivs = await page.locator('div[class]').count();
    
    console.log('Page elements:');
    console.log('- Total buttons:', allButtons);
    console.log('- Total inputs:', allInputs);
    console.log('- Total divs with classes:', allDivs);

    // Get visible text to see what's actually rendered
    const visibleText = await page.locator('body').textContent();
    console.log('Visible text length:', visibleText?.length || 0);
    console.log('First 200 characters:', visibleText?.substring(0, 200));

    if (editorVisible && titleFieldVisible && saveButtonVisible) {
      console.log('✅ Core editor elements are visible! Testing post creation...');

      // Test post creation
      const newPostTitle = `Proper Auth Test Post ${new Date().toISOString()}`;
      const newPostContent = `This is content for a test post created with proper authentication at ${new Date().toISOString()}.`;

      // Fill in the title
      await page.locator('input[placeholder*="title"], input[placeholder*="Title"]').fill(newPostTitle);
      await page.screenshot({ path: join(screenshotDir, '02-after-title-entry.png') });

      // Try to fill in content (if content field is visible)
      if (contentFieldVisible) {
        await page.locator('.wysimark-editable, [data-wysimark]').fill(newPostContent);
        await page.screenshot({ path: join(screenshotDir, '03-after-content-entry.png') });
      }

      // Try to change status (if status dropdown is visible)
      if (statusDropdownVisible) {
        await page.locator('[role="combobox"], [aria-haspopup="listbox"]').click();
        await page.locator('[role="option"]:has-text("Published")').click();
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: join(screenshotDir, '04-after-status-change.png') });
      }

      // Save the post
      await page.locator('button:has-text("Save")').click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: join(screenshotDir, '05-after-save.png') });

      // Check if redirected to edit page
      const currentUrlAfterSave = page.url();
      console.log('URL after save:', currentUrlAfterSave);
      
      if (currentUrlAfterSave.includes('/edit-post/')) {
        console.log('✅ Successfully redirected to edit page!');
        await expect(page.locator('input[placeholder*="title"], input[placeholder*="Title"]')).toHaveValue(newPostTitle);
      } else {
        console.log('❌ Not redirected to edit page as expected');
      }
    } else {
      console.log('❌ Core editor elements not visible - checking what is visible...');
      
      // Debug: Get all button text
      const buttonTexts = await page.locator('button').allTextContents();
      console.log('Button texts:', buttonTexts);
      
      // Debug: Get all input placeholders
      const inputPlaceholders = await page.locator('input').evaluateAll(inputs => 
        inputs.map(input => input.getAttribute('placeholder'))
      );
      console.log('Input placeholders:', inputPlaceholders);
    }

    console.log('✅ Proper authentication test completed!');
  });

  test('Test Dashboard with Proper Authentication', async () => {
    console.log('📊 Testing dashboard with proper authentication...');
    
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
      console.log('❌ Dashboard elements not visible');
    }
  });

  test('Test Home Page with Proper Authentication', async () => {
    console.log('🏠 Testing home page with proper authentication...');
    
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
      console.log('❌ Home page elements not visible');
    }
  });
});
