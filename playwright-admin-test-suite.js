/**
 * Comprehensive Admin Testing Suite for agoat-publisher
 * Tests all admin functionality with specific login flow
 * Follows work rules: headless mode, screenshots, JS error detection
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class AgoatPublisherAdminTester {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = [];
        this.screenshotDir = '/media/psf/projects/03-project-management-common/agoat-publisher-e2e-images';
        this.baseUrl = 'https://dev.np-topvitaminsupply.com'; // Production URL
        this.loginEmail = 'andrewqr@gmail.com'; // User provided email
        this.loginPassword = 'Bremi-turp-443@';
        this.jsErrors = [];
        
        // Ensure screenshot directory exists
        if (!fs.existsSync(this.screenshotDir)) {
            fs.mkdirSync(this.screenshotDir, { recursive: true });
        }
    }

    async initialize() {
        console.log('🚀 Initializing agoat-publisher admin test suite...');
        
        // Launch Chromium in headless mode as per work rules
        this.browser = await chromium.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors', '--ignore-ssl-errors', '--ignore-certificate-errors-spki-list']
        });
        
        this.page = await this.browser.newPage();
        
        // Set up JavaScript error detection
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                this.jsErrors.push({
                    timestamp: new Date().toISOString(),
                    message: msg.text(),
                    location: msg.location()
                });
                console.log(`❌ JS Error: ${msg.text()}`);
            }
        });
        
        // Set up page error detection
        this.page.on('pageerror', error => {
            this.jsErrors.push({
                timestamp: new Date().toISOString(),
                message: error.message,
                stack: error.stack
            });
            console.log(`❌ Page Error: ${error.message}`);
        });
        
        console.log('✅ Browser initialized in headless mode');
    }

    async takeScreenshot(name) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${timestamp}-${name}.png`;
        const filepath = path.join(this.screenshotDir, filename);
        
        try {
            await this.page.screenshot({ 
                path: filepath, 
                fullPage: true 
            });
            console.log(`📸 Screenshot saved: ${filename}`);
            return filepath;
        } catch (error) {
            console.log(`❌ Failed to take screenshot: ${error.message}`);
            return null;
        }
    }

    async navigateToLogin() {
        console.log('🔐 Navigating to login page...');
        
        try {
            await this.page.goto(`${this.baseUrl}/login`);
            await this.page.waitForLoadState('networkidle');
            
            await this.takeScreenshot('login-page-initial');
            
            // Verify we're on the login page
            const title = await this.page.title();
            const url = this.page.url();
            
            console.log(`📍 Current page: ${title} - ${url}`);
            
            return {
                success: true,
                title,
                url
            };
        } catch (error) {
            console.log(`❌ Failed to navigate to login: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async performLoginFlow() {
        console.log('🔑 Performing OIDC/Cognito login flow...');
        
        try {
            // Step 1: Look for OIDC/Cognito login button
            console.log('🔍 Looking for OIDC/Cognito login button...');
            
            const loginButtonSelectors = [
                'button:has-text("Login with OIDC")',
                'button:has-text("Sign In with Cognito")',
                'button:has-text("Login")',
                'button:has-text("Sign In")',
                'button:has-text("Sign in")',
                'button:has-text("Continue")',
                '[data-testid*="login"]',
                '[data-testid*="signin"]'
            ];
            
            let loginButton = null;
            for (const selector of loginButtonSelectors) {
                try {
                    const element = this.page.locator(selector);
                    if (await element.count() > 0) {
                        loginButton = element.first();
                        console.log(`✅ Found login button with selector: ${selector}`);
                        break;
                    }
                } catch (e) {
                    // Continue to next selector
                }
            }
            
            if (!loginButton) {
                throw new Error('OIDC/Cognito login button not found');
            }
            
            await this.takeScreenshot('login-button-found');
            
            // Step 2: Click the login button
            console.log('🚀 Clicking OIDC/Cognito login button...');
            await loginButton.click();
            await this.page.waitForTimeout(3000);
            await this.takeScreenshot('login-button-clicked');
            
            // Step 3: Handle external authentication (if redirected)
            const currentUrl = this.page.url();
            console.log(`📍 Current URL after login click: ${currentUrl}`);
            
            // Check if we're on an external authentication page
            if (currentUrl.includes('cognito') || currentUrl.includes('auth') || currentUrl.includes('login')) {
                console.log('🔐 On external authentication page, looking for email input...');
                
                // Wait for the page to load
                await this.page.waitForLoadState('networkidle');
                await this.takeScreenshot('external-auth-page');
                
                // Look for email input on external auth page
                const emailInput = await this.page.locator('input[type="email"], input[name*="email"], input[placeholder*="email" i], input[placeholder*="username" i]').first();
                
                if (await emailInput.count() > 0) {
                    console.log('📧 Found email input on external auth page');
                    await emailInput.fill(this.loginEmail);
                    await this.takeScreenshot('external-auth-email-entered');
                    
                    // Look for "Try another way" or similar button
                    const tryAnotherWaySelectors = [
                        'button:has-text("Try another way")',
                        'button:has-text("try another way")',
                        'button:has-text("Use password")',
                        'button:has-text("use password")',
                        'a:has-text("Try another way")',
                        'a:has-text("try another way")',
                        '[data-testid*="try-another"]',
                        '[data-testid*="password-toggle"]'
                    ];
                    
                    let tryAnotherButton = null;
                    for (const selector of tryAnotherWaySelectors) {
                        try {
                            const element = this.page.locator(selector);
                            if (await element.count() > 0) {
                                tryAnotherButton = element.first();
                                console.log(`✅ Found "Try another way" button with selector: ${selector}`);
                                break;
                            }
                        } catch (e) {
                            // Continue to next selector
                        }
                    }
                    
                    if (tryAnotherButton) {
                        await tryAnotherButton.click();
                        await this.page.waitForTimeout(2000);
                        await this.takeScreenshot('external-auth-try-another-way-clicked');
                    } else {
                        console.log('⚠️ "Try another way" button not found, trying to submit email first...');
                        // Try to submit the email first to see if it shows password field
                        const emailSubmitButton = await this.page.locator('button[type="submit"], button:has-text("Next"), button:has-text("Continue")').first();
                        if (await emailSubmitButton.count() > 0) {
                            await emailSubmitButton.click();
                            await this.page.waitForTimeout(2000);
                            await this.takeScreenshot('external-auth-email-submitted');
                        }
                    }
                    
                    // Look for password input (wait a bit for it to appear)
                    await this.page.waitForTimeout(1000);
                    const passwordInput = await this.page.locator('input[type="password"], input[name*="password"]').first();
                    
                    if (await passwordInput.count() > 0) {
                        console.log('🔒 Found password input on external auth page');
                        await passwordInput.fill(this.loginPassword);
                        await this.takeScreenshot('external-auth-password-entered');
                        
                        // Look for submit button
                        const submitSelectors = [
                            'button[type="submit"]',
                            'input[type="submit"]',
                            'button:has-text("Sign in")',
                            'button:has-text("Login")',
                            'button:has-text("Log in")',
                            'button:has-text("Continue")',
                            'button:has-text("Next")',
                            'button:has-text("Submit")',
                            '[data-testid*="submit"]',
                            '[data-testid*="login"]'
                        ];
                        
                        let submitButton = null;
                        for (const selector of submitSelectors) {
                            try {
                                const element = this.page.locator(selector);
                                if (await element.count() > 0) {
                                    submitButton = element.first();
                                    console.log(`✅ Found submit button with selector: ${selector}`);
                                    break;
                                }
                            } catch (e) {
                                // Continue to next selector
                            }
                        }
                        
                        if (submitButton) {
                            await submitButton.click();
                            await this.page.waitForTimeout(3000);
                            await this.takeScreenshot('external-auth-form-submitted');
                        } else {
                            // Try pressing Enter
                            console.log('🔍 No submit button found, trying Enter key...');
                            await this.page.keyboard.press('Enter');
                            await this.page.waitForTimeout(3000);
                            await this.takeScreenshot('external-auth-form-submitted-enter');
                        }
                    } else {
                        console.log('⚠️ Password input not found, checking if we need to wait longer...');
                        await this.takeScreenshot('external-auth-no-password-input');
                    }
                }
            }
            
            // Step 4: Handle verification code if needed
            const currentUrl = this.page.url();
            if (currentUrl.includes('verifyCode') || currentUrl.includes('verification')) {
                console.log('🔐 On verification code page, looking for code input...');
                await this.takeScreenshot('verification-code-page');
                
                // Look for verification code input
                const codeInput = await this.page.locator('input[type="text"], input[type="number"], input[placeholder*="code" i], input[placeholder*="verification" i]').first();
                
                if (await codeInput.count() > 0) {
                    console.log('📧 Found verification code input');
                    // For testing purposes, we'll try a common test code or wait for manual input
                    // In a real scenario, this would need to be handled differently
                    console.log('⚠️ Verification code required - this would need manual intervention or email access');
                    await this.takeScreenshot('verification-code-input-found');
                    
                    // For now, we'll simulate a successful login by checking if we can access admin areas
                    // This is a limitation of automated testing with email verification
                    return {
                        success: false,
                        url: currentUrl,
                        title: await this.page.title(),
                        isLoggedIn: false,
                        error: 'Email verification code required - manual intervention needed'
                    };
                }
            }
            
            // Step 5: Wait for authentication to complete and check for redirect
            console.log('⏳ Waiting for authentication to complete...');
            await this.page.waitForTimeout(5000);
            
            const finalUrl = this.page.url();
            const finalTitle = await this.page.title();
            
            console.log(`📍 Final URL after authentication: ${finalUrl}`);
            console.log(`📍 Final title: ${finalTitle}`);
            await this.takeScreenshot('authentication-completed');
            
            // Check if we're redirected back to the app and away from login pages
            const isLoggedIn = !finalUrl.includes('/login') && 
                              !finalUrl.includes('/signin') && 
                              !finalUrl.includes('cognito') && 
                              !finalUrl.includes('auth') &&
                              !finalUrl.includes('verifyCode') &&
                              (finalUrl.includes('dev.np-topvitaminsupply.com') || finalUrl.includes('dashboard'));
            
            return {
                success: isLoggedIn,
                url: finalUrl,
                title: finalTitle,
                isLoggedIn
            };
            
        } catch (error) {
            console.log(`❌ Login failed: ${error.message}`);
            await this.takeScreenshot('login-error');
            return {
                success: false,
                error: error.message
            };
        }
    }

    async testAdminNavigation() {
        console.log('🧭 Testing admin navigation...');
        const results = [];
        
        try {
            // Find all navigation links
            const navLinks = await this.page.locator('nav a, .nav a, .navigation a, .sidebar a, .menu a').all();
            console.log(`🔍 Found ${navLinks.length} navigation links`);
            
            for (let i = 0; i < Math.min(navLinks.length, 10); i++) {
                try {
                    const link = navLinks[i];
                    const href = await link.getAttribute('href');
                    const text = await link.textContent();
                    
                    console.log(`🔗 Testing nav link ${i + 1}: ${text} -> ${href}`);
                    
                    await link.click();
                    await this.page.waitForLoadState('networkidle');
                    await this.takeScreenshot(`nav-link-${i + 1}-${text.replace(/[^a-zA-Z0-9]/g, '-')}`);
                    
                    const currentUrl = this.page.url();
                    const currentTitle = await this.page.title();
                    
                    results.push({
                        test: `nav_link_${i + 1}`,
                        text: text.trim(),
                        href,
                        resultUrl: currentUrl,
                        resultTitle: currentTitle,
                        status: 'passed'
                    });
                    
                } catch (error) {
                    results.push({
                        test: `nav_link_${i + 1}`,
                        status: 'failed',
                        error: error.message
                    });
                }
            }
            
        } catch (error) {
            console.log(`❌ Navigation test failed: ${error.message}`);
            results.push({
                test: 'navigation',
                status: 'failed',
                error: error.message
            });
        }
        
        return results;
    }

    async testAdminForms() {
        console.log('📝 Testing admin forms...');
        const results = [];
        
        try {
            // Test all forms on the page
            const forms = await this.page.locator('form').all();
            console.log(`🔍 Found ${forms.length} forms`);
            
            for (let i = 0; i < forms.length; i++) {
                try {
                    const form = forms[i];
                    const formId = await form.getAttribute('id') || `form_${i}`;
                    
                    console.log(`📋 Testing form ${i + 1}: ${formId}`);
                    
                    // Fill text inputs
                    const textInputs = await form.locator('input[type="text"], input[type="email"], input[type="search"], textarea').all();
                    
                    for (let j = 0; j < Math.min(textInputs.length, 3); j++) {
                        try {
                            const input = textInputs[j];
                            const inputType = await input.getAttribute('type') || 'text';
                            const placeholder = await input.getAttribute('placeholder') || '';
                            
                            await input.fill(`test_${inputType}_${j}`);
                            console.log(`  ✅ Filled ${inputType} input: ${placeholder}`);
                            
                        } catch (error) {
                            console.log(`  ❌ Failed to fill input ${j}: ${error.message}`);
                        }
                    }
                    
                    // Test select dropdowns
                    const selects = await form.locator('select').all();
                    for (let j = 0; j < Math.min(selects.length, 2); j++) {
                        try {
                            const select = selects[j];
                            const options = await select.locator('option').all();
                            
                            if (options.length > 1) {
                                await select.selectOption({ index: 1 });
                                console.log(`  ✅ Selected option in select ${j}`);
                            }
                            
                        } catch (error) {
                            console.log(`  ❌ Failed to select option ${j}: ${error.message}`);
                        }
                    }
                    
                    await this.takeScreenshot(`form-${i + 1}-${formId}-filled`);
                    
                    results.push({
                        test: `form_${i + 1}`,
                        formId,
                        textInputs: textInputs.length,
                        selects: selects.length,
                        status: 'passed'
                    });
                    
                } catch (error) {
                    results.push({
                        test: `form_${i + 1}`,
                        status: 'failed',
                        error: error.message
                    });
                }
            }
            
        } catch (error) {
            console.log(`❌ Forms test failed: ${error.message}`);
            results.push({
                test: 'forms',
                status: 'failed',
                error: error.message
            });
        }
        
        return results;
    }

    async testAdminButtons() {
        console.log('🔘 Testing admin buttons...');
        const results = [];
        
        try {
            // Find all buttons
            const buttons = await this.page.locator('button, input[type="button"], input[type="submit"]').all();
            console.log(`🔍 Found ${buttons.length} buttons`);
            
            for (let i = 0; i < Math.min(buttons.length, 8); i++) {
                try {
                    const button = buttons[i];
                    const text = await button.textContent();
                    const buttonType = await button.getAttribute('type') || 'button';
                    
                    // Skip dangerous buttons
                    if (text && ['delete', 'remove', 'destroy', 'logout', 'sign out'].some(word => 
                        text.toLowerCase().includes(word))) {
                        console.log(`⚠️ Skipping dangerous button: ${text}`);
                        continue;
                    }
                    
                    console.log(`🔘 Testing button ${i + 1}: ${text} (${buttonType})`);
                    
                    await button.click();
                    await this.page.waitForTimeout(1000);
                    await this.takeScreenshot(`button-${i + 1}-${text.replace(/[^a-zA-Z0-9]/g, '-')}`);
                    
                    results.push({
                        test: `button_${i + 1}`,
                        text: text.trim(),
                        type: buttonType,
                        status: 'passed'
                    });
                    
                } catch (error) {
                    results.push({
                        test: `button_${i + 1}`,
                        status: 'failed',
                        error: error.message
                    });
                }
            }
            
        } catch (error) {
            console.log(`❌ Buttons test failed: ${error.message}`);
            results.push({
                test: 'buttons',
                status: 'failed',
                error: error.message
            });
        }
        
        return results;
    }

    async testAdminScreens() {
        console.log('🖥️ Testing admin screens...');
        const results = [];
        
        try {
            // Look for admin-specific sections
            const adminSections = [
                'dashboard', 'users', 'settings', 'admin', 'manage', 'control',
                'configuration', 'system', 'security', 'logs', 'reports', 'analytics'
            ];
            
            for (const section of adminSections) {
                try {
                    // Look for links or elements containing admin section keywords
                    const sectionElements = await this.page.locator(`a[href*="${section}"], *:has-text("${section}")`).all();
                    
                    if (sectionElements.length > 0) {
                        console.log(`🔍 Found ${sectionElements.length} elements for section: ${section}`);
                        
                        for (let i = 0; i < Math.min(sectionElements.length, 2); i++) {
                            try {
                                const element = sectionElements[i];
                                const tagName = await element.evaluate(el => el.tagName);
                                const text = await element.textContent();
                                
                                // Try to click if it's clickable
                                if (['A', 'BUTTON', 'INPUT'].includes(tagName)) {
                                    console.log(`🖱️ Clicking ${section} element: ${text}`);
                                    await element.click();
                                    await this.page.waitForLoadState('networkidle');
                                    await this.takeScreenshot(`admin-section-${section}-${i + 1}`);
                                    
                                    const currentUrl = this.page.url();
                                    const currentTitle = await this.page.title();
                                    
                                    results.push({
                                        test: `admin_section_${section}_${i + 1}`,
                                        element: tagName,
                                        text: text.trim().substring(0, 50),
                                        url: currentUrl,
                                        title: currentTitle,
                                        status: 'passed'
                                    });
                                }
                                
                            } catch (error) {
                                results.push({
                                    test: `admin_section_${section}_${i + 1}`,
                                    status: 'failed',
                                    error: error.message
                                });
                            }
                        }
                    }
                    
                } catch (error) {
                    results.push({
                        test: `admin_section_${section}`,
                        status: 'failed',
                        error: error.message
                    });
                }
            }
            
        } catch (error) {
            console.log(`❌ Admin screens test failed: ${error.message}`);
            results.push({
                test: 'admin_screens',
                status: 'failed',
                error: error.message
            });
        }
        
        return results;
    }

    async testFileUploads() {
        console.log('📁 Testing file uploads...');
        const results = [];
        
        try {
            const fileInputs = await this.page.locator('input[type="file"]').all();
            
            if (fileInputs.length > 0) {
                console.log(`🔍 Found ${fileInputs.length} file upload inputs`);
                
                for (let i = 0; i < fileInputs.length; i++) {
                    try {
                        // Create a test file
                        const testFilePath = `/tmp/test_upload_${i}.txt`;
                        fs.writeFileSync(testFilePath, `Test file content ${i}`);
                        
                        await fileInputs[i].setInputFiles(testFilePath);
                        console.log(`📁 Uploaded test file to input ${i + 1}`);
                        
                        await this.takeScreenshot(`file-upload-${i + 1}`);
                        
                        results.push({
                            test: `file_upload_${i + 1}`,
                            status: 'passed'
                        });
                        
                        // Clean up
                        fs.unlinkSync(testFilePath);
                        
                    } catch (error) {
                        results.push({
                            test: `file_upload_${i + 1}`,
                            status: 'failed',
                            error: error.message
                        });
                    }
                }
            } else {
                results.push({
                    test: 'file_uploads',
                    status: 'skipped',
                    reason: 'No file inputs found'
                });
            }
            
        } catch (error) {
            console.log(`❌ File upload test failed: ${error.message}`);
            results.push({
                test: 'file_uploads',
                status: 'failed',
                error: error.message
            });
        }
        
        return results;
    }

    async runComprehensiveTest() {
        console.log('🚀 Starting comprehensive admin testing...');
        
        try {
            await this.initialize();
            
            // Test login flow
            const loginNav = await this.navigateToLogin();
            this.testResults.push({
                test: 'navigate_to_login',
                result: loginNav,
                timestamp: new Date().toISOString()
            });
            
            if (loginNav.success) {
                const loginResult = await this.performLoginFlow();
                this.testResults.push({
                    test: 'login_flow',
                    result: loginResult,
                    timestamp: new Date().toISOString()
                });
                
                if (loginResult.success && loginResult.isLoggedIn) {
                    console.log('✅ Login successful, proceeding with admin tests...');
                    
                    // Run all admin tests
                    const testSuites = [
                        { name: 'navigation', test: this.testAdminNavigation() },
                        { name: 'forms', test: this.testAdminForms() },
                        { name: 'buttons', test: this.testAdminButtons() },
                        { name: 'admin_screens', test: this.testAdminScreens() },
                        { name: 'file_uploads', test: this.testFileUploads() }
                    ];
                    
                    for (const suite of testSuites) {
                        try {
                            console.log(`🧪 Running ${suite.name} tests...`);
                            const results = await suite.test;
                            this.testResults.push({
                                test: suite.name,
                                results,
                                timestamp: new Date().toISOString()
                            });
                            
                        } catch (error) {
                            console.log(`❌ Test suite ${suite.name} failed: ${error.message}`);
                            this.testResults.push({
                                test: suite.name,
                                error: error.message,
                                timestamp: new Date().toISOString()
                            });
                        }
                    }
                } else {
                    console.log('❌ Login failed, cannot proceed with admin tests');
                }
            }
            
        } catch (error) {
            console.log(`❌ Test execution failed: ${error.message}`);
            this.testResults.push({
                test: 'execution',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        } finally {
            await this.cleanup();
            await this.generateReport();
        }
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            console.log('🧹 Browser closed');
        }
    }

    async generateReport() {
        console.log('📊 Generating test report...');
        
        const report = {
            summary: {
                timestamp: new Date().toISOString(),
                totalTests: this.testResults.length,
                jsErrors: this.jsErrors.length,
                screenshotDir: this.screenshotDir
            },
            testResults: this.testResults,
            jsErrors: this.jsErrors
        };
        
        // Save JSON report
        const reportPath = '/projects/agoat-publisher/admin-test-report.json';
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        // Generate summary
        let totalTests = 0;
        let passedTests = 0;
        let failedTests = 0;
        
        for (const test of this.testResults) {
            if (test.results) {
                for (const result of test.results) {
                    totalTests++;
                    if (result.status === 'passed') {
                        passedTests++;
                    } else if (result.status === 'failed') {
                        failedTests++;
                    }
                }
            }
        }
        
        const summary = `
=== AGOAT PUBLISHER ADMIN TEST REPORT ===
Total Tests: ${totalTests}
Passed: ${passedTests}
Failed: ${failedTests}
Success Rate: ${totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : 0}%
JavaScript Errors: ${this.jsErrors.length}

Screenshots saved to: ${this.screenshotDir}
Detailed report: ${reportPath}

JavaScript Errors:
${this.jsErrors.map(error => `- ${error.message}`).join('\n')}
`;
        
        console.log(summary);
        
        // Save summary to file
        const summaryPath = '/projects/agoat-publisher/admin-test-summary.txt';
        fs.writeFileSync(summaryPath, summary);
        
        console.log(`📄 Summary saved to: ${summaryPath}`);
    }
}

// Main execution
async function main() {
    const tester = new AgoatPublisherAdminTester();
    
    // Email is already set in constructor
    console.log(`📧 Using email: ${tester.loginEmail}`);
    
    await tester.runComprehensiveTest();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = AgoatPublisherAdminTester;
