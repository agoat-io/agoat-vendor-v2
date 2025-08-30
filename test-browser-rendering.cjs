#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testBrowserRendering() {
  console.log('🚀 Starting browser-based client-side rendering test...\n');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Capture console messages and errors
    const consoleMessages = [];
    const errors = [];
    
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      consoleMessages.push({ type, text });
      
      if (type === 'error') {
        console.log(`❌ Console Error: ${text}`);
      } else if (type === 'warning') {
        console.log(`⚠️  Console Warning: ${text}`);
      }
    });
    
    page.on('pageerror', error => {
      errors.push(error.message);
      console.log(`💥 Page Error: ${error.message}`);
    });
    
    page.on('requestfailed', request => {
      console.log(`🚫 Request Failed: ${request.url()} - ${request.failure().errorText}`);
    });
    
    // Test 1: Load main page
    console.log('📄 Loading main page (http://localhost:3000)...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait for React to render
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 2: Check if page loaded successfully
    const title = await page.title();
    console.log(`✅ Page Title: ${title}`);
    
    // Test 3: Check for specific elements
    console.log('\n🔍 Checking for key elements...');
    
    const hasThemeProvider = await page.$('[data-is-root-theme="true"]');
    console.log(`${hasThemeProvider ? '✅' : '❌'} Theme Provider: ${hasThemeProvider ? 'Found' : 'Not found'}`);
    
    const hasConfigButton = await page.$('button[aria-label="Open configuration panel"]');
    console.log(`${hasConfigButton ? '✅' : '❌'} Configuration Button: ${hasConfigButton ? 'Found' : 'Not found'}`);
    
    const hasLoadingSpinner = await page.$('.rt-Spinner');
    console.log(`${hasLoadingSpinner ? '⏳' : '✅'} Loading Spinner: ${hasLoadingSpinner ? 'Still loading' : 'Finished loading'}`);
    
    // Test 4: Check federation loading
    console.log('\n📡 Testing Module Federation...');
    
    // Wait for federation to attempt loading
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if federation config is accessible
    const federationConfigExists = await page.evaluate(async () => {
      try {
        const response = await fetch('/federation-config.json');
        return response.ok;
      } catch (e) {
        return false;
      }
    });
    console.log(`${federationConfigExists ? '✅' : '❌'} Federation Config: ${federationConfigExists ? 'Accessible' : 'Not accessible'}`);
    
    // Test 5: Check if federated components loaded
    const federatedComponentLoaded = await page.evaluate(() => {
      // Check if there are any elements that suggest federated components loaded
      const loadingText = document.querySelector('span')?.textContent?.includes('Loading PostsList');
      const errorText = document.querySelector('span')?.textContent?.includes('Error loading');
      return { loadingText, errorText };
    });
    
    console.log(`📊 Federation Status:`);
    console.log(`   Loading: ${federatedComponentLoaded.loadingText ? 'Yes' : 'No'}`);
    console.log(`   Error: ${federatedComponentLoaded.errorText ? 'Yes' : 'No'}`);
    
    // Test 6: Test configuration panel
    console.log('\n⚙️  Testing Configuration Panel...');
    
    if (hasConfigButton) {
      await page.click('button[aria-label="Open configuration panel"]');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const panelVisible = await page.$('.rt-ThemePanelSwatch');
      console.log(`${panelVisible ? '✅' : '❌'} Configuration Panel: ${panelVisible ? 'Opens successfully' : 'Failed to open'}`);
      
      if (panelVisible) {
        // Test theme switching
        const blueTheme = await page.$('input[value="blue"]');
        if (blueTheme) {
          await page.click('input[value="blue"]');
          console.log('✅ Theme switching: Blue theme clicked');
        }
      }
    }
    
    // Test 7: Summary of console messages
    console.log('\n📋 Console Message Summary:');
    const errorCount = consoleMessages.filter(m => m.type === 'error').length;
    const warningCount = consoleMessages.filter(m => m.type === 'warning').length;
    const logCount = consoleMessages.filter(m => m.type === 'log').length;
    
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Warnings: ${warningCount}`);
    console.log(`   Logs: ${logCount}`);
    
    if (errorCount > 0) {
      console.log('\n❌ JavaScript Errors Found:');
      consoleMessages
        .filter(m => m.type === 'error')
        .slice(0, 5) // Show first 5 errors
        .forEach((msg, i) => console.log(`   ${i + 1}. ${msg.text}`));
    }
    
    if (warningCount > 0) {
      console.log('\n⚠️  JavaScript Warnings Found:');
      consoleMessages
        .filter(m => m.type === 'warning')
        .slice(0, 3) // Show first 3 warnings
        .forEach((msg, i) => console.log(`   ${i + 1}. ${msg.text}`));
    }
    
    // Test 8: Take screenshot for debugging
    await page.screenshot({ path: 'test-screenshot.png', fullPage: true });
    console.log('\n📸 Screenshot saved as test-screenshot.png');
    
    // Final assessment
    console.log('\n🎯 Final Assessment:');
    if (errors.length === 0 && errorCount === 0) {
      console.log('✅ No critical JavaScript errors detected');
    } else {
      console.log(`❌ Found ${errors.length + errorCount} critical errors that need fixing`);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testBrowserRendering().catch(console.error);
