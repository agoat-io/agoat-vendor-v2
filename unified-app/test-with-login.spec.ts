import { test, expect, Page } from '@playwright/test';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Test with actual login process
test.describe('Test with Login Process', () => {
  let page: Page;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const screenshotDir = `/projects/03-project-management-common/agoat-publisher-e2e-images/${timestamp}-login-test`;

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

  test('Test Login Process and Post Creation', async () => {
    console.log('🔐 Testing login process and post creation...');

    // Step 1: Navigate to new post page (should redirect to login)
    console.log('1. Navigating to new post page...');
    await page.goto('https://dev.np-topvitaminsupply.com/new-post');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Take screenshot before login
    await page.screenshot({ 
      path: `${screenshotDir}/01-before-login.png`,
      fullPage: true 
    });
    console.log('📸 Screenshot saved: 01-before-login.png');

    // Step 2: Perform login process
    console.log('2. Performing login process...');
    
    // Look for login button or link
    const loginButton = page.locator('button:has-text("Login"), a:has-text("Login"), button:has-text("Sign In"), a:has-text("Sign In")').first();
    
    if (await loginButton.isVisible()) {
      console.log('Found login button, clicking...');
      await loginButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
    } else {
      console.log('No login button found, checking current URL...');
      const currentUrl = page.url();
      console.log(`Current URL: ${currentUrl}`);
    }

    // Take screenshot after clicking login
    await page.screenshot({ 
      path: `${screenshotDir}/02-after-login-click.png`,
      fullPage: true 
    });
    console.log('📸 Screenshot saved: 02-after-login-click.png');

    // Step 3: Look for "Other ways" or password login option
    console.log('3. Looking for password login option...');
    
    // Look for "Other ways" or similar text
    const otherWaysButton = page.locator('text=Other ways, text=Other options, text=Password, button:has-text("Other"), a:has-text("Other")').first();
    
    if (await otherWaysButton.isVisible()) {
      console.log('Found "Other ways" option, clicking...');
      await otherWaysButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
    } else {
      console.log('No "Other ways" option found, checking for direct password fields...');
    }

    // Take screenshot after selecting other ways
    await page.screenshot({ 
      path: `${screenshotDir}/03-after-other-ways.png`,
      fullPage: true 
    });
    console.log('📸 Screenshot saved: 03-after-other-ways.png');

    // Step 4: Enter email
    console.log('4. Entering email...');
    const emailField = page.locator('input[type="email"], input[name="email"], input[placeholder*="email"], input[placeholder*="Email"]').first();
    
    if (await emailField.isVisible()) {
      console.log('Found email field, entering email...');
      await emailField.fill('andrewqr@gmail.com');
      await page.waitForTimeout(1000);
    } else {
      console.log('No email field found');
    }

    // Step 5: Enter password
    console.log('5. Entering password...');
    const passwordField = page.locator('input[type="password"], input[name="password"], input[placeholder*="password"], input[placeholder*="Password"]').first();
    
    if (await passwordField.isVisible()) {
      console.log('Found password field, entering password...');
      await passwordField.fill('Bremi-turp-443@');
      await page.waitForTimeout(1000);
    } else {
      console.log('No password field found');
    }

    // Take screenshot after entering credentials
    await page.screenshot({ 
      path: `${screenshotDir}/04-after-credentials.png`,
      fullPage: true 
    });
    console.log('📸 Screenshot saved: 04-after-credentials.png');

    // Step 6: Click login/submit button
    console.log('6. Clicking login/submit button...');
    const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In"), button:has-text("Submit"), input[type="submit"]').first();
    
    if (await submitButton.isVisible()) {
      console.log('Found submit button, clicking...');
      await submitButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000); // Wait longer for redirect
    } else {
      console.log('No submit button found');
    }

    // Take screenshot after login attempt
    await page.screenshot({ 
      path: `${screenshotDir}/05-after-login-attempt.png`,
      fullPage: true 
    });
    console.log('📸 Screenshot saved: 05-after-login-attempt.png');

    // Step 7: Check if we're redirected back to the app
    console.log('7. Checking if redirected back to app...');
    const currentUrl = page.url();
    console.log(`Current URL after login: ${currentUrl}`);

    // Wait for potential redirect
    await page.waitForTimeout(3000);
    const finalUrl = page.url();
    console.log(`Final URL: ${finalUrl}`);

    // Take screenshot of final state
    await page.screenshot({ 
      path: `${screenshotDir}/06-final-state.png`,
      fullPage: true 
    });
    console.log('📸 Screenshot saved: 06-final-state.png');

    // Step 8: Navigate to new post page if not already there
    console.log('8. Navigating to new post page...');
    await page.goto('https://dev.np-topvitaminsupply.com/new-post');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Take screenshot of new post page
    await page.screenshot({ 
      path: `${screenshotDir}/07-new-post-page.png`,
      fullPage: true 
    });
    console.log('📸 Screenshot saved: 07-new-post-page.png');

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

    // Step 9: Test post creation
    console.log('9. Testing post creation...');
    
    // Look for title field
    const titleField = page.locator('input[placeholder*="title"], input[placeholder*="Title"], input[name="title"]').first();
    if (await titleField.isVisible()) {
      console.log('Found title field, entering title...');
      await titleField.fill('Test Post After Login');
      await page.waitForTimeout(1000);
    }

    // Look for content field
    const contentField = page.locator('[contenteditable], textarea, [class*="editor"]').first();
    if (await contentField.isVisible()) {
      console.log('Found content field, entering content...');
      await contentField.fill('This is a test post created after successful login.');
      await page.waitForTimeout(1000);
    }

    // Take screenshot after entering content
    await page.screenshot({ 
      path: `${screenshotDir}/08-after-content-entry.png`,
      fullPage: true 
    });
    console.log('📸 Screenshot saved: 08-after-content-entry.png');

    // Try to save the post
    if (await saveButton.isVisible()) {
      console.log('Clicking save button...');
      await saveButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
    }

    // Take screenshot after save attempt
    await page.screenshot({ 
      path: `${screenshotDir}/09-after-save-attempt.png`,
      fullPage: true 
    });
    console.log('📸 Screenshot saved: 09-after-save-attempt.png');

    console.log('✅ Login and post creation test completed!');
  });

  test('Test Dashboard After Login', async () => {
    console.log('📊 Testing dashboard after login...');

    // Navigate to dashboard
    await page.goto('https://dev.np-topvitaminsupply.com/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Take screenshot of dashboard
    await page.screenshot({ 
      path: `${screenshotDir}/10-dashboard-after-login.png`,
      fullPage: true 
    });
    console.log('📸 Screenshot saved: 10-dashboard-after-login.png');

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

    console.log('✅ Dashboard test completed!');
  });
});
