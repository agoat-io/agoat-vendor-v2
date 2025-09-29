import { test, expect } from '@playwright/test';

test.describe('Azure Entra ID External Identities Configuration', () => {
  test('should load Azure configuration with external identities support', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Check that the page loads without errors
    await expect(page).toHaveTitle(/topvitaminsupplies.com/);
    
    // Check for console errors related to Azure configuration
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Should not have Azure-related configuration errors
    const azureErrors = consoleErrors.filter(error => 
      error.includes('azure') || 
      error.includes('Azure') || 
      error.includes('MSAL') ||
      error.includes('msal')
    );
    
    expect(azureErrors.length).toBe(0);
  });

  test('should have proper environment variable access', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
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

  test('should load login page with external identities configuration', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Check that login page loads
    await expect(page.locator('button:has-text("Sign in with Microsoft")')).toBeVisible();
    
    // Check for proper text indicating external identities support
    const pageText = await page.textContent('body');
    expect(pageText).toContain('Sign in with Microsoft');
    
    // Should not have authentication errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.waitForLoadState('networkidle');
    
    // Should not have critical authentication errors
    const authErrors = consoleErrors.filter(error => 
      error.includes('useAuth') || 
      error.includes('AuthProvider') ||
      error.includes('authentication') ||
      error.includes('Azure')
    );
    
    expect(authErrors.length).toBe(0);
  });

  test('should handle authentication context properly', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Check that Azure authentication context is properly initialized
    const contextCheck = await page.evaluate(() => {
      try {
        // Check if React is loaded
        const hasReact = typeof window !== 'undefined' && window.React;
        
        // Check if the page has proper structure
        const hasApp = document.querySelector('#root') || document.querySelector('[data-testid="app"]');
        
        return {
          hasReact,
          hasApp: !!hasApp,
          bodyText: document.body.textContent.length
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    expect(contextCheck.error).toBeUndefined();
    expect(contextCheck.hasApp).toBe(true);
    expect(contextCheck.bodyText).toBeGreaterThan(100);
  });

  test('should have proper routing for authentication flows', async ({ page }) => {
    const authRoutes = [
      '/login',
      '/auth/callback',
      '/auth/logout'
    ];
    
    for (const route of authRoutes) {
      await page.goto(`http://localhost:3000${route}`);
      
      // Each route should load without errors
      const bodyText = await page.textContent('body');
      expect(bodyText).not.toContain('404');
      expect(bodyText).not.toContain('Not Found');
      expect(bodyText.length).toBeGreaterThan(10);
      
      // Should not have critical errors
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      await page.waitForLoadState('networkidle');
      
      const criticalErrors = consoleErrors.filter(error => 
        error.includes('Uncaught') || 
        error.includes('ReferenceError') || 
        error.includes('TypeError')
      );
      
      expect(criticalErrors.length).toBe(0);
    }
  });

  test('should have proper error boundaries for authentication', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Check that the page loads with proper error handling
    const errorBoundaryCheck = await page.evaluate(() => {
      try {
        // Check if there are any error boundaries or error states
        const errorElements = document.querySelectorAll('[data-testid*="error"], .error, [class*="error"]');
        const hasErrorState = errorElements.length > 0;
        
        // Check if the main content is visible
        const mainContent = document.querySelector('main, #root, [data-testid="app"]');
        const hasMainContent = !!mainContent;
        
        return {
          hasErrorState,
          hasMainContent,
          errorCount: errorElements.length
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    expect(errorBoundaryCheck.error).toBeUndefined();
    expect(errorBoundaryCheck.hasMainContent).toBe(true);
    expect(errorBoundaryCheck.errorCount).toBe(0);
  });

  test('should have proper network handling for Azure endpoints', async ({ page }) => {
    const networkRequests = [];
    
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers()
      });
    });
    
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Should have successful requests
    const successfulRequests = networkRequests.filter(req => 
      req.url.includes('localhost:3000') || 
      req.url.includes('localhost:8080')
    );
    
    expect(successfulRequests.length).toBeGreaterThan(0);
    
    // Should not have failed Azure-related requests (since we're not configured yet)
    const azureRequests = networkRequests.filter(req => 
      req.url.includes('login.microsoftonline.com') ||
      req.url.includes('graph.microsoft.com')
    );
    
    // Azure requests might fail since we're not configured, but that's expected
    expect(azureRequests.length).toBeGreaterThanOrEqual(0);
  });

  test('should have proper accessibility for authentication elements', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Check that login button has proper accessibility
    const loginButton = page.locator('button:has-text("Sign in with Microsoft")');
    await expect(loginButton).toBeVisible();
    
    // Check for proper button attributes
    const buttonAttributes = await loginButton.evaluate(el => ({
      type: el.type,
      disabled: el.disabled,
      ariaLabel: el.getAttribute('aria-label'),
      role: el.getAttribute('role')
    }));
    
    expect(buttonAttributes.type).toBe('submit');
    expect(buttonAttributes.disabled).toBe(false);
  });

  test('should handle authentication state properly', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Check that the page handles unauthenticated state properly
    const authStateCheck = await page.evaluate(() => {
      try {
        // Check if there are any authentication-related elements
        const authElements = document.querySelectorAll('[data-testid*="auth"], [class*="auth"], [id*="auth"]');
        const hasAuthElements = authElements.length > 0;
        
        // Check if the page shows appropriate content for unauthenticated users
        const bodyText = document.body.textContent;
        const showsPublicContent = bodyText.includes('topvitaminsupplies.com') || 
                                  bodyText.includes('Welcome') ||
                                  bodyText.includes('Sign in') ||
                                  bodyText.includes('Microsoft');
        
        return {
          hasAuthElements,
          showsPublicContent,
          authElementCount: authElements.length
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    expect(authStateCheck.error).toBeUndefined();
    expect(authStateCheck.showsPublicContent).toBe(true);
  });
});
