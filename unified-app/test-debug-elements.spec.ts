import { test, expect, Page } from '@playwright/test';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

test.describe('Debug Element Visibility', () => {
  let page: Page;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const screenshotDir = `/projects/03-project-management-common/agoat-publisher-e2e-images/${timestamp}-debug-elements`;

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

  test('Debug New Post Page Elements', async () => {
    console.log('🔍 Debugging new post page elements...');

    // Navigate to new post page first
    await page.goto('/new-post');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: join(screenshotDir, '01-new-post-page.png') });

    // Debug: Get all elements with various selectors
    console.log('🔍 Debugging element visibility...');

    // Check for title input
    const titleInputs = await page.locator('input[placeholder*="title"], input[placeholder*="Title"]').count();
    console.log('Title inputs found:', titleInputs);

    // Check for Wysimark editor
    const wysimarkEditors = await page.locator('.wysimark-editor, .wysimark-editable, [class*="wysimark"]').count();
    console.log('Wysimark editor elements found:', wysimarkEditors);

    // Check for Editable component
    const editableElements = await page.locator('[data-wysimark], [class*="editable"], [class*="editor"]').count();
    console.log('Editable elements found:', editableElements);

    // Check for Select components
    const selectElements = await page.locator('[role="combobox"], [aria-haspopup="listbox"], [data-radix-select-trigger]').count();
    console.log('Select elements found:', selectElements);

    // Check for Save buttons
    const saveButtons = await page.locator('button:has-text("Save"), button[type="submit"]').count();
    console.log('Save buttons found:', saveButtons);

    // Get all button elements
    const allButtons = await page.locator('button').count();
    console.log('Total buttons found:', allButtons);

    // Get all input elements
    const allInputs = await page.locator('input').count();
    console.log('Total inputs found:', allInputs);

    // Get all div elements with classes
    const allDivs = await page.locator('div[class]').count();
    console.log('Total divs with classes found:', allDivs);

    // Debug: Get the actual HTML structure
    const pageContent = await page.content();
    console.log('Page content length:', pageContent.length);

    // Look for specific text content
    const hasWysimarkText = pageContent.includes('wysimark');
    const hasEditableText = pageContent.includes('editable');
    const hasSelectText = pageContent.includes('select');
    console.log('Contains wysimark text:', hasWysimarkText);
    console.log('Contains editable text:', hasEditableText);
    console.log('Contains select text:', hasSelectText);

    // Try to find elements by text content
    const statusText = await page.locator('text=Status').count();
    console.log('Elements with "Status" text:', statusText);

    const draftText = await page.locator('text=Draft').count();
    console.log('Elements with "Draft" text:', draftText);

    const saveText = await page.locator('text=Save').count();
    console.log('Elements with "Save" text:', saveText);

    // Check for any error messages
    const errorElements = await page.locator('[class*="error"], [class*="Error"], [role="alert"]').count();
    console.log('Error elements found:', errorElements);

    // Get all visible text on the page
    const visibleText = await page.locator('body').textContent();
    console.log('Visible text length:', visibleText?.length || 0);
    console.log('First 500 characters of visible text:', visibleText?.substring(0, 500));

    // Try to interact with elements that might be present
    try {
      // Try to find and click any button
      const anyButton = page.locator('button').first();
      if (await anyButton.isVisible()) {
        console.log('Found at least one visible button');
        const buttonText = await anyButton.textContent();
        console.log('First button text:', buttonText);
      }
    } catch (error) {
      console.log('Error interacting with buttons:', error);
    }

    // Check if the page is actually loading the React app
    const reactRoot = await page.locator('#root, [data-reactroot]').count();
    console.log('React root elements found:', reactRoot);

    // Check for any loading indicators
    const loadingElements = await page.locator('[class*="loading"], [class*="spinner"], [class*="Loading"]').count();
    console.log('Loading elements found:', loadingElements);

    console.log('✅ Debug completed!');
  });
});
