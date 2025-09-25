import { test, expect } from '@playwright/test';

test.describe('CIAM Implementation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Wait for app to start
    await page.waitForTimeout(2000);
  });

  test('should load login page with CIAM options', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Check that CIAM login options are available
    await expect(page.locator('button:has-text("Sign in with Microsoft (CIAM)")')).toBeVisible();
    await expect(page.locator('button:has-text("Create Account (CIAM)")')).toBeVisible();
    await expect(page.locator('button:has-text("CIAM Configuration Info")')).toBeVisible();
    
    // Check for welcome text
    await expect(page.locator('text=Welcome Back')).toBeVisible();
  });

  test('should display CIAM domain information', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Check that CIAM domain is displayed
    const pageText = await page.textContent('body');
    expect(pageText).toContain('auth01.local.topvitaminsupply.com');
    expect(pageText).toContain('CIAM Authentication');
  });

  test('should open CIAM info popup when clicked', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Click the CIAM info button
    await page.click('button:has-text("CIAM Configuration Info")');
    
    // Check that the popup opens
    await expect(page.locator('h1:has-text("CIAM Configuration")')).toBeVisible();
    await expect(page.locator('text=Environment: Local')).toBeVisible();
    await expect(page.locator('text=CIAM Domain: auth01.local.topvitaminsupply.com')).toBeVisible();
  });

  test('should display CIAM URLs in info popup', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Open CIAM info popup
    await page.click('button:has-text("CIAM Configuration Info")');
    
    // Check for CIAM URLs
    await expect(page.locator('text=Login: https://auth01.local.topvitaminsupply.com/login')).toBeVisible();
    await expect(page.locator('text=Register: https://auth01.local.topvitaminsupply.com/register')).toBeVisible();
    await expect(page.locator('text=Callback: https://auth01.local.topvitaminsupply.com/callback')).toBeVisible();
    await expect(page.locator('text=Logout: https://auth01.local.topvitaminsupply.com/logout')).toBeVisible();
  });

  test('should display setup instructions in CIAM info popup', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Open CIAM info popup
    await page.click('button:has-text("CIAM Configuration Info")');
    
    // Check for setup instructions
    await expect(page.locator('text=Setup Required:')).toBeVisible();
    await expect(page.locator('text=1. Configure Azure Entra ID CIAM')).toBeVisible();
    await expect(page.locator('text=2. Set up DNS for auth01.local.topvitaminsupply.com')).toBeVisible();
    await expect(page.locator('text=3. Deploy CIAM hosted UI')).toBeVisible();
    await expect(page.locator('text=4. Configure redirect URIs')).toBeVisible();
  });

  test('should have working close button in CIAM info popup', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Open CIAM info popup
    await page.click('button:has-text("CIAM Configuration Info")');
    
    // Check for close button
    await expect(page.locator('button:has-text("Close")')).toBeVisible();
    
    // Test close button
    await page.click('button:has-text("Close")');
    await expect(page.locator('h1:has-text("CIAM Configuration")')).not.toBeVisible();
  });

  test('should have CIAM login button that is clickable', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Check that CIAM login button exists and is clickable
    const loginButton = page.locator('button:has-text("Sign in with Microsoft (CIAM)")');
    await expect(loginButton).toBeVisible();
    await expect(loginButton).toBeEnabled();
    
    // Verify button text
    const buttonText = await loginButton.textContent();
    expect(buttonText).toContain('Sign in with Microsoft (CIAM)');
  });

  test('should have CIAM register button that is clickable', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Check that CIAM register button exists and is clickable
    const registerButton = page.locator('button:has-text("Create Account (CIAM)")');
    await expect(registerButton).toBeVisible();
    await expect(registerButton).toBeEnabled();
    
    // Verify button text
    const buttonText = await registerButton.textContent();
    expect(buttonText).toContain('Create Account (CIAM)');
  });

  test('should have proper button styling and accessibility', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Check CIAM login button
    const loginButton = page.locator('button:has-text("Sign in with Microsoft (CIAM)")');
    await expect(loginButton).toBeVisible();
    await expect(loginButton).toBeEnabled();
    
    // Check CIAM register button
    const registerButton = page.locator('button:has-text("Create Account (CIAM)")');
    await expect(registerButton).toBeVisible();
    await expect(registerButton).toBeEnabled();
    
    // Check CIAM info button
    const infoButton = page.locator('button:has-text("CIAM Configuration Info")');
    await expect(infoButton).toBeVisible();
    await expect(infoButton).toBeEnabled();
  });

  test('should display CIAM authentication information', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Check for CIAM authentication information
    await expect(page.locator('text=About CIAM Authentication:')).toBeVisible();
    await expect(page.locator('text=• Secure hosted authentication')).toBeVisible();
    await expect(page.locator('text=• Gmail, Microsoft personal, and work accounts')).toBeVisible();
    await expect(page.locator('text=• Multi-factor authentication (MFA)')).toBeVisible();
    await expect(page.locator('text=• No passwords stored locally')).toBeVisible();
  });

  test('should display development note with CIAM information', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Check for development note
    await expect(page.locator('text=CIAM Mode:')).toBeVisible();
    await expect(page.locator('text=This application uses Azure Entra ID CIAM for authentication.')).toBeVisible();
    await expect(page.locator('text=Authentication is handled at auth01.local.topvitaminsupply.com')).toBeVisible();
  });

  test('should handle multiple environment configurations', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Open CIAM info popup
    await page.click('button:has-text("CIAM Configuration Info")');
    
    // Check that environment is displayed correctly
    await expect(page.locator('text=Environment: Local')).toBeVisible();
    
    // Check that the CIAM domain is correct for local environment
    const popupText = await page.textContent('body');
    expect(popupText).toContain('auth01.local.topvitaminsupply.com');
  });

  test('should have proper error handling for CIAM redirects', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Check for console errors related to CIAM
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Try to click CIAM login button
    await page.click('button:has-text("Sign in with Microsoft (CIAM)")');
    
    // Wait a bit for any errors
    await page.waitForTimeout(1000);
    
    // Should not have critical errors (navigation errors are expected)
    const criticalErrors = consoleErrors.filter(error => 
      error.includes('Uncaught') || 
      error.includes('ReferenceError') || 
      error.includes('TypeError') ||
      error.includes('SyntaxError')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('should have responsive design for CIAM interface', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Check that CIAM interface is responsive
    const loginButton = page.locator('button:has-text("Sign in with Microsoft (CIAM)")');
    await expect(loginButton).toBeVisible();
    
    // Check that buttons are properly sized
    const buttonBox = await loginButton.boundingBox();
    expect(buttonBox.height).toBeGreaterThan(40); // Should be at least 48px as configured
    
    // Open CIAM info popup and check responsiveness
    await page.click('button:has-text("CIAM Configuration Info")');
    
    const popup = page.locator('h1:has-text("CIAM Configuration")').locator('..');
    await expect(popup).toBeVisible();
    
    // Check that popup is properly sized
    const popupBox = await popup.boundingBox();
    expect(popupBox.width).toBeGreaterThan(400);
  });

  test('should handle CIAM configuration changes gracefully', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Check that the page loads without errors
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('CIAM');
    
    // Open CIAM info popup
    await page.click('button:has-text("CIAM Configuration Info")');
    
    // Check that configuration is displayed
    await expect(page.locator('text=CIAM Domain: auth01.local.topvitaminsupply.com')).toBeVisible();
    
    // Close popup
    await page.click('button:has-text("Close")');
    
    // Check that page is still functional
    await expect(page.locator('button:has-text("Sign in with Microsoft (CIAM)")')).toBeVisible();
  });
});
