import { test, expect, Page } from '@playwright/test';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

test.describe('Simple API Test', () => {
  let page: Page;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const screenshotDir = `/projects/03-project-management-common/agoat-publisher-e2e-images/${timestamp}-simple-api`;

  test.beforeAll(async () => {
    if (!existsSync(screenshotDir)) {
      mkdirSync(screenshotDir, { recursive: true });
    }
    console.log(`📁 Screenshot directory created: ${screenshotDir}`);
  });

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Capture all network requests
    const requests: any[] = [];
    const responses: any[] = [];
    
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData()
      });
      console.log(`🌐 Request: ${request.method()} ${request.url()}`);
    });

    page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        headers: response.headers()
      });
      console.log(`📡 Response: ${response.status()} ${response.url()}`);
    });

    page.on('requestfailed', request => {
      console.log(`💥 Request Failed: ${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
    });

    // Store for later analysis
    (page as any).networkRequests = requests;
    (page as any).networkResponses = responses;
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('Test API Request Details', async () => {
    console.log('🔍 Testing API request details...');

    // Set up authentication
    await page.addInitScript(() => {
      const mockUser = {
        id: '1096773348868587521',
        email: 'andrewqr@gmail.com',
        name: 'Andrew Smith',
        role: 'admin',
        authenticated: true
      };
      
      localStorage.setItem('oidc_user', JSON.stringify(mockUser));
      localStorage.setItem('auth_user', JSON.stringify(mockUser));
    });

    // Navigate to new post page
    await page.goto('/new-post');
    await page.waitForLoadState('networkidle');

    // Fill in the title
    const newPostTitle = `Simple API Test Post ${new Date().toISOString()}`;
    await page.locator('input[placeholder*="title"], input[placeholder*="Title"]').fill(newPostTitle);

    // Fill in content
    const newPostContent = `This is content for simple API testing at ${new Date().toISOString()}.`;
    await page.locator('.wysimark-editable, [data-wysimark]').fill(newPostContent);

    // Change status to published
    await page.locator('[role="combobox"], [aria-haspopup="listbox"]').click();
    await page.locator('[role="option"]:has-text("Published")').click();
    await page.waitForLoadState('networkidle');

    // Click save and capture the exact request
    console.log('🔄 Clicking save button...');
    await page.locator('button:has-text("Save")').click();
    
    // Wait for network activity to complete
    await page.waitForLoadState('networkidle');

    // Analyze the network requests
    const requests = (page as any).networkRequests || [];
    const responses = (page as any).networkResponses || [];

    console.log(`\n📊 Network Analysis:`);
    console.log(`Total requests: ${requests.length}`);
    console.log(`Total responses: ${responses.length}`);

    // Find API requests
    const apiRequests = requests.filter((req: any) => req.url.includes('/api/'));
    const apiResponses = responses.filter((res: any) => res.url.includes('/api/'));

    console.log(`\n🔍 API Requests:`);
    apiRequests.forEach((req: any, index: number) => {
      console.log(`${index + 1}. ${req.method} ${req.url}`);
      if (req.postData) {
        console.log(`   Body: ${req.postData}`);
      }
    });

    console.log(`\n📡 API Responses:`);
    apiResponses.forEach((res: any, index: number) => {
      console.log(`${index + 1}. ${res.status} ${res.statusText} ${res.url}`);
    });

    // Check for failed requests
    const failedRequests = apiResponses.filter((res: any) => res.status >= 400);
    if (failedRequests.length > 0) {
      console.log(`\n❌ Failed API Requests:`);
      failedRequests.forEach((res: any, index: number) => {
        console.log(`${index + 1}. ${res.status} ${res.statusText} ${res.url}`);
      });
    }

    // Save network data to file for analysis
    const networkData = {
      requests: apiRequests,
      responses: apiResponses,
      timestamp: new Date().toISOString()
    };
    
    writeFileSync(
      join(screenshotDir, 'network-data.json'),
      JSON.stringify(networkData, null, 2)
    );

    console.log('✅ Simple API test completed!');
  });
});
