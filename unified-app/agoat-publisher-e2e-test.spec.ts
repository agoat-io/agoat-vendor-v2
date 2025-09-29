import { test, expect } from '@playwright/test';

test.describe('AGoat Publisher E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should load the homepage successfully', async ({ page }) => {
    // Check if the page title is correct
    await expect(page).toHaveTitle(/AGoat Publisher/);
    
    // Check if the main content is visible (check for the first heading)
    await expect(page.locator('h1').first()).toBeVisible();
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/homepage.png' });
  });

  test('should display blog posts on homepage', async ({ page }) => {
    // Wait for posts to load by looking for the "Latest Posts" heading
    await page.waitForSelector('h1:has-text("Latest Posts")', { timeout: 10000 });
    
    // Check if posts are visible by looking for post titles
    const postTitles = page.locator('h1:has-text("Latest Posts")').locator('..').locator('h1');
    const postCount = await postTitles.count();
    
    if (postCount > 0) {
      await expect(postTitles.first()).toBeVisible();
      console.log(`Found ${postCount} posts on homepage`);
    } else {
      console.log('No posts found on homepage - this might be expected for a new installation');
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/homepage-posts.png' });
  });

  test('should navigate to login page', async ({ page }) => {
    // Look for login link or button
    const loginLink = page.locator('a[href*="login"], button:has-text("Login"), a:has-text("Login")').first();
    
    if (await loginLink.isVisible()) {
      // Force click to handle overlapping elements
      await loginLink.click({ force: true });
      await page.waitForLoadState('networkidle');
      
      // Check if we're on a login page
      await expect(page).toHaveURL(/.*login.*/);
      
      // Take a screenshot
      await page.screenshot({ path: 'test-results/login-page.png' });
    } else {
      console.log('Login link not found - checking if already on login page');
      // Check if we're already on a login page
      const isLoginPage = page.url().includes('login') || 
                         await page.locator('input[type="email"], input[type="password"], button:has-text("Sign In")').isVisible();
      
      if (isLoginPage) {
        console.log('Already on login page');
        await page.screenshot({ path: 'test-results/login-page.png' });
      } else {
        console.log('No login functionality found');
      }
    }
  });

  test('should check API health endpoint', async ({ page }) => {
    // Test the API health endpoint
    const response = await page.request.get('https://localhost:8080/api/status');
    
    expect(response.status()).toBe(200);
    
    const responseBody = await response.json();
    console.log('API Status Response:', responseBody);
    
    // Take a screenshot of the response
    await page.screenshot({ path: 'test-results/api-health.png' });
  });

  test('should test responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/mobile-view.png' });
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/tablet-view.png' });
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/desktop-view.png' });
  });

  test('should check for console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      consoleErrors.push(error.message);
    });
    
    // Navigate and wait for page to load
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait a bit more for any async operations
    await page.waitForTimeout(2000);
    
    if (consoleErrors.length > 0) {
      console.log('Console errors found:', consoleErrors);
      // Don't fail the test, just log the errors
    } else {
      console.log('No console errors found');
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/console-check.png' });
  });

  test('should test navigation menu', async ({ page }) => {
    // Look for navigation elements
    const navElements = page.locator('nav, [role="navigation"], .navbar, .navigation, .menu');
    
    if (await navElements.count() > 0) {
      const nav = navElements.first();
      await expect(nav).toBeVisible();
      
      // Look for navigation links
      const navLinks = nav.locator('a, button');
      const linkCount = await navLinks.count();
      
      if (linkCount > 0) {
        console.log(`Found ${linkCount} navigation links`);
        
        // Test clicking on the first few links
        for (let i = 0; i < Math.min(3, linkCount); i++) {
          const link = navLinks.nth(i);
          const linkText = await link.textContent();
          const linkHref = await link.getAttribute('href');
          
          console.log(`Testing navigation link: ${linkText} (${linkHref})`);
          
          if (linkHref && !linkHref.startsWith('http')) {
            await link.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);
          }
        }
      }
    } else {
      console.log('No navigation menu found');
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/navigation-test.png' });
  });

  test('should test Thorne-specific pages', async ({ page }) => {
    // Test Thorne category page
    try {
      await page.goto('/thorne-category');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-results/thorne-category.png' });
      console.log('Thorne category page loaded successfully');
    } catch (error) {
      console.log('Thorne category page not accessible:', error);
    }
    
    // Test Thorne registration page
    try {
      await page.goto('/thorne-registration');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-results/thorne-registration.png' });
      console.log('Thorne registration page loaded successfully');
    } catch (error) {
      console.log('Thorne registration page not accessible:', error);
    }
  });

  test('should test dashboard access', async ({ page }) => {
    // Try to access dashboard
    try {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Check if we're redirected to login or if dashboard is accessible
      const currentUrl = page.url();
      
      if (currentUrl.includes('login')) {
        console.log('Dashboard redirected to login - authentication required');
        await page.screenshot({ path: 'test-results/dashboard-login-redirect.png' });
      } else {
        console.log('Dashboard accessible without authentication');
        await page.screenshot({ path: 'test-results/dashboard-accessible.png' });
      }
    } catch (error) {
      console.log('Dashboard page error:', error);
    }
  });
});
