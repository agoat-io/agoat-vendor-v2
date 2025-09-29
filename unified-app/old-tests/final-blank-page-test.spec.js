import { test, expect } from '@playwright/test';

test.describe('Final Blank Page Test', () => {
  test('should load home page with all content', async ({ page }) => {
    // Enable console logging to catch errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`[ERROR] ${msg.text()}`);
      }
    });

    page.on('pageerror', error => {
      console.log('Page error:', error.message);
    });

    // Navigate to the home page
    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // Wait for the page to load
    await page.waitForTimeout(3000);

    // Check if page has substantial content
    const bodyText = await page.textContent('body');
    console.log('Body text length:', bodyText ? bodyText.length : 0);

    // Check for React root element content
    const reactRoot = await page.locator('#root');
    const rootContent = await reactRoot.textContent();
    console.log('React root content length:', rootContent ? rootContent.length : 0);

    // Check for specific elements that should be present
    const header = await page.locator('header, [role="banner"]').count();
    const main = await page.locator('main, [role="main"]').count();
    const heading = await page.locator('h1, h2, h3').count();
    const buttons = await page.locator('button').count();
    const links = await page.locator('a').count();

    console.log('Header elements:', header);
    console.log('Main elements:', main);
    console.log('Heading elements:', heading);
    console.log('Button elements:', buttons);
    console.log('Link elements:', links);

    // Check for specific content that should be present
    const hasTopVitaminSupplies = await page.locator('text=topvitaminsupplies.com').count();
    const hasThorneContent = await page.locator('text=Thorne').count();
    const hasRegisterButton = await page.locator('text=Register').count();

    console.log('Has topvitaminsupplies.com text:', hasTopVitaminSupplies);
    console.log('Has Thorne content:', hasThorneContent);
    console.log('Has Register button:', hasRegisterButton);

    // Take a screenshot
    await page.screenshot({ path: 'final-blank-page-test.png', fullPage: true });

    // Assertions - the page should have substantial content
    expect(rootContent ? rootContent.length : 0).toBeGreaterThan(500);
    expect(heading).toBeGreaterThan(0);
    expect(buttons).toBeGreaterThan(0);
    expect(links).toBeGreaterThan(0);
    expect(hasTopVitaminSupplies).toBeGreaterThan(0);
  });

  test('should load login page', async ({ page }) => {
    await page.goto('http://localhost:3000/login', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    await page.waitForTimeout(2000);

    // Check for login page content
    const hasMicrosoftLogin = await page.locator('text=Sign in with Microsoft').count();
    const hasWelcomeText = await page.locator('text=Welcome Back').count();

    console.log('Has Microsoft login button:', hasMicrosoftLogin);
    console.log('Has Welcome Back text:', hasWelcomeText);

    expect(hasMicrosoftLogin).toBeGreaterThan(0);
    expect(hasWelcomeText).toBeGreaterThan(0);
  });

  test('should load Thorne education page', async ({ page }) => {
    await page.goto('http://localhost:3000/thorne/education', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    await page.waitForTimeout(2000);

    // Check for Thorne education content
    const hasThorneEducation = await page.locator('text=Science-Driven').count();
    const hasCategories = await page.locator('text=Immune Support').count();

    console.log('Has Science-Driven text:', hasThorneEducation);
    console.log('Has Immune Support category:', hasCategories);

    expect(hasThorneEducation).toBeGreaterThan(0);
    expect(hasCategories).toBeGreaterThan(0);
  });
});
