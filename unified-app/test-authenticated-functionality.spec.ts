import { test, expect, Page } from '@playwright/test';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Test authenticated functionality by simulating login state
test.describe('Test Authenticated Functionality', () => {
  let page: Page;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const screenshotDir = `/Users/andrewsmith/Library/CloudStorage/Dropbox/projects/03-project-management-common/agoat-publisher-e2e-images/${timestamp}-authenticated-test`;

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

  test('Test Post Creation with Simulated Authentication', async () => {
    console.log('📝 Testing post creation with simulated authentication...');

    // Step 1: Create a test post via API first
    console.log('1. Creating test post via API...');
    const response = await page.request.post('https://dev.np-topvitaminsupply.com/api/sites/18c6498d-f738-4c9f-aefd-d66bec11d751/posts', {
      data: {
        title: `Authenticated Test Post ${new Date().toISOString()}`,
        content: '# Authenticated Test Post\n\nThis post was created to test authenticated functionality.\n\n## Features Tested\n- Post creation via API\n- Post editing interface\n- Status management\n- Save functionality',
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

    // Step 2: Navigate to edit the created post
    console.log('2. Navigating to edit post page...');
    await page.goto(`https://dev.np-topvitaminsupply.com/edit-post/${testPostId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // Wait longer for components to load

    // Take screenshot of edit page
    await page.screenshot({ 
      path: `${screenshotDir}/01-edit-post-page.png`,
      fullPage: true 
    });
    console.log('📸 Screenshot saved: 01-edit-post-page.png');

    // Step 3: Check for editor elements
    console.log('3. Checking for editor elements...');
    
    // Wait for components to load
    await page.waitForTimeout(3000);
    
    // Check for WysimarkEditor
    const wysimarkEditor = page.locator('.wysimark-editor, [class*="wysimark"], [class*="Wysimark"]').first();
    if (await wysimarkEditor.isVisible()) {
      console.log('✅ WysimarkEditor found');
    } else {
      console.log('❌ WysimarkEditor not found');
    }

    // Check for title field
    const titleField = page.locator('input[placeholder*="title"], input[placeholder*="Title"], input[name="title"]').first();
    if (await titleField.isVisible()) {
      console.log('✅ Title field found');
    } else {
      console.log('❌ Title field not found');
    }

    // Check for content field
    const contentField = page.locator('[contenteditable], textarea, [class*="editor"]').first();
    if (await contentField.isVisible()) {
      console.log('✅ Content field found');
    } else {
      console.log('❌ Content field not found');
    }

    // Check for status dropdown
    const statusDropdown = page.locator('[data-radix-select-trigger], select, [role="combobox"]').first();
    if (await statusDropdown.isVisible()) {
      console.log('✅ Status dropdown found');
    } else {
      console.log('❌ Status dropdown not found');
    }

    // Check for save button
    const saveButton = page.locator('button:has-text("Save"), button[type="submit"]').first();
    if (await saveButton.isVisible()) {
      console.log('✅ Save button found');
    } else {
      console.log('❌ Save button not found');
    }

    // Step 4: Test editing functionality
    console.log('4. Testing editing functionality...');
    
    // Try to edit title
    if (await titleField.isVisible()) {
      await titleField.fill('Updated Test Post Title');
      await page.waitForTimeout(1000);
      console.log('✅ Title updated');
    }

    // Try to edit content
    if (await contentField.isVisible()) {
      await contentField.fill('This is updated content for the test post.');
      await page.waitForTimeout(1000);
      console.log('✅ Content updated');
    }

    // Take screenshot after editing
    await page.screenshot({ 
      path: `${screenshotDir}/02-after-editing.png`,
      fullPage: true 
    });
    console.log('📸 Screenshot saved: 02-after-editing.png');

    // Step 5: Test status change
    console.log('5. Testing status change...');
    
    if (await statusDropdown.isVisible()) {
      await statusDropdown.click();
      await page.waitForTimeout(1000);
      
      // Look for published option
      const publishedOption = page.locator('[role="option"]:has-text("Published"), option:has-text("Published")').first();
      if (await publishedOption.isVisible()) {
        await publishedOption.click();
        await page.waitForTimeout(1000);
        console.log('✅ Status changed to Published');
      }
    }

    // Take screenshot after status change
    await page.screenshot({ 
      path: `${screenshotDir}/03-after-status-change.png`,
      fullPage: true 
    });
    console.log('📸 Screenshot saved: 03-after-status-change.png');

    // Step 6: Test save functionality
    console.log('6. Testing save functionality...');
    
    if (await saveButton.isVisible()) {
      await saveButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      console.log('✅ Save button clicked');
    }

    // Take screenshot after save
    await page.screenshot({ 
      path: `${screenshotDir}/04-after-save.png`,
      fullPage: true 
    });
    console.log('📸 Screenshot saved: 04-after-save.png');

    // Step 7: Verify post was updated via API
    console.log('7. Verifying post was updated...');
    
    const getResponse = await page.request.get(`https://dev.np-topvitaminsupply.com/api/sites/18c6498d-f738-4c9f-aefd-d66bec11d751/posts/${testPostId}`, {
      headers: {
        'X-User-ID': '1096773348868587521',
        'X-User-Role': 'admin'
      }
    });

    if (getResponse.ok()) {
      const updatedPost = await getResponse.json();
      console.log(`✅ Post retrieved: ${updatedPost.data.title}`);
      console.log(`✅ Post status: ${updatedPost.data.status}`);
      console.log(`✅ Post published: ${updatedPost.data.published}`);
    } else {
      console.log('❌ Failed to retrieve updated post');
    }

    console.log('✅ Authenticated functionality test completed!');
  });

  test('Test New Post Page with Simulated Authentication', async () => {
    console.log('📝 Testing new post page with simulated authentication...');

    // Step 1: Navigate to new post page
    console.log('1. Navigating to new post page...');
    await page.goto('https://dev.np-topvitaminsupply.com/new-post');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // Wait longer for components to load

    // Take screenshot of new post page
    await page.screenshot({ 
      path: `${screenshotDir}/05-new-post-page.png`,
      fullPage: true 
    });
    console.log('📸 Screenshot saved: 05-new-post-page.png');

    // Step 2: Check for editor elements
    console.log('2. Checking for editor elements...');
    
    // Wait for components to load
    await page.waitForTimeout(3000);
    
    // Check for WysimarkEditor
    const wysimarkEditor = page.locator('.wysimark-editor, [class*="wysimark"], [class*="Wysimark"]').first();
    if (await wysimarkEditor.isVisible()) {
      console.log('✅ WysimarkEditor found on new post page');
    } else {
      console.log('❌ WysimarkEditor not found on new post page');
    }

    // Check for title field
    const titleField = page.locator('input[placeholder*="title"], input[placeholder*="Title"], input[name="title"]').first();
    if (await titleField.isVisible()) {
      console.log('✅ Title field found on new post page');
    } else {
      console.log('❌ Title field not found on new post page');
    }

    // Check for content field
    const contentField = page.locator('[contenteditable], textarea, [class*="editor"]').first();
    if (await contentField.isVisible()) {
      console.log('✅ Content field found on new post page');
    } else {
      console.log('❌ Content field not found on new post page');
    }

    // Check for status dropdown
    const statusDropdown = page.locator('[data-radix-select-trigger], select, [role="combobox"]').first();
    if (await statusDropdown.isVisible()) {
      console.log('✅ Status dropdown found on new post page');
    } else {
      console.log('❌ Status dropdown not found on new post page');
    }

    // Check for save button
    const saveButton = page.locator('button:has-text("Save"), button[type="submit"]').first();
    if (await saveButton.isVisible()) {
      console.log('✅ Save button found on new post page');
    } else {
      console.log('❌ Save button not found on new post page');
    }

    console.log('✅ New post page test completed!');
  });

  test('Test Dashboard with Simulated Authentication', async () => {
    console.log('📊 Testing dashboard with simulated authentication...');

    // Step 1: Navigate to dashboard
    console.log('1. Navigating to dashboard...');
    await page.goto('https://dev.np-topvitaminsupply.com/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // Wait longer for components to load

    // Take screenshot of dashboard
    await page.screenshot({ 
      path: `${screenshotDir}/06-dashboard-page.png`,
      fullPage: true 
    });
    console.log('📸 Screenshot saved: 06-dashboard-page.png');

    // Step 2: Check for dashboard elements
    console.log('2. Checking for dashboard elements...');
    
    // Wait for components to load
    await page.waitForTimeout(3000);
    
    // Check for posts list
    const postsList = page.locator('[class*="post"], [class*="Post"], article').first();
    if (await postsList.isVisible()) {
      console.log('✅ Posts list found on dashboard');
    } else {
      console.log('❌ Posts list not found on dashboard');
    }

    // Check for new post button
    const newPostButton = page.locator('button:has-text("New Post"), a:has-text("New Post")').first();
    if (await newPostButton.isVisible()) {
      console.log('✅ New Post button found on dashboard');
    } else {
      console.log('❌ New Post button not found on dashboard');
    }

    // Check for navigation elements
    const navElements = page.locator('nav, [role="navigation"]').count();
    console.log(`Navigation elements found: ${navElements}`);

    console.log('✅ Dashboard test completed!');
  });
});
