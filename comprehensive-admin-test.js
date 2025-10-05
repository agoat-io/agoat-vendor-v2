/**
 * Comprehensive Admin Testing Suite for agoat-publisher
 * Tests admin functionality with direct API access and UI testing
 * Follows work rules: headless mode, screenshots, JS error detection
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class ComprehensiveAdminTester {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = [];
        this.screenshotDir = '/media/psf/projects/03-project-management-common/agoat-publisher-e2e-images';
        this.baseUrl = 'https://dev.np-topvitaminsupply.com';
        this.apiBaseUrl = 'https://dev.np-topvitaminsupply.com/api';
        this.jsErrors = [];
        
        // Ensure screenshot directory exists
        if (!fs.existsSync(this.screenshotDir)) {
            fs.mkdirSync(this.screenshotDir, { recursive: true });
        }
    }

    async initialize() {
        console.log('🚀 Initializing comprehensive admin test suite...');
        
        // Launch Chromium in headless mode as per work rules
        this.browser = await chromium.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors', '--ignore-ssl-errors', '--ignore-certificate-errors-spki-list']
        });
        
        this.page = await this.browser.newPage();
        
        // Ignore SSL certificate errors for API requests
        await this.page.context().setHTTPCredentials({ username: '', password: '' });
        await this.page.context().setExtraHTTPHeaders({
            'Accept': 'application/json, text/plain, */*'
        });
        
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

    async testApiEndpoints() {
        console.log('🔌 Testing API endpoints...');
        const results = [];
        
        try {
            // Test admin tables endpoint
            console.log('📊 Testing admin tables endpoint...');
            const response = await this.page.request.get(`${this.apiBaseUrl}/admin/tables`, {
                ignoreHTTPSErrors: true
            });
            const status = response.status();
            
            if (status === 200) {
                const data = await response.json();
                console.log(`✅ Admin tables endpoint working - found ${data.tables?.length || 0} tables`);
                
                results.push({
                    test: 'admin_tables_api',
                    status: 'passed',
                    tables_found: data.tables?.length || 0,
                    tables: data.tables?.map(t => t.name) || []
                });
                
                // Test each table endpoint
                if (data.tables && data.tables.length > 0) {
                    for (const table of data.tables.slice(0, 3)) { // Test first 3 tables
                        try {
                            console.log(`🔍 Testing table: ${table.name}`);
                            const tableResponse = await this.page.request.get(`${this.apiBaseUrl}/admin/tables/${table.name}?page=1&page_size=10`, {
                                ignoreHTTPSErrors: true
                            });
                            const tableStatus = tableResponse.status();
                            
                            if (tableStatus === 200) {
                                const tableData = await tableResponse.json();
                                results.push({
                                    test: `table_${table.name}_api`,
                                    status: 'passed',
                                    row_count: tableData.total_rows || 0,
                                    columns: tableData.columns?.length || 0
                                });
                                console.log(`✅ Table ${table.name} accessible - ${tableData.total_rows || 0} rows, ${tableData.columns?.length || 0} columns`);
                            } else {
                                results.push({
                                    test: `table_${table.name}_api`,
                                    status: 'failed',
                                    error: `HTTP ${tableStatus}`
                                });
                                console.log(`❌ Table ${table.name} failed - HTTP ${tableStatus}`);
                            }
                        } catch (error) {
                            results.push({
                                test: `table_${table.name}_api`,
                                status: 'failed',
                                error: error.message
                            });
                            console.log(`❌ Table ${table.name} error: ${error.message}`);
                        }
                    }
                }
            } else {
                results.push({
                    test: 'admin_tables_api',
                    status: 'failed',
                    error: `HTTP ${status}`
                });
                console.log(`❌ Admin tables endpoint failed - HTTP ${status}`);
            }
            
        } catch (error) {
            console.log(`❌ API testing failed: ${error.message}`);
            results.push({
                test: 'api_endpoints',
                status: 'failed',
                error: error.message
            });
        }
        
        return results;
    }

    async testAdminPageAccess() {
        console.log('🖥️ Testing admin page access...');
        const results = [];
        
        try {
            // Try to access admin page directly
            console.log('🔍 Attempting to access admin page...');
            await this.page.goto(`${this.baseUrl}/admin`);
            await this.page.waitForLoadState('networkidle');
            await this.takeScreenshot('admin-page-direct-access');
            
            const currentUrl = this.page.url();
            const currentTitle = await this.page.title();
            
            console.log(`📍 Admin page URL: ${currentUrl}`);
            console.log(`📍 Admin page title: ${currentTitle}`);
            
            // Check if we're redirected to login
            if (currentUrl.includes('/login') || currentUrl.includes('/signin')) {
                console.log('🔐 Redirected to login - authentication required');
                results.push({
                    test: 'admin_page_access',
                    status: 'redirected_to_login',
                    url: currentUrl,
                    title: currentTitle
                });
            } else {
                console.log('✅ Admin page accessible');
                results.push({
                    test: 'admin_page_access',
                    status: 'accessible',
                    url: currentUrl,
                    title: currentTitle
                });
                
                // Test admin page elements
                const adminElements = await this.testAdminPageElements();
                results.push(...adminElements);
            }
            
        } catch (error) {
            console.log(`❌ Admin page access failed: ${error.message}`);
            results.push({
                test: 'admin_page_access',
                status: 'failed',
                error: error.message
            });
        }
        
        return results;
    }

    async testAdminPageElements() {
        console.log('🧩 Testing admin page elements...');
        const results = [];
        
        try {
            // Look for admin-specific elements
            const elements = [
                { name: 'database_tables', selector: 'h1:has-text("Database Admin Panel"), h2:has-text("Database Admin Panel")' },
                { name: 'table_cards', selector: '[data-testid*="table"], .table-card, .card' },
                { name: 'refresh_button', selector: 'button:has-text("Refresh"), button:has-text("Reload")' },
                { name: 'export_button', selector: 'button:has-text("Export"), button:has-text("Download")' },
                { name: 'filter_section', selector: 'h3:has-text("Filters"), .filter-section' },
                { name: 'pagination', selector: 'button:has-text("Previous"), button:has-text("Next")' }
            ];
            
            for (const element of elements) {
                try {
                    const found = await this.page.locator(element.selector).count();
                    results.push({
                        test: `admin_element_${element.name}`,
                        status: found > 0 ? 'found' : 'not_found',
                        count: found
                    });
                    console.log(`${found > 0 ? '✅' : '❌'} ${element.name}: ${found} found`);
                } catch (error) {
                    results.push({
                        test: `admin_element_${element.name}`,
                        status: 'error',
                        error: error.message
                    });
                }
            }
            
        } catch (error) {
            console.log(`❌ Admin page elements test failed: ${error.message}`);
            results.push({
                test: 'admin_page_elements',
                status: 'failed',
                error: error.message
            });
        }
        
        return results;
    }

    async testDatabaseTables() {
        console.log('🗄️ Testing database tables...');
        const results = [];
        
        try {
            // Get tables from API
            const response = await this.page.request.get(`${this.apiBaseUrl}/admin/tables`, {
                ignoreHTTPSErrors: true
            });
            if (response.status() === 200) {
                const data = await response.json();
                const tables = data.tables || [];
                
                console.log(`📊 Found ${tables.length} database tables`);
                
                // Expected tables based on schema
                const expectedTables = [
                    'users', 'posts', 'customers', 'sites', 
                    'ciam_systems', 'user_ciam_mappings', 'migration_status'
                ];
                
                for (const expectedTable of expectedTables) {
                    const found = tables.find(t => t.name === expectedTable);
                    results.push({
                        test: `table_exists_${expectedTable}`,
                        status: found ? 'exists' : 'missing',
                        row_count: found?.row_count || 0,
                        columns: found?.columns?.length || 0
                    });
                    console.log(`${found ? '✅' : '❌'} Table ${expectedTable}: ${found ? `${found.row_count} rows, ${found.columns?.length} columns` : 'NOT FOUND'}`);
                }
                
                // Test table data access
                for (const table of tables.slice(0, 3)) {
                    try {
                        const tableResponse = await this.page.request.get(`${this.apiBaseUrl}/admin/tables/${table.name}?page=1&page_size=5`, {
                            ignoreHTTPSErrors: true
                        });
                        if (tableResponse.status() === 200) {
                            const tableData = await tableResponse.json();
                            results.push({
                                test: `table_data_${table.name}`,
                                status: 'accessible',
                                rows_returned: tableData.rows?.length || 0,
                                total_rows: tableData.total_rows || 0
                            });
                            console.log(`✅ Table ${table.name} data accessible: ${tableData.rows?.length || 0} rows returned`);
                        } else {
                            results.push({
                                test: `table_data_${table.name}`,
                                status: 'failed',
                                error: `HTTP ${tableResponse.status()}`
                            });
                        }
                    } catch (error) {
                        results.push({
                            test: `table_data_${table.name}`,
                            status: 'failed',
                            error: error.message
                        });
                    }
                }
            }
            
        } catch (error) {
            console.log(`❌ Database tables test failed: ${error.message}`);
            results.push({
                test: 'database_tables',
                status: 'failed',
                error: error.message
            });
        }
        
        return results;
    }

    async testNavigation() {
        console.log('🧭 Testing navigation...');
        const results = [];
        
        try {
            // Test main navigation
            const navLinks = [
                { name: 'home', url: '/' },
                { name: 'admin', url: '/admin' },
                { name: 'dashboard', url: '/dashboard' },
                { name: 'new_post', url: '/new-post' }
            ];
            
            for (const link of navLinks) {
                try {
                    console.log(`🔗 Testing navigation to ${link.name}...`);
                    await this.page.goto(`${this.baseUrl}${link.url}`);
                    await this.page.waitForLoadState('networkidle');
                    await this.takeScreenshot(`nav-${link.name}`);
                    
                    const currentUrl = this.page.url();
                    const currentTitle = await this.page.title();
                    
                    results.push({
                        test: `navigation_${link.name}`,
                        status: 'accessible',
                        url: currentUrl,
                        title: currentTitle
                    });
                    console.log(`✅ Navigation to ${link.name} successful`);
                    
                } catch (error) {
                    results.push({
                        test: `navigation_${link.name}`,
                        status: 'failed',
                        error: error.message
                    });
                    console.log(`❌ Navigation to ${link.name} failed: ${error.message}`);
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

    async runComprehensiveTest() {
        console.log('🚀 Starting comprehensive admin testing...');
        
        try {
            await this.initialize();
            
            // Run all test suites
            const testSuites = [
                { name: 'api_endpoints', test: this.testApiEndpoints() },
                { name: 'admin_page_access', test: this.testAdminPageAccess() },
                { name: 'database_tables', test: this.testDatabaseTables() },
                { name: 'navigation', test: this.testNavigation() }
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
        console.log('📊 Generating comprehensive test report...');
        
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
        const reportPath = '/projects/agoat-publisher/comprehensive-admin-test-report.json';
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        // Generate summary
        let totalTests = 0;
        let passedTests = 0;
        let failedTests = 0;
        
        for (const test of this.testResults) {
            if (test.results) {
                for (const result of test.results) {
                    totalTests++;
                    if (result.status === 'passed' || result.status === 'accessible' || result.status === 'exists' || result.status === 'found') {
                        passedTests++;
                    } else if (result.status === 'failed' || result.status === 'missing' || result.status === 'not_found') {
                        failedTests++;
                    }
                }
            }
        }
        
        const summary = `
=== COMPREHENSIVE ADMIN TEST REPORT ===
Total Tests: ${totalTests}
Passed: ${passedTests}
Failed: ${failedTests}
Success Rate: ${totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : 0}%
JavaScript Errors: ${this.jsErrors.length}

Screenshots saved to: ${this.screenshotDir}
Detailed report: ${reportPath}

JavaScript Errors:
${this.jsErrors.map(error => `- ${error.message}`).join('\n')}

Database Tables Status:
${this.getDatabaseTablesStatus()}
`;
        
        console.log(summary);
        
        // Save summary to file
        const summaryPath = '/projects/agoat-publisher/comprehensive-admin-test-summary.txt';
        fs.writeFileSync(summaryPath, summary);
        
        console.log(`📄 Summary saved to: ${summaryPath}`);
    }

    getDatabaseTablesStatus() {
        const tablesStatus = [];
        for (const test of this.testResults) {
            if (test.results) {
                for (const result of test.results) {
                    if (result.test && result.test.startsWith('table_exists_')) {
                        const tableName = result.test.replace('table_exists_', '');
                        tablesStatus.push(`${tableName}: ${result.status} (${result.row_count} rows, ${result.columns} columns)`);
                    }
                }
            }
        }
        return tablesStatus.join('\n');
    }
}

// Main execution
async function main() {
    const tester = new ComprehensiveAdminTester();
    await tester.runComprehensiveTest();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = ComprehensiveAdminTester;
