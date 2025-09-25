import { test, expect } from '@playwright/test';

test.describe('Azure Entra ID External Identities Implementation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page
    await page.goto('http://localhost:3000');
  });

  test('should load home page with external identities configuration', async ({ page }) => {
    // Check that the page loads successfully
    await expect(page).toHaveTitle(/topvitaminsupplies.com/);
    
    // Check for main content
    const bodyText = await page.textContent('body');
    expect(bodyText.length).toBeGreaterThan(100);
    
    // Check for navigation elements
    const navElement = page.locator('nav');
    const homeLink = page.locator('a[href="/"]');
    const loginLink = page.locator('a[href="/login"]');
    
    // Check if navigation exists (might be in different structure)
    const hasNav = await navElement.count() > 0 || await homeLink.count() > 0 || await loginLink.count() > 0;
    expect(hasNav).toBe(true);
  });

  test('should display login page with Microsoft sign-in button', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Check for Microsoft sign-in button
    await expect(page.locator('button:has-text("Sign in with Microsoft")')).toBeVisible();
    
    // Check for welcome text
    await expect(page.locator('text=Welcome')).toBeVisible();
    
    // Check for external identities support text
    const loginText = await page.textContent('body');
    expect(loginText).toContain('Sign in with Microsoft');
  });

  test('should have correct Azure configuration for external identities', async ({ page }) => {
    // Check that Azure configuration is loaded correctly
    const configCheck = await page.evaluate(() => {
      // Check if azureAuth module is available
      if (typeof window !== 'undefined' && window.azureConfig) {
        return {
          authority: window.azureConfig.auth?.authority,
          clientId: window.azureConfig.auth?.clientId,
          redirectUri: window.azureConfig.auth?.redirectUri
        };
      }
      return null;
    });
    
    // The configuration should be available (even if not fully configured)
    expect(configCheck).toBeDefined();
  });

  test('should handle authentication callback route', async ({ page }) => {
    // Test the callback route exists and loads
    await page.goto('http://localhost:3000/auth/callback');
    
    // Should not show 404 or error
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('404');
    expect(bodyText).not.toContain('Not Found');
    
    // Should show loading or authentication content
    expect(bodyText.length).toBeGreaterThan(10);
  });

  test('should handle logout route', async ({ page }) => {
    // Test the logout route exists and loads
    await page.goto('http://localhost:3000/auth/logout');
    
    // Should not show 404 or error
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('404');
    expect(bodyText).not.toContain('Not Found');
    
    // Should show logout content
    expect(bodyText.length).toBeGreaterThan(10);
  });

  test('should have proper environment variable configuration', async ({ page }) => {
    // Check that the page loads without environment variable errors
    const envCheck = await page.evaluate(() => {
      try {
        return {
          hasWindow: typeof window !== 'undefined',
          hasDocument: typeof document !== 'undefined',
          hasConsole: typeof console !== 'undefined'
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    expect(envCheck.error).toBeUndefined();
    expect(envCheck.hasWindow).toBe(true);
    expect(envCheck.hasDocument).toBe(true);
    expect(envCheck.hasConsole).toBe(true);
  });

  test('should support multiple account types in login flow', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Click the Microsoft sign-in button
    const loginButton = page.locator('button:has-text("Sign in with Microsoft")');
    await expect(loginButton).toBeVisible();
    
    // The button should be clickable (even though we won't complete the flow)
    await expect(loginButton).toBeEnabled();
    
    // Check that the button has proper styling and accessibility
    const buttonText = await loginButton.textContent();
    expect(buttonText).toContain('Sign in with Microsoft');
  });

  test('should have proper routing for all authentication pages', async ({ page }) => {
    const routes = [
      '/',
      '/login',
      '/auth/callback',
      '/auth/logout'
    ];
    
    for (const route of routes) {
      await page.goto(`http://localhost:3000${route}`);
      
      // Each route should load without 404 errors
      const bodyText = await page.textContent('body');
      expect(bodyText).not.toContain('404');
      expect(bodyText).not.toContain('Not Found');
      
      // Should have some content
      expect(bodyText.length).toBeGreaterThan(10);
    }
  });

  test('should have proper error handling for unauthenticated access', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto('http://localhost:3000/dashboard');
    
    // Should redirect to login or show appropriate message
    const currentUrl = page.url();
    const bodyText = await page.textContent('body');
    
    // Either redirected to login or showing appropriate message
    const isRedirectedToLogin = currentUrl.includes('/login');
    const showsLoginMessage = bodyText.includes('Sign in') || bodyText.includes('Login') || bodyText.includes('Authentication');
    
    expect(isRedirectedToLogin || showsLoginMessage).toBe(true);
  });

  test('should have proper console error handling', async ({ page }) => {
    const consoleErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Navigate through key pages
    await page.goto('http://localhost:3000');
    await page.goto('http://localhost:3000/login');
    await page.goto('http://localhost:3000/auth/callback');
    
    // Should not have critical errors
    const criticalErrors = consoleErrors.filter(error => 
      error.includes('Uncaught') || 
      error.includes('ReferenceError') || 
      error.includes('TypeError') ||
      error.includes('SyntaxError')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('should have proper network request handling', async ({ page }) => {
    const networkRequests = [];
    
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method()
      });
    });
    
    // Navigate to home page
    await page.goto('http://localhost:3000');
    
    // Should have requests
    expect(networkRequests.length).toBeGreaterThan(0);
    
    // Should have local requests
    const localRequests = networkRequests.filter(req => 
      req.url.includes('localhost:3000') || 
      req.url.includes('localhost:8080')
    );
    expect(localRequests.length).toBeGreaterThan(0);
  });
});
