#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Simple function to fetch URL content
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function testClientSideRendering() {
  console.log('🧪 Testing Client-Side Rendering...\n');
  
  try {
    // Test 1: Fetch main page and check for JavaScript errors
    console.log('📄 Fetching main page HTML...');
    const mainPage = await fetchUrl('http://localhost:3000/');
    
    // Extract script URLs from the HTML
    const scriptMatches = mainPage.match(/src="([^"]*\.js[^"]*)"/g) || [];
    const scriptUrls = scriptMatches.map(match => {
      const src = match.match(/src="([^"]*)"/)[1];
      return src.startsWith('/') ? `http://localhost:3000${src}` : src;
    });
    
    console.log(`📦 Found ${scriptUrls.length} JavaScript files:`);
    scriptUrls.forEach(url => console.log(`   - ${url}`));
    
    // Test 2: Check federation config
    console.log('\n🔗 Testing federation configuration...');
    const federationConfig = await fetchUrl('http://localhost:3000/federation-config.json');
    console.log('✅ Federation config:', JSON.parse(federationConfig));
    
    // Test 3: Check if remoteEntry.js is accessible
    console.log('\n📡 Testing federated remote entry...');
    const remoteEntry = await fetchUrl('http://localhost:3001/remoteEntry.js');
    console.log(`✅ RemoteEntry.js size: ${(remoteEntry.length / 1024).toFixed(1)}KB`);
    
    // Test 4: Look for common error patterns in JavaScript
    console.log('\n🔍 Analyzing JavaScript bundles for errors...');
    for (const url of scriptUrls.slice(0, 3)) { // Check first 3 scripts
      try {
        const script = await fetchUrl(url);
        
        // Look for common error patterns
        const errorPatterns = [
          /Error:/gi,
          /TypeError:/gi,
          /ReferenceError:/gi,
          /SyntaxError:/gi,
          /Cannot read property/gi,
          /is not defined/gi,
          /Module not found/gi
        ];
        
        let hasErrors = false;
        errorPatterns.forEach(pattern => {
          const matches = script.match(pattern);
          if (matches && matches.length > 0) {
            console.log(`⚠️  Found potential errors in ${url}:`, matches.slice(0, 3));
            hasErrors = true;
          }
        });
        
        if (!hasErrors) {
          console.log(`✅ ${url} - No obvious errors detected`);
        }
      } catch (err) {
        console.log(`❌ Failed to fetch ${url}:`, err.message);
      }
    }
    
    // Test 5: Check API endpoints
    console.log('\n🌐 Testing API endpoints...');
    const apiStatus = await fetchUrl('http://localhost:8080/api/status');
    const statusData = JSON.parse(apiStatus);
    console.log('✅ API Status:', statusData.data.status);
    
    const apiPosts = await fetchUrl('http://localhost:8080/api/posts');
    const postsData = JSON.parse(apiPosts);
    console.log(`✅ API Posts: ${postsData.data.length} posts available`);
    
    console.log('\n🎉 Client-side rendering test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testClientSideRendering();
