import { test, expect, Page } from '@playwright/test';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Comprehensive test suite for all application functionality
test.describe('Comprehensive Application Testing', () => {
  let page: Page;
  let testPostId: string | null = null;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const screenshotDir = `/Users/andrewsmith/Library/CloudStorage/Dropbox/projects/03-project-management-common/agoat-publisher-e2e-images/${timestamp}`;

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

  test('Test 1: Application Home Page and Navigation', async () => {
    console.log('🏠 Testing home page and navigation...');

    // Navigate to home page
    await page.goto('https://dev.np-topvitaminsupply.com/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({ 
      path: `${screenshotDir}/01-home-page.png`,
      fullPage: true 
    });
    console.log('📸 Screenshot saved: 01-home-page.png');

    // Check page title
    const title = await page.title();
    console.log(`Page title: ${title}`);

    // Check for navigation elements
    const navElements = await page.locator('nav, [role="navigation"]').count();
    console.log(`Navigation elements found: ${navElements}`);

    // Check for posts list
    const postsList = await page.locator('[class*="post"], [class*="Post"]').count();
    console.log(`Post elements found: ${postsList}`);

    // Test navigation to dashboard
    const dashboardLink = page.locator('a[href="/dashboard"], a:has-text("Dashboard")').first();
    if (await dashboardLink.isVisible()) {
      await dashboardLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: `${screenshotDir}/02-dashboard-navigation.png`,
        fullPage: true 
      });
      console.log('📸 Screenshot saved: 02-dashboard-navigation.png');
    }
  });

  test('Test 2: Authentication Flow', async () => {
    console.log('🔐 Testing authentication flow...');

    // Navigate to new post page (should require authentication)
    await page.goto('https://dev.np-topvitaminsupply.com/new-post');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Take screenshot of authentication requirement
    await page.screenshot({ 
      path: `${screenshotDir}/03-auth-required.png`,
      fullPage: true 
    });
    console.log('📸 Screenshot saved: 03-auth-required.png');

    // Check current URL (should be redirected to login)
    const currentUrl = page.url();
    console.log(`Current URL after auth redirect: ${currentUrl}`);

    // Navigate to login page directly
    await page.goto('https://dev.np-topvitaminsupply.com/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Take screenshot of login page
    await page.screenshot({ 
      path: `${screenshotDir}/04-login-page.png`,
      fullPage: true 
    });
    console.log('📸 Screenshot saved: 04-login-page.png');

    // Check for login form elements
    const loginForm = await page.locator('form, [class*="login"], [class*="Login"]').count();
    console.log(`Login form elements found: ${loginForm}`);

    // Navigate to Cognito login
    await page.goto('https://dev.np-topvitaminsupply.com/cognito-login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Take screenshot of Cognito login
    await page.screenshot({ 
      path: `${screenshotDir}/05-cognito-login.png`,
      fullPage: true 
    });
    console.log('📸 Screenshot saved: 05-cognito-login.png');
  });

  test('Test 3: Dashboard Functionality', async () => {
    console.log('📊 Testing dashboard functionality...');

    // Navigate to dashboard
    await page.goto('https://dev.np-topvitaminsupply.com/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Take screenshot of dashboard
    await page.screenshot({ 
      path: `${screenshotDir}/06-dashboard-page.png`,
      fullPage: true 
    });
    console.log('📸 Screenshot saved: 06-dashboard-page.png');

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

    // Check for posts list
    const postsList = await page.locator('[class*="post"], [class*="Post"]').count();
    console.log(`Post elements found on dashboard: ${postsList}`);
  });

  test('Test 4: Post Creation and Editing (API-based)', async () => {
    console.log('📝 Testing post creation and editing...');

    // Create a test post via API
    const response = await page.request.post('https://dev.np-topvitaminsupply.com/api/sites/18c6498d-f738-4c9f-aefd-d66bec11d751/posts', {
      data: {
        title: `Comprehensive Test Post ${new Date().toISOString()}`,
        content: '# Comprehensive Test Post\n\nThis post was created during comprehensive testing.\n\n## Features Tested\n- Post creation\n- Content editing\n- Status management',
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
    testPostId = postData.data.id;
    console.log(`✅ Test post created with ID: ${testPostId}`);

    // Navigate to edit the created post
    await page.goto(`https://dev.np-topvitaminsupply.com/edit-post/${testPostId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Take screenshot of edit page
    await page.screenshot({ 
      path: `${screenshotDir}/07-edit-post-page.png`,
      fullPage: true 
    });
    console.log('📸 Screenshot saved: 07-edit-post-page.png');

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
  });

  test('Test 5: Thorne Reseller Functionality', async () => {
    console.log('🏥 Testing Thorne reseller functionality...');

    // Test Thorne Education page
    await page.goto('https://dev.np-topvitaminsupply.com/thorne/education');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.screenshot({ 
      path: `${screenshotDir}/08-thorne-education.png`,
      fullPage: true 
    });
    console.log('📸 Screenshot saved: 08-thorne-education.png');

    // Test Thorne Registration page
    await page.goto('https://dev.np-topvitaminsupply.com/thorne/register');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.screenshot({ 
      path: `${screenshotDir}/09-thorne-registration.png`,
      fullPage: true 
    });
    console.log('📸 Screenshot saved: 09-thorne-registration.png');

    // Test Thorne Patient Portal
    await page.goto('https://dev.np-topvitaminsupply.com/thorne/portal');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.screenshot({ 
      path: `${screenshotDir}/10-thorne-portal.png`,
      fullPage: true 
    });
    console.log('📸 Screenshot saved: 10-thorne-portal.png');

    // Test Thorne Compliance
    await page.goto('https://dev.np-topvitaminsupply.com/thorne/compliance');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.screenshot({ 
      path: `${screenshotDir}/11-thorne-compliance.png`,
      fullPage: true 
    });
    console.log('📸 Screenshot saved: 11-thorne-compliance.png');
  });

  test('Test 6: Post Viewing and Navigation', async () => {
    console.log('👁️ Testing post viewing and navigation...');

    if (testPostId) {
      // Navigate to view the created post
      await page.goto(`https://dev.np-topvitaminsupply.com/post/${testPostId}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // Take screenshot of post view
      await page.screenshot({ 
        path: `${screenshotDir}/12-post-view.png`,
        fullPage: true 
      });
      console.log('📸 Screenshot saved: 12-post-view.png');

      // Check for post content
      const postContent = await page.locator('[class*="post"], [class*="Post"], article').count();
      console.log(`Post content elements found: ${postContent}`);
    }

    // Test navigation back to home
    await page.goto('https://dev.np-topvitaminsupply.com/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ 
      path: `${screenshotDir}/13-navigation-back-home.png`,
      fullPage: true 
    });
    console.log('📸 Screenshot saved: 13-navigation-back-home.png');
  });

  test('Test 7: Error Handling and Edge Cases', async () => {
    console.log('⚠️ Testing error handling and edge cases...');

    // Test 404 page
    await page.goto('https://dev.np-topvitaminsupply.com/nonexistent-page');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.screenshot({ 
      path: `${screenshotDir}/14-404-page.png`,
      fullPage: true 
    });
    console.log('📸 Screenshot saved: 14-404-page.png');

    // Test invalid post ID
    await page.goto('https://dev.np-topvitaminsupply.com/post/invalid-id');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.screenshot({ 
      path: `${screenshotDir}/15-invalid-post-id.png`,
      fullPage: true 
    });
    console.log('📸 Screenshot saved: 15-invalid-post-id.png');

    // Test invalid edit post ID
    await page.goto('https://dev.np-topvitaminsupply.com/edit-post/invalid-id');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.screenshot({ 
      path: `${screenshotDir}/16-invalid-edit-post-id.png`,
      fullPage: true 
    });
    console.log('📸 Screenshot saved: 16-invalid-edit-post-id.png');
  });

  test('Test 8: Responsive Design and Mobile View', async () => {
    console.log('📱 Testing responsive design...');

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('https://dev.np-topvitaminsupply.com/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.screenshot({ 
      path: `${screenshotDir}/17-mobile-home.png`,
      fullPage: true 
    });
    console.log('📸 Screenshot saved: 17-mobile-home.png');

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('https://dev.np-topvitaminsupply.com/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.screenshot({ 
      path: `${screenshotDir}/18-tablet-dashboard.png`,
      fullPage: true 
    });
    console.log('📸 Screenshot saved: 18-tablet-dashboard.png');

    // Reset to desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('Test 9: API Health and Status', async () => {
    console.log('🔍 Testing API health and status...');

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
  });

  test('Test 10: Final Application State', async () => {
    console.log('🏁 Capturing final application state...');

    // Navigate to home page for final state
    await page.goto('https://dev.np-topvitaminsupply.com/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Take final screenshot
    await page.screenshot({ 
      path: `${screenshotDir}/19-final-state.png`,
      fullPage: true 
    });
    console.log('📸 Screenshot saved: 19-final-state.png');

    // Log final statistics
    console.log(`\n📊 Final Test Statistics:`);
    console.log(`- Screenshots saved: 19`);
    console.log(`- Test post created: ${testPostId || 'None'}`);
    console.log('\n✅ Comprehensive testing completed');
  });
});
