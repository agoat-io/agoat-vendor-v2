import { chromium } from 'playwright';

async function testHomePage() {
  console.log('🚀 Starting home page test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('📱 Navigating to https://dev.np-topvitaminsupply.com...');
    
    // Set a longer timeout for the page load
    await page.goto('https://dev.np-topvitaminsupply.com', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('✅ Page loaded successfully!');
    
    // Get page title
    const title = await page.title();
    console.log(`📄 Page title: "${title}"`);
    
    // Get page URL
    const url = page.url();
    console.log(`🔗 Current URL: ${url}`);
    
    // Check if page has content
    const bodyText = await page.textContent('body');
    console.log(`📝 Body content length: ${bodyText ? bodyText.length : 0} characters`);
    
    // Take a screenshot
    await page.screenshot({ path: '/tmp/homepage-test.png' });
    console.log('📸 Screenshot saved to /tmp/homepage-test.png');
    
    // Check for common elements
    const hasHeader = await page.locator('header, .header, nav, .nav').count() > 0;
    const hasMain = await page.locator('main, .main, #main').count() > 0;
    const hasFooter = await page.locator('footer, .footer').count() > 0;
    
    console.log(`🏗️  Page structure:`);
    console.log(`   - Header: ${hasHeader ? '✅' : '❌'}`);
    console.log(`   - Main content: ${hasMain ? '✅' : '❌'}`);
    console.log(`   - Footer: ${hasFooter ? '✅' : '❌'}`);
    
    // Check for any error messages
    const errorElements = await page.locator('[class*="error"], [class*="Error"], .error-message, .alert-danger').count();
    if (errorElements > 0) {
      console.log(`⚠️  Found ${errorElements} potential error elements`);
      const errorTexts = await page.locator('[class*="error"], [class*="Error"], .error-message, .alert-danger').allTextContents();
      errorTexts.forEach((text, index) => {
        console.log(`   Error ${index + 1}: ${text}`);
      });
    }
    
    // Check for React app indicators
    const hasReactRoot = await page.locator('#root, [data-reactroot], [id*="react"]').count() > 0;
    console.log(`⚛️  React app detected: ${hasReactRoot ? '✅' : '❌'}`);
    
    // Wait a bit to see if anything loads dynamically
    console.log('⏳ Waiting 5 seconds for dynamic content...');
    await page.waitForTimeout(5000);
    
    // Check final state
    const finalBodyText = await page.textContent('body');
    console.log(`📝 Final body content length: ${finalBodyText ? finalBodyText.length : 0} characters`);
    
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Try to get more details about the error
    if (error.message.includes('net::ERR_CONNECTION_REFUSED')) {
      console.log('🔍 Connection refused - the server is not running on port 443');
    } else if (error.message.includes('net::ERR_CERT_AUTHORITY_INVALID')) {
      console.log('🔍 SSL certificate issue - self-signed certificate not trusted');
    } else if (error.message.includes('timeout')) {
      console.log('🔍 Request timeout - server may be slow or not responding');
    }
    
    // Try HTTP instead of HTTPS
    console.log('🔄 Trying HTTP instead of HTTPS...');
    try {
      const page = await browser.newPage();
      await page.goto('http://dev.np-topvitaminsupply.com', { 
        waitUntil: 'networkidle',
        timeout: 10000 
      });
      console.log('✅ HTTP connection successful!');
      const title = await page.title();
      console.log(`📄 Page title: "${title}"`);
    } catch (httpError) {
      console.error('❌ HTTP also failed:', httpError.message);
    }
  } finally {
    await browser.close();
  }
}

testHomePage().catch(console.error);
