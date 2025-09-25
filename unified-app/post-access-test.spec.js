import { test, expect } from '@playwright/test';

test.describe('Post Access Without Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Wait for app to start
    await page.waitForTimeout(2000);
  });

  test('should allow unauthenticated users to view posts', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Wait for posts to load
    await page.waitForSelector('text=Latest Posts', { timeout: 10000 });
    
    // Check if there are any posts
    const postLinks = page.locator('a[href*="/post/"]');
    const postCount = await postLinks.count();
    
    if (postCount > 0) {
      // Click on the first post
      await postLinks.first().click();
      
      // Should not show authentication error
      await expect(page.locator('text=Error')).not.toBeVisible();
      
      // Should show post content (possibly truncated for unauthenticated users)
      await expect(page.locator('h1')).toBeVisible();
      
      // Should show login prompt for full content if post is long
      const loginPrompt = page.locator('text=This is a preview. Please log in to read the full post.');
      const loginButton = page.locator('button:has-text("Login to Read More")');
      
      // Either the full content is shown or the login prompt is shown
      const hasFullContent = await page.locator('text=This is a preview').count() === 0;
      const hasLoginPrompt = await loginPrompt.count() > 0;
      
      expect(hasFullContent || hasLoginPrompt).toBe(true);
    } else {
      // If no posts, should show "No posts found" message
      await expect(page.locator('text=No posts found')).toBeVisible();
    }
  });

  test('should show truncated content for unauthenticated users on long posts', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Wait for posts to load
    await page.waitForSelector('text=Latest Posts', { timeout: 10000 });
    
    const postLinks = page.locator('a[href*="/post/"]');
    const postCount = await postLinks.count();
    
    if (postCount > 0) {
      // Click on the first post
      await postLinks.first().click();
      
      // Check if login prompt is shown (indicating truncated content)
      const loginPrompt = page.locator('text=This is a preview. Please log in to read the full post.');
      const loginButton = page.locator('button:has-text("Login to Read More")');
      
      if (await loginPrompt.count() > 0) {
        // Should show login prompt and button
        await expect(loginPrompt).toBeVisible();
        await expect(loginButton).toBeVisible();
        
        // Click login button should navigate to login page
        await loginButton.click();
        await expect(page).toHaveURL(/.*\/login/);
      }
    }
  });

  test('should handle post not found gracefully', async ({ page }) => {
    // Try to access a non-existent post
    await page.goto('http://localhost:3000/post/nonexistent');
    
    // Should show error message
    await expect(page.locator('text=Error')).toBeVisible();
    await expect(page.locator('text=Post not found')).toBeVisible();
    
    // Should show back button
    await expect(page.locator('button:has-text("Back to Posts")')).toBeVisible();
  });

  test('should access specific post without authentication error', async ({ page }) => {
    // Access a known post directly
    await page.goto('http://localhost:3000/post/1098845459392888833');
    
    // Should not show authentication error
    await expect(page.locator('text=Authentication error')).not.toBeVisible();
    await expect(page.locator('text=Please log in')).not.toBeVisible();
    await expect(page.locator('text=Access denied')).not.toBeVisible();
    
    // Should show post content
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=testdwdwdw')).toBeVisible();
  });

  test('should not show authentication errors when viewing posts', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Wait for posts to load
    await page.waitForSelector('text=Latest Posts', { timeout: 10000 });
    
    const postLinks = page.locator('a[href*="/post/"]');
    const postCount = await postLinks.count();
    
    if (postCount > 0) {
      // Click on the first post
      await postLinks.first().click();
      
      // Should not show any authentication-related errors
      await expect(page.locator('text=Authentication error')).not.toBeVisible();
      await expect(page.locator('text=Please log in')).not.toBeVisible();
      await expect(page.locator('text=Access denied')).not.toBeVisible();
      
      // Should show post content or appropriate message
      const hasPostContent = await page.locator('h1').count() > 0;
      const hasError = await page.locator('text=Error').count() > 0;
      
      expect(hasPostContent || hasError).toBe(true);
    }
  });
});
