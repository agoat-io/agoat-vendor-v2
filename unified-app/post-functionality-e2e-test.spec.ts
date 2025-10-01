import { test, expect, Page } from '@playwright/test';

// Test the post functionality end-to-end with screenshots
test.describe('Post Functionality E2E Tests', () => {
  let page: Page;
  let testPostId: string | null = null;

  test.beforeEach(async ({ browser }) => {
    // Create a new page for each test
    page = await browser.newPage();
    
    // Set viewport for consistent screenshots
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Navigate to the application
    await page.goto('https://dev.np-topvitaminsupply.com');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('Test New Post Creation and Editing Workflow with Screenshots', async () => {
    console.log('🧪 Starting E2E test for post functionality...');

    // Step 1: Navigate to new post page
    console.log('1. Navigating to new post page...');
    await page.goto('https://dev.np-topvitaminsupply.com/new-post');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of new post page
    await page.screenshot({ 
      path: '/Users/andrewsmith/Library/CloudStorage/Dropbox/projects/03-project-management-common/agoat-publisher-e2e-images/01-new-post-page.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved: 01-new-post-page.png');

    // Check for JavaScript errors
    const jsErrors: string[] = [];
    page.on('pageerror', error => {
      jsErrors.push(`JavaScript Error: ${error.message}`);
    });

    // Step 2: Check if we need to login
    console.log('2. Checking authentication status...');
    const currentUrl = page.url();
    if (currentUrl.includes('/login') || currentUrl.includes('/cognito-login')) {
      console.log('   Authentication required, taking screenshot...');
      await page.screenshot({ 
        path: '/Users/andrewsmith/Library/CloudStorage/Dropbox/projects/03-project-management-common/agoat-publisher-e2e-images/02-login-required.png',
        fullPage: true 
      });
      console.log('📸 Screenshot saved: 02-login-required.png');
    }

    // Step 3: Test the new post form
    console.log('3. Testing new post form...');
    
    // Check if the WysimarkEditor is present
    const editor = page.locator('.wysimark-editor');
    if (await editor.isVisible()) {
      // Take screenshot of the editor
      await page.screenshot({ 
        path: '/Users/andrewsmith/Library/CloudStorage/Dropbox/projects/03-project-management-common/agoat-publisher-e2e-images/03-wysimark-editor.png',
        fullPage: true 
      });
      console.log('📸 Screenshot saved: 03-wysimark-editor.png');

      // Step 4: Test status dropdown
      console.log('4. Testing status dropdown...');
      
      // Look for the status dropdown
      const statusDropdown = page.locator('[data-radix-select-trigger]').first();
      if (await statusDropdown.isVisible()) {
        await statusDropdown.click();
        await page.waitForTimeout(500);
        
        // Take screenshot of dropdown open
        await page.screenshot({ 
          path: '/Users/andrewsmith/Library/CloudStorage/Dropbox/projects/03-project-management-common/agoat-publisher-e2e-images/04-status-dropdown-open.png',
          fullPage: true 
        });
        console.log('📸 Screenshot saved: 04-status-dropdown-open.png');
        
        // Close dropdown by clicking elsewhere
        await page.click('body');
        await page.waitForTimeout(500);
      }

      // Step 5: Test save button
      console.log('5. Testing save button...');
      
      // Look for the save button
      const saveButton = page.locator('button:has-text("Save")').first();
      if (await saveButton.isVisible()) {
        // Take screenshot of save button
        await page.screenshot({ 
          path: '/Users/andrewsmith/Library/CloudStorage/Dropbox/projects/03-project-management-common/agoat-publisher-e2e-images/05-save-button.png',
          fullPage: true 
        });
        console.log('📸 Screenshot saved: 05-save-button.png');
        
        // Check if save button is disabled (should be initially)
        const isDisabled = await saveButton.isDisabled();
        console.log(`   Save button disabled: ${isDisabled}`);
      }
    }

    // Step 6: Test dashboard page
    console.log('6. Testing dashboard page...');
    await page.goto('https://dev.np-topvitaminsupply.com/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of dashboard
    await page.screenshot({ 
      path: '/Users/andrewsmith/Library/CloudStorage/Dropbox/projects/03-project-management-common/agoat-publisher-e2e-images/06-dashboard-page.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved: 06-dashboard-page.png');

    // Step 7: Test home page
    console.log('7. Testing home page...');
    await page.goto('https://dev.np-topvitaminsupply.com/');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of home page
    await page.screenshot({ 
      path: '/Users/andrewsmith/Library/CloudStorage/Dropbox/projects/03-project-management-common/agoat-publisher-e2e-images/07-home-page.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved: 07-home-page.png');

    // Step 8: Check for JavaScript errors
    console.log('8. Checking for JavaScript errors...');
    if (jsErrors.length > 0) {
      console.log('   JavaScript errors found:');
      jsErrors.forEach(error => console.log(`   - ${error}`));
    } else {
      console.log('   No JavaScript errors detected');
    }

    console.log('✅ E2E test completed successfully!');
  });

  test('Test Post Creation with API and Screenshots', async () => {
    console.log('🧪 Testing post creation with API...');

    // Create a test post via API
    const response = await page.request.post('https://dev.np-topvitaminsupply.com/api/sites/18c6498d-f738-4c9f-aefd-d66bec11d751/posts', {
      data: {
        title: `E2E Test Post ${new Date().toISOString()}`,
        content: '# E2E Test Post\n\nThis post was created during E2E testing.',
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

    // Take screenshot of the edit page
    await page.screenshot({ 
      path: '/Users/andrewsmith/Library/CloudStorage/Dropbox/projects/03-project-management-common/agoat-publisher-e2e-images/08-edit-created-post.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved: 08-edit-created-post.png');

    // Test the edit page functionality
    console.log('9. Testing edit page functionality...');
    
    // Check if the WysimarkEditor is present
    const editor = page.locator('.wysimark-editor');
    if (await editor.isVisible()) {
      // Take screenshot of the editor with content
      await page.screenshot({ 
        path: '/Users/andrewsmith/Library/CloudStorage/Dropbox/projects/03-project-management-common/agoat-publisher-e2e-images/09-edit-page-with-content.png',
        fullPage: true 
      });
      console.log('📸 Screenshot saved: 09-edit-page-with-content.png');
    }

    console.log('✅ Post creation and edit test completed!');
  });
});
