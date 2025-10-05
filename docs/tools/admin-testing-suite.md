# agoat-publisher Admin Testing Suite

## Overview

This comprehensive testing suite uses Playwright with Chromium to test all admin functionality of the agoat-publisher application. It follows the work rules specified in the global instructions:

- ✅ Runs in headless mode (no browser popup)
- ✅ Saves screenshots to `/media/psf/projects/03-project-management-common/agoat-publisher-e2e-images`
- ✅ Detects JavaScript errors
- ✅ Reads server-side logs for troubleshooting
- ✅ Uses non-browser based reports

## Files

- `playwright-admin-test-suite.js` - Main test suite
- `package.json` - Node.js dependencies
- `run-admin-tests.sh` - Execution script
- `docs/tools/admin-testing-suite.md` - This documentation

## Prerequisites

1. **Node.js** - Required for running Playwright
2. **agoat-publisher running** - App should be accessible at `http://localhost:3000`
3. **Admin credentials** - Email and password for login

## Quick Start

### 1. Setup
```bash
cd /projects/agoat-publisher
npm install
npx playwright install chromium
```

### 2. Run Tests
```bash
./run-admin-tests.sh your-email@example.com
```

Or directly:
```bash
node playwright-admin-test-suite.js your-email@example.com
```

## Test Flow

### Login Process
1. **Navigate to login page** - Goes to `/login`
2. **Enter email** - Fills email input field
3. **Click "Try another way"** - Shows password field
4. **Enter password** - Uses `Bremi-turp-443@`
5. **Submit form** - Clicks submit or presses Enter
6. **Verify login** - Checks for successful redirect

### Admin Testing
1. **Navigation Testing** - Tests all nav links and menus
2. **Form Testing** - Fills all text inputs, selects, textareas
3. **Button Testing** - Clicks all safe buttons (skips dangerous ones)
4. **Admin Screens** - Tests admin-specific sections
5. **File Uploads** - Tests file upload functionality

## Test Coverage

### Navigation
- All navigation links
- Sidebar menus
- Breadcrumbs
- Admin section links

### Forms
- Text inputs (text, email, search)
- Textareas
- Select dropdowns
- Checkboxes and radio buttons
- File upload inputs

### Buttons
- Submit buttons
- Action buttons
- Navigation buttons
- **Safety**: Skips delete/remove/destroy/logout buttons

### Admin Sections
- Dashboard
- Users management
- Settings
- System configuration
- Security settings
- Logs and reports
- Analytics

### File Operations
- File upload inputs
- Creates temporary test files
- Cleans up after testing

## Safety Features

### Dangerous Operations
- Skips buttons with text: delete, remove, destroy, logout, sign out
- Skips external links
- Uses test data for form inputs
- Creates temporary test files for uploads

### Error Handling
- Catches and reports all errors
- Continues testing even if individual tests fail
- Takes screenshots on errors
- Logs JavaScript errors

## Output and Reports

### Screenshots
- Saved to: `/media/psf/projects/03-project-management-common/agoat-publisher-e2e-images`
- Naming: `YYYY-MM-DDTHH-mm-ss-description.png`
- Full page screenshots for all changes and fixes

### Reports
- `admin-test-report.json` - Detailed JSON report with all test results
- `admin-test-summary.txt` - Human-readable summary
- Console output - Real-time test progress

### JavaScript Error Detection
- Console errors
- Page errors
- Network errors
- All errors logged with timestamps and stack traces

## Configuration

### Base URL
Default: `http://localhost:3000`
Can be modified in the test suite if needed.

### Login Credentials
- Email: Provided as command line argument
- Password: `Bremi-turp-443@` (hardcoded as specified)

### Screenshot Directory
Default: `/media/psf/projects/03-project-management-common/agoat-publisher-e2e-images`
Follows work rules for screenshot storage.

## Example Usage

```bash
# Basic test run
./run-admin-tests.sh admin@example.com

# Direct execution
node playwright-admin-test-suite.js admin@example.com

# With custom setup
npm install
npx playwright install chromium
node playwright-admin-test-suite.js admin@example.com
```

## Example Output

```
=== agoat-publisher Admin Testing Suite ===
📧 Testing with email: admin@example.com
🔒 Password: Bremi-turp-443@

🚀 Starting comprehensive admin testing...
🔐 Navigating to login page...
📧 Entering email...
🔍 Looking for "Try another way" button...
✅ Found "Try another way" button
🔒 Entering password...
🚀 Submitting login form...
✅ Login successful, proceeding with admin tests...

🧭 Testing admin navigation...
🔍 Found 15 navigation links
🔗 Testing nav link 1: Dashboard -> /admin/dashboard
📸 Screenshot saved: 2024-01-15T10-30-45-nav-link-1-Dashboard.png

📝 Testing admin forms...
🔍 Found 3 forms
📋 Testing form 1: user-form
  ✅ Filled text input: Name
  ✅ Filled email input: Email
  ✅ Selected option in select 1
📸 Screenshot saved: 2024-01-15T10-30-50-form-1-user-form-filled.png

🔘 Testing admin buttons...
🔍 Found 8 buttons
🔘 Testing button 1: Save (submit)
⚠️ Skipping dangerous button: Delete User

🖥️ Testing admin screens...
🔍 Found 5 elements for section: dashboard
🖱️ Clicking dashboard element: Dashboard
📸 Screenshot saved: 2024-01-15T10-31-00-admin-section-dashboard-1.png

📁 Testing file uploads...
🔍 Found 2 file upload inputs
📁 Uploaded test file to input 1
📸 Screenshot saved: 2024-01-15T10-31-05-file-upload-1.png

=== AGOAT PUBLISHER ADMIN TEST REPORT ===
Total Tests: 45
Passed: 42
Failed: 3
Success Rate: 93.3%
JavaScript Errors: 0

Screenshots saved to: /media/psf/projects/03-project-management-common/agoat-publisher-e2e-images
Detailed report: /projects/agoat-publisher/admin-test-report.json
```

## Troubleshooting

### Common Issues

1. **"agoat-publisher not running"**
   - Start the app: `./local-scripts/start-full-stack-unified.sh`
   - Check if accessible at `http://localhost:3000`

2. **"Login failed"**
   - Verify email is correct
   - Check if "Try another way" button exists
   - Ensure password field appears after clicking it

3. **"Playwright not installed"**
   - Run: `npm install && npx playwright install chromium`

4. **"Screenshot directory not found"**
   - Create directory: `mkdir -p /media/psf/projects/03-project-management-common/agoat-publisher-e2e-images`

### Debug Mode

To run with more verbose output:
```bash
DEBUG=pw:api node playwright-admin-test-suite.js admin@example.com
```

## Integration with Work Rules

This testing suite fully complies with the work rules:

1. **Headless mode** - No browser popup on machine
2. **Screenshots** - All changes and fixes saved to designated directory
3. **JavaScript error detection** - All JS errors captured and reported
4. **Server logs** - Can be checked alongside test results for troubleshooting
5. **Non-browser reports** - JSON and text reports, no browser-based reports
6. **Documentation** - Stored in `/projects/agoat-publisher/docs/tools/`

## Maintenance

### Updating Tests
- Modify `playwright-admin-test-suite.js` for new test cases
- Update this documentation for new features
- Add new admin sections to the test coverage

### Adding New Admin Features
1. Add new selectors to the appropriate test method
2. Update screenshot naming if needed
3. Add new admin sections to `testAdminScreens()`
4. Update documentation

### Performance Monitoring
- Monitor test execution time
- Check screenshot directory size
- Review JavaScript error patterns
- Update test coverage as needed
