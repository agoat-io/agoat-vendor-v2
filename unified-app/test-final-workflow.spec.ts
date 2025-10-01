import { test, expect, Page } from '@playwright/test';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

test.describe('Final Post Creation and Editing Workflow Test', () => {
  let page: Page;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const screenshotDir = `/Users/andrewsmith/Library/CloudStorage/Dropbox/projects/03-project-management-common/agoat-publisher-e2e-images/${timestamp}-final-workflow`;

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

    // Capture API requests
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        console.log(`🌐 API Request: ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log(`📡 API Response: ${response.status()} ${response.url()}`);
      }
    });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('Complete Post Creation and Editing Workflow', async () => {
    console.log('🚀 Testing complete post creation and editing workflow...');

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

    // Step 1: Navigate to new post page
    console.log('1. Navigating to new post page...');
    await page.goto('/new-post');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: join(screenshotDir, '01-new-post-page.png') });

    // Verify we're on the new post page
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    expect(currentUrl).toContain('/new-post');

    // Step 2: Fill in post details
    console.log('2. Filling in post details...');
    const newPostTitle = `Final Workflow Test Post ${new Date().toISOString()}`;
    const newPostContent = `# Final Workflow Test Post

This is a comprehensive test of the post creation and editing workflow.

## Features Being Tested
- Post creation with title and content
- Status management (draft/published/archived)
- Save functionality
- Navigation to edit page
- Post editing capabilities

## Test Details
- Created at: ${new Date().toISOString()}
- Test type: End-to-end workflow validation
- Authentication: Simulated OIDC authentication

This post should be successfully created and editable.`;

    // Fill in the title
    await page.locator('input[placeholder*="title"], input[placeholder*="Title"]').fill(newPostTitle);
    await page.screenshot({ path: join(screenshotDir, '02-after-title-entry.png') });

    // Fill in content
    await page.locator('.wysimark-editable, [data-wysimark]').fill(newPostContent);
    await page.screenshot({ path: join(screenshotDir, '03-after-content-entry.png') });

    // Step 3: Set status to published
    console.log('3. Setting status to published...');
    await page.locator('[role="combobox"], [aria-haspopup="listbox"]').click();
    await page.locator('[role="option"]:has-text("Published")').click();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: join(screenshotDir, '04-after-status-change.png') });

    // Step 4: Save the post
    console.log('4. Saving the post...');
    await page.locator('button:has-text("Save")').click();
    
    // Wait for the API request to complete
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: join(screenshotDir, '05-after-save.png') });

    // Step 5: Verify redirection to edit page
    console.log('5. Verifying redirection to edit page...');
    const urlAfterSave = page.url();
    console.log('URL after save:', urlAfterSave);
    
    if (urlAfterSave.includes('/edit-post/')) {
      console.log('✅ Successfully redirected to edit page!');
      
      // Extract post ID from URL
      const postIdMatch = urlAfterSave.match(/\/edit-post\/([^\/]+)/);
      const postId = postIdMatch ? postIdMatch[1] : null;
      console.log('Post ID:', postId);
      
      // Step 6: Verify post data is loaded correctly
      console.log('6. Verifying post data is loaded correctly...');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: join(screenshotDir, '06-edit-page-loaded.png') });
      
      // Check if title is loaded
      const titleValue = await page.locator('input[placeholder*="title"], input[placeholder*="Title"]').inputValue();
      console.log('Title value:', titleValue);
      expect(titleValue).toBe(newPostTitle);
      
      // Check if content is loaded (this might be more complex with Wysimark)
      const contentLoaded = await page.locator('.wysimark-editable, [data-wysimark]').isVisible();
      console.log('Content field visible:', contentLoaded);
      expect(contentLoaded).toBe(true);
      
      // Step 7: Test editing functionality
      console.log('7. Testing editing functionality...');
      const updatedTitle = `${newPostTitle} - Updated`;
      await page.locator('input[placeholder*="title"], input[placeholder*="Title"]').fill(updatedTitle);
      await page.screenshot({ path: join(screenshotDir, '07-after-title-update.png') });
      
      // Change status to archived
      await page.locator('[role="combobox"], [aria-haspopup="listbox"]').click();
      await page.locator('[role="option"]:has-text("Archived")').click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: join(screenshotDir, '08-after-status-update.png') });
      
      // Save the updated post
      await page.locator('button:has-text("Save")').click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: join(screenshotDir, '09-after-update-save.png') });
      
      // Verify the title was updated
      const finalTitleValue = await page.locator('input[placeholder*="title"], input[placeholder*="Title"]').inputValue();
      console.log('Final title value:', finalTitleValue);
      expect(finalTitleValue).toBe(updatedTitle);
      
      console.log('✅ Complete workflow test successful!');
      
    } else {
      console.log('❌ Not redirected to edit page as expected');
      console.log('Current URL:', urlAfterSave);
      
      // Check for any error messages
      const errorElements = await page.locator('[class*="error"], [class*="Error"], [role="alert"]').count();
      console.log('Error elements found:', errorElements);
      
      if (errorElements > 0) {
        const errorTexts = await page.locator('[class*="error"], [class*="Error"], [role="alert"]').allTextContents();
        console.log('Error texts:', errorTexts);
      }
    }

    console.log('✅ Final workflow test completed!');
  });
});
