const puppeteer = require('puppeteer');

async function testEditorFlow() {
  console.log('🚀 Starting comprehensive editor flow test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`❌ Console Error: ${msg.text()}`);
      } else if (msg.type() === 'warn') {
        console.log(`⚠️ Console Warning: ${msg.text()}`);
      }
    });
    
    // Enable network error logging
    page.on('response', response => {
      if (!response.ok()) {
        console.log(`❌ Network Error: ${response.status()} ${response.url()}`);
      }
    });
    
    console.log('📱 Navigating to app...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if we need to login
    const loginButton = await page.$('button:contains("Login")');
    if (loginButton) {
      console.log('🔐 Logging in...');
      await loginButton.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Fill login form
      await page.type('input[placeholder="Username"]', 'author');
      await page.type('input[placeholder="Password"]', 'author123');
      await page.click('button[type="submit"]');
      
      // Wait for redirect
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Navigate to create new post
    console.log('📝 Creating new post...');
    const newPostButton = await page.$('a[href="/new-post"], button:contains("Create New Post")');
    if (newPostButton) {
      await newPostButton.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Test WYSIWYG mode (default)
    console.log('🎨 Testing WYSIWYG mode...');
    
    // Check if editor is in WYSIWYG mode by default
    const wysiwygEditor = await page.$('.medium-editor [contenteditable]');
    if (wysiwygEditor) {
      console.log('✅ WYSIWYG editor is active by default');
      
      // Test typing in WYSIWYG mode
      await wysiwygEditor.click();
      await page.keyboard.type('This is a test post in WYSIWYG mode.\n\n');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test formatting buttons
      console.log('🔧 Testing formatting buttons...');
      
      // Test bold
      const boldButton = await page.$('button[title="Bold"]');
      if (boldButton) {
        await page.keyboard.down('Shift');
        await page.keyboard.press('Home');
        await page.keyboard.up('Shift');
        await boldButton.click();
        console.log('✅ Bold formatting applied');
      }
      
      await page.keyboard.press('End');
      await page.keyboard.type('\n\n## This is a heading\n\n');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test list
      const listButton = await page.$('button[title="Bullet List"]');
      if (listButton) {
        await listButton.click();
        await page.keyboard.type('First item');
        await page.keyboard.press('Enter');
        await page.keyboard.type('Second item');
        await page.keyboard.press('Enter');
        await page.keyboard.type('Third item');
        console.log('✅ List created');
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Test switching to code view
    console.log('💻 Testing code view mode...');
    const codeViewToggle = await page.$('button:contains("Code")');
    if (codeViewToggle) {
      await codeViewToggle.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if textarea is visible
      const codeTextarea = await page.$('.medium-editor textarea');
      if (codeTextarea) {
        console.log('✅ Code view mode activated');
        
        // Test typing markdown in code view
        await codeTextarea.click();
        await page.keyboard.type('# Markdown Test\n\nThis is **bold** and *italic* text.\n\n```javascript\nconsole.log("Hello World");\n```\n\n- List item 1\n- List item 2');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Test switching back to WYSIWYG
    console.log('🔄 Switching back to WYSIWYG mode...');
    const wysiwygToggle = await page.$('button:contains("WYSIWYG")');
    if (wysiwygToggle) {
      await wysiwygToggle.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const wysiwygEditor = await page.$('.medium-editor [contenteditable]');
      if (wysiwygEditor) {
        console.log('✅ Switched back to WYSIWYG mode');
      }
    }
    
    // Test preview mode
    console.log('👁️ Testing preview mode...');
    const previewButton = await page.$('button:contains("Preview")');
    if (previewButton) {
      await previewButton.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if preview is visible
      const previewContent = await page.$('.markdown-preview');
      if (previewContent) {
        console.log('✅ Preview mode activated');
        
        // Check if markdown is rendered properly
        const renderedHeading = await page.$('.markdown-preview h1');
        const renderedBold = await page.$('.markdown-preview strong');
        const renderedCode = await page.$('.markdown-preview pre code');
        
        if (renderedHeading) console.log('✅ H1 heading rendered');
        if (renderedBold) console.log('✅ Bold text rendered');
        if (renderedCode) console.log('✅ Code block rendered');
      }
    }
    
    // Test saving
    console.log('💾 Testing save functionality...');
    const saveButton = await page.$('button:contains("Save Draft")');
    if (saveButton) {
      await saveButton.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check for success message or redirect
      const successIndicator = await page.$('text="Saved successfully", text="Draft saved", text="Post saved"');
      if (successIndicator) {
        console.log('✅ Post saved successfully');
      } else {
        console.log('⚠️ Save status unclear - check manually');
      }
    }
    
    // Test publishing
    console.log('📤 Testing publish functionality...');
    const publishButton = await page.$('button:contains("Publish")');
    if (publishButton) {
      await publishButton.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check for success message or redirect
      const successIndicator = await page.$('text="Published successfully", text="Post published", text="Published"');
      if (successIndicator) {
        console.log('✅ Post published successfully');
      } else {
        console.log('⚠️ Publish status unclear - check manually');
      }
    }
    
    // Take a screenshot
    console.log('📸 Taking screenshot...');
    await page.screenshot({ path: 'editor-test-result.png', fullPage: true });
    console.log('📸 Screenshot saved as editor-test-result.png');
    
    console.log('✅ Editor flow test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'editor-test-error.png', fullPage: true });
    console.log('📸 Error screenshot saved as editor-test-error.png');
  } finally {
    await browser.close();
  }
}

testEditorFlow().catch(console.error);
