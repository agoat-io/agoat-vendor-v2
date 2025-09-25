import { test, expect } from '@playwright/test';

test.describe('Debug Post Access', () => {
  test('should debug post access issue', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    
    await page.goto('http://localhost:3000');
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Check if posts are loaded
    const postsSection = page.locator('text=Latest Posts');
    await expect(postsSection).toBeVisible();
    
    // Check for post links
    const postLinks = page.locator('a[href*="/post/"]');
    const postCount = await postLinks.count();
    console.log('Post count:', postCount);
    
    if (postCount > 0) {
      // Get the first post link
      const firstPostLink = postLinks.first();
      const postHref = await firstPostLink.getAttribute('href');
      console.log('First post href:', postHref);
      
      // Click on the first post
      await firstPostLink.click();
      
      // Wait for navigation
      await page.waitForTimeout(3000);
      
      // Check what's displayed
      const pageContent = await page.textContent('body');
      console.log('Page content:', pageContent.substring(0, 500));
      
      // Check for errors
      const errorElement = page.locator('text=Error');
      const errorCount = await errorElement.count();
      console.log('Error count:', errorCount);
      
      if (errorCount > 0) {
        const errorText = await errorElement.textContent();
        console.log('Error text:', errorText);
      }
      
      // Check the current URL
      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);
      
      // Check if we're on the post page
      const isPostPage = currentUrl.includes('/post/');
      console.log('Is post page:', isPostPage);
      
      // Check for loading state
      const loadingElement = page.locator('text=Loading post...');
      const loadingCount = await loadingElement.count();
      console.log('Loading count:', loadingCount);
    } else {
      console.log('No posts found');
    }
  });
});
