import { test, expect, Page } from '@playwright/test';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Test the fixes with authentication
test.describe('Test Fixes with Authentication', () => {
  let page: Page;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const screenshotDir = `/Users/andrewsmith/Library/CloudStorage/Dropbox/projects/03-project-management-common/agoat-publisher-e2e-images/${timestamp}-fixes-test`;

  test.beforeAll(async () => {
    // Create timestamped directory for screenshots
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

  test('Test Component Rendering Fixes with Authentication', async () => {
    console.log('🔧 Testing component rendering fixes with authentication...');

    // Step 1: Navigate to home page
    console.log('1. Navigating to home page...');
    await page.goto('https://dev.np-topvitaminsupply.com/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Take screenshot of home page
    await page.screenshot({ 
      path: `${screenshotDir}/01-home-page-fixed.png`,
      fullPage: true 
    });
    console.log('📸 Screenshot saved: 01-home-page-fixed.png');

    // Check for navigation elements
    const navElements = await page.locator('nav, [role="navigation"]').count();
    console.log(`Navigation elements found: ${navElements}`);

    // Check for posts list
    const postsList = await page.locator('[class*="post"], [class*="Post"]').count();
    console.log(`Post elements found: ${postsList}`);

    // Step 2: Navigate to new post page (should require authentication)
    console.log('2. Navigating to new post page...');
    await page.goto('https://dev.np-topvitaminsupply.com/new-post');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Take screenshot of new post page
    await page.screenshot({ 
      path: `${screenshotDir}/02-new-post-page-fixed.png`,
      fullPage: true 
    });
    console.log('📸 Screenshot saved: 02-new-post-page-fixed.png');

    // Check current URL (should be redirected to login)
    const currentUrl = page.url();
    console.log(`Current URL after auth redirect: ${currentUrl}`);

    // Step 3: Navigate to login page
    console.log('3. Navigating to login page...');
    await page.goto('https://dev.np-topvitaminsupply.com/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Take screenshot of login page
    await page.screenshot({ 
      path: `${screenshotDir}/03-login-page-fixed.png`,
      fullPage: true 
    });
    console.log('📸 Screenshot saved: 03-login-page-fixed.png');

    // Check for login form elements
    const loginForm = await page.locator('form, [class*="login"], [class*="Login"]').count();
    console.log(`Login form elements found: ${loginForm}`);

    // Step 4: Navigate to dashboard
    console.log('4. Navigating to dashboard...');
    await page.goto('https://dev.np-topvitaminsupply.com/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Take screenshot of dashboard
    await page.screenshot({ 
      path: `${screenshotDir}/04-dashboard-page-fixed.png`,
      fullPage: true 
    });
    console.log('📸 Screenshot saved: 04-dashboard-page-fixed.png');

    // Check for dashboard elements
    const dashboardElements = await page.locator('[class*="dashboard"], [class*="Dashboard"]').count();
    console.log(`Dashboard elements found: ${dashboardElements}`);

    // Check for new post button
    const newPostButton = page.locator('button:has-text("New Post"), a:has-text("New Post")').first();
    if (await newPostButton.isVisible()) {
      console.log('New Post button found on dashboard');
    } else {
      console.log('New Post button not found on dashboard');
    }

    // Step 5: Test Thorne pages
    console.log('5. Testing Thorne pages...');
    
    // Test Thorne Education page
    await page.goto('https://dev.np-topvitaminsupply.com/thorne/education');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.screenshot({ 
      path: `${screenshotDir}/05-thorne-education-fixed.png`,
      fullPage: true 
    });
    console.log('📸 Screenshot saved: 05-thorne-education-fixed.png');

    // Step 6: Test API functionality
    console.log('6. Testing API functionality...');
    
    // Test API status endpoint
    const statusResponse = await page.request.get('https://dev.np-topvitaminsupply.com/api/status');
    console.log(`API Status: ${statusResponse.status()}`);
    
    if (statusResponse.ok()) {
      const statusData = await statusResponse.json();
      console.log(`API Status Data:`, statusData);
    }

    // Test posts API endpoint
    const postsResponse = await page.request.get('https://dev.np-topvitaminsupply.com/api/sites/18c6498d-f738-4c9f-aefd-d66bec11d751/posts');
    console.log(`Posts API Status: ${postsResponse.status()}`);
    
    if (postsResponse.ok()) {
      const postsData = await postsResponse.json();
      console.log(`Posts count: ${postsData.data?.length || 0}`);
    }

    console.log('✅ Component rendering fixes test completed!');
  });

  test('Test Post Creation with Fixed Components', async () => {
    console.log('📝 Testing post creation with fixed components...');

    // Create a test post via API
    const response = await page.request.post('https://dev.np-topvitaminsupply.com/api/sites/18c6498d-f738-4c9f-aefd-d66bec11d751/posts', {
      data: {
        title: `Fixed Components Test Post ${new Date().toISOString()}`,
        content: '# Fixed Components Test Post\n\nThis post was created to test the fixed components.\n\n## Components Tested\n- WysimarkEditor\n- Status dropdown\n- Save button\n- Navigation elements',
        published: false,
        status: 'draft'
      },
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': '1096773348868587521',
        'X-User-Role': 'admin'
      }
    });

    expect(response.ok()).toBeTruthy();
    const postData = await response.json();
    const testPostId = postData.data.id;
    console.log(`✅ Test post created with ID: ${testPostId}`);

    // Navigate to edit the created post
    await page.goto(`https://dev.np-topvitaminsupply.com/edit-post/${testPostId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Take screenshot of the edit page
    await page.screenshot({ 
      path: `${screenshotDir}/06-edit-post-fixed.png`,
      fullPage: true 
    });
    console.log('📸 Screenshot saved: 06-edit-post-fixed.png');

    // Check for editor elements
    const editorElements = await page.locator('[class*="editor"], [class*="Editor"], .wysimark-editor').count();
    console.log(`Editor elements found: ${editorElements}`);

    // Check for status dropdown
    const statusDropdown = page.locator('[data-radix-select-trigger], select').first();
    if (await statusDropdown.isVisible()) {
      console.log('Status dropdown found');
    } else {
      console.log('Status dropdown not found');
    }

    // Check for save button
    const saveButton = page.locator('button:has-text("Save")').first();
    if (await saveButton.isVisible()) {
      console.log('Save button found');
    } else {
      console.log('Save button not found');
    }

    console.log('✅ Post creation with fixed components test completed!');
  });
});
