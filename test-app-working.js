const puppeteer = require('puppeteer');

async function testAppWorking() {
  console.log('🧪 Testing if the React app is working correctly...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1200, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to the app
    console.log('📱 Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    // Wait for the page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if posts are being loaded
    console.log('🔍 Checking for posts...');
    
    // Look for post titles or content
    const postElements = await page.$$('[data-testid="post"], .post, [class*="post"]');
    console.log(`📝 Found ${postElements.length} post elements`);
    
    // Look for specific post titles
    const pageContent = await page.content();
    const hasTestPost = pageContent.includes('testdwdwdw');
    const hasTheTitle = pageContent.includes('The title');
    const hasFefewfew = pageContent.includes('fefewfew');
    
    console.log(`✅ Has "testdwdwdw" post: ${hasTestPost}`);
    console.log(`✅ Has "The title" post: ${hasTheTitle}`);
    console.log(`✅ Has "fefewfew" post: ${hasFefewfew}`);
    
    // Check for loading states
    const loadingElements = await page.$$('text="Loading posts..."');
    const errorElements = await page.$$('text="Error"');
    
    console.log(`⏳ Loading elements: ${loadingElements.length}`);
    console.log(`❌ Error elements: ${errorElements.length}`);
    
    // Take a screenshot
    await page.screenshot({ 
      path: './test-screenshots/app-working-test.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved: ./test-screenshots/app-working-test.png');
    
    // Test the dashboard
    console.log('📊 Testing dashboard...');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const dashboardContent = await page.content();
    const dashboardHasPosts = dashboardContent.includes('testdwdwdw') || 
                             dashboardContent.includes('The title') || 
                             dashboardContent.includes('fefewfew');
    
    console.log(`✅ Dashboard has posts: ${dashboardHasPosts}`);
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log(`   Posts found: ${postElements.length > 0 ? '✅' : '❌'}`);
    console.log(`   Specific posts visible: ${hasTestPost || hasTheTitle || hasFefewfew ? '✅' : '❌'}`);
    console.log(`   No loading errors: ${errorElements.length === 0 ? '✅' : '❌'}`);
    console.log(`   Dashboard working: ${dashboardHasPosts ? '✅' : '❌'}`);
    
    const overallSuccess = postElements.length > 0 && 
                          (hasTestPost || hasTheTitle || hasFefewfew) && 
                          errorElements.length === 0;
    
    console.log(`\n🎯 Overall Status: ${overallSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testAppWorking();
