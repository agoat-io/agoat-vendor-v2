import { test, expect } from '@playwright/test';

test.describe('Simple Post Access Test', () => {
  test('should access post without authentication error', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    
    // Access a known post directly
    await page.goto('http://localhost:3000/post/1098845459392888833');
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Check if we get an authentication error
    const authError = page.locator('text=Authentication error');
    const authErrorCount = await authError.count();
    
    if (authErrorCount > 0) {
      console.log('Authentication error found');
    } else {
      console.log('No authentication error found');
    }
    
    // Check what's displayed
    const pageContent = await page.textContent('body');
    console.log('Page content preview:', pageContent.substring(0, 200));
    
    // Should not show authentication error
    await expect(page.locator('text=Authentication error')).not.toBeVisible();
    await expect(page.locator('text=Please log in')).not.toBeVisible();
    await expect(page.locator('text=Access denied')).not.toBeVisible();
  });
});

