import { test, expect } from '@playwright/test';

test.describe('Thorne Reseller System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page first
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('Home page loads with Thorne CTA', async ({ page }) => {
    // Check if the home page loads
    await expect(page).toHaveTitle(/AGoat Publisher/);
    
    // Check for Thorne Supplements CTA
    const thorneCTA = page.locator('text=Professional-Grade Supplements');
    await expect(thorneCTA).toBeVisible();
    
    // Check for Learn More button
    const learnMoreButton = page.locator('text=Learn More');
    await expect(learnMoreButton).toBeVisible();
  });

  test('Navigation to Thorne Education page', async ({ page }) => {
    // Click on Thorne Supplements navigation
    await page.click('text=Thorne Supplements');
    
    // Should navigate to education page
    await expect(page).toHaveURL(/.*thorne\/education/);
    await page.waitForLoadState('networkidle');
    
    // Check page title and content (skip the header H1)
    await expect(page.locator('h1').nth(1)).toContainText(/Professional Health|Science-Driven/);
  });

  test('Thorne Education page loads categories', async ({ page }) => {
    await page.goto('http://localhost:3000/thorne/education');
    await page.waitForLoadState('networkidle');
    
    // Check for category cards (using Radix UI structure)
    const categoryCards = page.locator('text=Immune Support').locator('..').first();
    await expect(categoryCards).toBeVisible();
    
    // Check for medical disclaimer
    const disclaimer = page.locator('text=Medical Disclaimer');
    await expect(disclaimer).toBeVisible();
  });

  test('Category page navigation', async ({ page }) => {
    await page.goto('http://localhost:3000/thorne/education');
    await page.waitForLoadState('networkidle');
    
    // Click on first "Learn More" button
    const learnMoreButtons = page.locator('text=Learn More');
    await learnMoreButtons.first().click();
    
    // Should navigate to a category page
    await expect(page).toHaveURL(/.*thorne\/category/);
    await page.waitForLoadState('networkidle');
    
    // Check for back navigation
    const backButton = page.locator('text=Back to Education');
    await expect(backButton).toBeVisible();
  });

  test('Patient Registration page', async ({ page }) => {
    await page.goto('http://localhost:3000/thorne/register');
    await page.waitForLoadState('networkidle');
    
    // Check for registration form (using Radix UI TextField components)
    const nameField = page.locator('.rt-TextFieldRoot[placeholder="Enter your full name"]');
    await expect(nameField).toHaveCount(1);
    
    const emailField = page.locator('.rt-TextFieldRoot[type="email"]');
    await expect(emailField).toHaveCount(1);
    
    const healthGoalsField = page.locator('textarea');
    await expect(healthGoalsField).toBeVisible();
    
    // Check for submit button
    const submitButton = page.locator('text=Submit Registration');
    await expect(submitButton).toBeVisible();
  });

  test('Compliance page loads', async ({ page }) => {
    await page.goto('http://localhost:3000/thorne/compliance');
    await page.waitForLoadState('networkidle');
    
    // Check for compliance content
    const complianceTitle = page.locator('h1').nth(1); // Second h1 should be the page title
    await expect(complianceTitle).toContainText(/Compliance|Legal/);
    
    // Check for medical disclaimer
    const disclaimer = page.locator('text=Medical Disclaimer');
    await expect(disclaimer).toBeVisible();
  });

  test('Patient Portal loads for approved patient', async ({ page }) => {
    await page.goto('http://localhost:3000/thorne/portal');
    await page.waitForLoadState('networkidle');
    
    // Should show patient portal or pending approval message
    const portalContent = page.locator('text=Welcome').or(page.locator('text=Pending Approval'));
    await expect(portalContent).toBeVisible();
  });

  test('API endpoints are accessible', async ({ page }) => {
    // Test categories API
    const categoriesResponse = await page.request.get('http://localhost:8080/api/thorne/categories');
    expect(categoriesResponse.ok()).toBeTruthy();
    
    const categoriesData = await categoriesResponse.json();
    expect(categoriesData.success).toBe(true);
    expect(categoriesData.data).toHaveLength(6);
    
    // Test products API
    const productsResponse = await page.request.get('http://localhost:8080/api/thorne/products');
    expect(productsResponse.ok()).toBeTruthy();
    
    const productsData = await productsResponse.json();
    expect(productsData.success).toBe(true);
    expect(productsData.data.length).toBeGreaterThan(0);
    
    // Test settings API
    const settingsResponse = await page.request.get('http://localhost:8080/api/thorne/settings');
    expect(settingsResponse.ok()).toBeTruthy();
    
    const settingsData = await settingsResponse.json();
    expect(settingsData.success).toBe(true);
  });

  test('No JavaScript errors on Thorne pages', async ({ page }) => {
    const errors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    // Navigate through all Thorne pages
    await page.goto('http://localhost:3000/thorne/education');
    await page.waitForLoadState('networkidle');
    
    await page.goto('http://localhost:3000/thorne/register');
    await page.waitForLoadState('networkidle');
    
    await page.goto('http://localhost:3000/thorne/compliance');
    await page.waitForLoadState('networkidle');
    
    await page.goto('http://localhost:3000/thorne/portal');
    await page.waitForLoadState('networkidle');
    
    // Check for any errors
    expect(errors).toHaveLength(0);
  });

  test('Responsive design works', async ({ page }) => {
    await page.goto('http://localhost:3000/thorne/education');
    await page.waitForLoadState('networkidle');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // Check that content is still visible
    const title = page.locator('h1').nth(1); // Second h1 should be the page title
    await expect(title).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    
    await expect(title).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    
    await expect(title).toBeVisible();
  });
});
