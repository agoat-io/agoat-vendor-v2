import { test, expect } from '@playwright/test';

test.describe('Azure Entra ID Hosted UI Implementation', () => {
  test.beforeEach(async ({ page }) => {
    // Wait for app to start
    await page.waitForTimeout(2000);
  });

  test('should load login page with hosted UI options', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Check that both login options are available
    await expect(page.locator('button:has-text("Sign in with Microsoft (MSAL)")')).toBeVisible();
    await expect(page.locator('button:has-text("Sign in with Microsoft (Hosted UI)")')).toBeVisible();
    
    // Check for welcome text
    await expect(page.locator('text=Welcome Back')).toBeVisible();
  });

  test('should open hosted UI popup when clicked', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Click the hosted UI button
    await page.click('button:has-text("Sign in with Microsoft (Hosted UI)")');
    
    // Check that the popup opens
    await expect(page.locator('text=Azure Entra ID Hosted UI')).toBeVisible();
    await expect(page.locator('text=Environment Configuration')).toBeVisible();
  });

  test('should display environment configuration in hosted UI popup', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Open hosted UI popup
    await page.click('button:has-text("Sign in with Microsoft (Hosted UI)")');
    
    // Check for environment info
    await expect(page.locator('text=Environment Configuration')).toBeVisible();
    await expect(page.locator('.rt-Badge:has-text("local")')).toBeVisible();
    
    // Check that hosted UI domain is present in the page
    const pageText = await page.textContent('body');
    expect(pageText).toContain('auto.local.topvitaminsupply.com');
  });

  test('should display Entra ID authorization URL in hosted UI popup', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Open hosted UI popup
    await page.click('button:has-text("Sign in with Microsoft (Hosted UI)")');
    
    // Check for Entra ID URL
    await expect(page.locator('text=Entra ID Authorization URL')).toBeVisible();
    
    // Check that the URL contains expected parameters
    const urlText = await page.locator('code').textContent();
    expect(urlText).toContain('login.microsoftonline.com/common/v2.0/authorize');
    expect(urlText).toContain('client_id=');
    expect(urlText).toContain('response_type=code');
    expect(urlText).toContain('redirect_uri=');
    expect(urlText).toContain('scope=openid+profile+email+User.Read');
  });

  test('should display configuration details in hosted UI popup', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Open hosted UI popup
    await page.click('button:has-text("Sign in with Microsoft (Hosted UI)")');
    
    // Check for configuration details
    await expect(page.locator('text=Configuration Details')).toBeVisible();
    await expect(page.locator('text=Client ID:')).toBeVisible();
    await expect(page.locator('text=Redirect URI:')).toBeVisible();
    await expect(page.locator('text=Scope:')).toBeVisible();
    await expect(page.locator('text=Response Type:')).toBeVisible();
    await expect(page.locator('text=Authority:')).toBeVisible();
  });

  test('should display setup instructions in hosted UI popup', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Open hosted UI popup
    await page.click('button:has-text("Sign in with Microsoft (Hosted UI)")');
    
    // Check for setup instructions
    await expect(page.locator('text=Setup Instructions')).toBeVisible();
    await expect(page.locator('text=Configure Azure Entra ID')).toBeVisible();
    await expect(page.locator('text=Set up DNS')).toBeVisible();
    await expect(page.locator('text=Deploy the hosted UI')).toBeVisible();
  });

  test('should have working copy and open buttons in hosted UI popup', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Open hosted UI popup
    await page.click('button:has-text("Sign in with Microsoft (Hosted UI)")');
    
    // Check for action buttons
    await expect(page.locator('button:has-text("Copy URL")')).toBeVisible();
    await expect(page.locator('button:has-text("Open in New Tab")')).toBeVisible();
    
    // Test copy button (we can't actually test clipboard, but we can test it doesn't error)
    await page.click('button:has-text("Copy URL")');
    
    // Test open in new tab button
    const [newPage] = await Promise.all([
      page.context().waitForEvent('page'),
      page.click('button:has-text("Open in New Tab")')
    ]);
    
    // Check that new page opens with Entra ID URL
    const newPageUrl = newPage.url();
    expect(newPageUrl).toContain('login.microsoftonline.com');
    
    await newPage.close();
  });

  test('should have working close and simulate login buttons', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Open hosted UI popup
    await page.click('button:has-text("Sign in with Microsoft (Hosted UI)")');
    
    // Check for action buttons
    await expect(page.locator('button:has-text("Close")')).toBeVisible();
    await expect(page.locator('button:has-text("Simulate Login")')).toBeVisible();
    
    // Test close button
    await page.click('button:has-text("Close")');
    await expect(page.locator('text=Azure Entra ID Hosted UI')).not.toBeVisible();
    
    // Reopen popup
    await page.click('button:has-text("Sign in with Microsoft (Hosted UI)")');
    
    // Test simulate login button
    await page.click('button:has-text("Simulate Login")');
    await expect(page.locator('text=Azure Entra ID Hosted UI')).not.toBeVisible();
  });

  test('should handle multiple environment configurations', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Open hosted UI popup
    await page.click('button:has-text("Sign in with Microsoft (Hosted UI)")');
    
    // Check that environment is displayed
    const environmentBadge = page.locator('.rt-Badge:has-text("local")');
    await expect(environmentBadge).toBeVisible();
    
    // Check that the hosted UI domain is correct for local environment
    const hostedUiText = await page.textContent('body');
    expect(hostedUiText).toContain('auto.local.topvitaminsupply.com');
  });

  test('should have proper error handling for missing configuration', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Open hosted UI popup
    await page.click('button:has-text("Sign in with Microsoft (Hosted UI)")');
    
    // Check that it handles missing client ID gracefully
    const clientIdText = await page.textContent('body');
    expect(clientIdText).toContain('Client ID:');
    
    // Should not crash or show errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(1000);
    
    // Should not have critical errors
    const criticalErrors = consoleErrors.filter(error => 
      error.includes('Uncaught') || 
      error.includes('ReferenceError') || 
      error.includes('TypeError')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('should have responsive design for hosted UI popup', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Open hosted UI popup
    await page.click('button:has-text("Sign in with Microsoft (Hosted UI)")');
    
    // Check that popup is visible and properly sized
    const popup = page.locator('[role="dialog"]');
    await expect(popup).toBeVisible();
    
    // Check that content is scrollable if needed
    const codeBlock = page.locator('code');
    await expect(codeBlock).toBeVisible();
    
    // Check that buttons are accessible
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(3); // Should have multiple buttons
  });
});
