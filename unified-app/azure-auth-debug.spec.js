import { test, expect } from '@playwright/test';

test.describe('Azure Auth Debug', () => {
  test('should check for Azure auth initialization issues', async ({ page }) => {
    const consoleMessages = [];
    const errors = [];

    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
      
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      errors.push(error.message);
      console.log('Page error:', error.message);
    });

    // Navigate to the home page
    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    });

    // Wait for potential Azure auth initialization
    await page.waitForTimeout(5000);

    // Check if the page is stuck loading
    const loadingState = await page.evaluate(() => {
      return {
        readyState: document.readyState,
        hasReactRoot: !!document.getElementById('root'),
        rootContent: document.getElementById('root')?.innerHTML?.length || 0,
        bodyContent: document.body.innerHTML.length
      };
    });

    console.log('Page state:', loadingState);

    // Check for specific Azure-related errors
    const azureErrors = errors.filter(error => 
      error.toLowerCase().includes('azure') || 
      error.toLowerCase().includes('msal') ||
      error.toLowerCase().includes('entra')
    );

    if (azureErrors.length > 0) {
      console.log('Azure-related errors:');
      azureErrors.forEach(error => console.log('  ', error));
    }

    // Check for environment variable issues
    const envErrors = errors.filter(error => 
      error.toLowerCase().includes('environment') ||
      error.toLowerCase().includes('undefined') ||
      error.toLowerCase().includes('client_id')
    );

    if (envErrors.length > 0) {
      console.log('Environment-related errors:');
      envErrors.forEach(error => console.log('  ', error));
    }

    // Log all console messages
    console.log('All console messages:');
    consoleMessages.forEach(msg => {
      console.log(`  [${msg.type}] ${msg.text}`);
    });

    // Take a screenshot
    await page.screenshot({ path: 'azure-auth-debug.png', fullPage: true });

    // The page should at least have some content
    expect(loadingState.rootContent).toBeGreaterThan(0);
  });

  test('should check environment variables', async ({ page }) => {
    // Check if environment variables are accessible
    const envCheck = await page.evaluate(() => {
      return {
        hasClientId: !!process?.env?.REACT_APP_AZURE_CLIENT_ID,
        hasTenantId: !!process?.env?.REACT_APP_AZURE_TENANT_ID,
        hasAuthorityUrl: !!process?.env?.REACT_APP_AZURE_AUTHORITY_URL,
        hasRedirectUri: !!process?.env?.REACT_APP_AZURE_REDIRECT_URI,
        clientId: process?.env?.REACT_APP_AZURE_CLIENT_ID || 'undefined',
        tenantId: process?.env?.REACT_APP_AZURE_TENANT_ID || 'undefined'
      };
    });

    console.log('Environment variables check:', envCheck);

    // Navigate to the page
    await page.goto('http://localhost:3000', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    });

    await page.waitForTimeout(3000);

    // Check if the app is trying to initialize Azure auth
    const azureInitCheck = await page.evaluate(() => {
      // Look for any Azure/MSAL related elements or scripts
      const scripts = Array.from(document.scripts).map(s => s.src);
      const azureScripts = scripts.filter(src => 
        src.includes('azure') || src.includes('msal')
      );
      
      return {
        azureScripts,
        hasMsalInstance: typeof window !== 'undefined' && !!window.msal,
        hasPublicClientApplication: typeof window !== 'undefined' && !!window.PublicClientApplication
      };
    });

    console.log('Azure initialization check:', azureInitCheck);
  });
});
