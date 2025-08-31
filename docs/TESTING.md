# AGoat Publisher - Puppeteer Testing

This document describes the Puppeteer testing setup for the AGoat Publisher React application.

## Overview

The testing suite uses Puppeteer to perform end-to-end testing of the React application, including:
- API endpoint testing
- Frontend navigation testing
- React component rendering verification
- Responsive design testing
- Performance metrics
- JavaScript error detection
- Screenshot capture for visual verification

## Test Scripts

### 1. Comprehensive Test Script
```bash
./local-scripts/test-react-app-puppeteer.sh
```
This script:
- Starts the full stack (API + Frontend) automatically
- Waits for services to be ready
- Runs comprehensive Puppeteer tests
- Captures screenshots
- Cleans up services when done

### 2. Simple Test Script
```bash
./local-scripts/test-react-app-simple.sh
```
This script:
- Assumes services are already running
- Runs Puppeteer tests only
- Useful for quick testing during development

### 3. Results Viewer
```bash
./local-scripts/show-test-results.sh
```
This script:
- Shows test results summary
- Lists captured screenshots
- Optionally opens screenshot directory

## Test Coverage

### API Testing
- Health check endpoint (`/api/status`)
- Response validation
- Error handling

### Frontend Testing
- **Navigation Testing**: Tests all major routes
  - `/` - Home page
  - `/login` - Login page
  - `/dashboard` - Dashboard
  - `/new-post` - New post creation

- **Component Testing**:
  - React root element detection
  - UI element presence
  - JavaScript error detection

- **Responsive Design Testing**:
  - Desktop viewport (1920x1080)
  - Tablet viewport (768x1024)
  - Mobile viewport (375x667)

- **Performance Testing**:
  - Page load time measurement
  - Memory usage monitoring
  - Performance thresholds

## Screenshots

The test suite captures screenshots for:
- Home page loading
- Each route navigation
- Responsive design views (desktop, tablet, mobile)

Screenshots are saved in `./test-screenshots/` with descriptive names:
- `home-page-{timestamp}.png`
- `route-{name}-{timestamp}.png`
- `responsive-{viewport}-{timestamp}.png`

## Configuration

The test configuration is in `test-react-app-puppeteer.js`:

```javascript
const CONFIG = {
  apiUrl: 'http://localhost:8080',
  frontendUrl: 'http://localhost:3000',
  timeout: 30000,
  screenshotDir: './test-screenshots',
  headless: false, // Set to true for CI/CD
  slowMo: 1000, // Slow down actions for debugging
};
```

## Prerequisites

1. **Node.js and npm**: Required for running Puppeteer
2. **Puppeteer**: Automatically installed by test scripts
3. **Go API**: Required for backend testing
4. **React Frontend**: Required for frontend testing

## Running Tests

### Option 1: Full Stack Test (Recommended)
```bash
# This starts everything and runs tests
./local-scripts/test-react-app-puppeteer.sh
```

### Option 2: Manual Service Start
```bash
# Start services manually
./local-scripts/start-full-stack-unified.sh

# In another terminal, run tests
./local-scripts/test-react-app-simple.sh
```

### Option 3: Individual Service Start
```bash
# Start API
./local-scripts/start-api.sh

# Start frontend
./local-scripts/start-ui.sh

# Run tests
./local-scripts/test-react-app-simple.sh
```

## Test Results

### Success Indicators
- ✅ API endpoints responding correctly
- ✅ All routes loading without errors
- ✅ React components rendering properly
- ✅ No JavaScript console errors
- ✅ Responsive design working
- ✅ Performance within acceptable limits

### Failure Indicators
- ❌ API not responding
- ❌ Routes failing to load
- ❌ JavaScript errors in console
- ❌ React components not rendering
- ❌ Performance below thresholds

## Troubleshooting

### Common Issues

1. **Services Not Starting**
   - Check if ports 8080 and 3000 are available
   - Verify GCP authentication for database access
   - Check logs in `full-stack.log`

2. **Puppeteer Installation Issues**
   - Run `npm install puppeteer` manually
   - Check Node.js version compatibility

3. **Test Failures**
   - Check if services are running: `curl http://localhost:8080/api/status`
   - Verify frontend: `curl http://localhost:3000`
   - Review screenshots for visual issues

4. **Performance Issues**
   - Check system resources
   - Verify network connectivity
   - Review browser console for errors

### Debug Mode

To run tests in debug mode with visible browser:
```javascript
// In test-react-app-puppeteer.js
headless: false, // Shows browser window
slowMo: 2000,    // Slows down actions
```

## CI/CD Integration

For automated testing, modify the configuration:
```javascript
headless: true,  // Run without browser UI
slowMo: 0,       // No delays
```

## File Structure

```
local-scripts/
├── test-react-app-puppeteer.sh    # Comprehensive test script
├── test-react-app-simple.sh       # Simple test script
└── show-test-results.sh          # Results viewer

test-react-app-puppeteer.js        # Main test implementation
test-screenshots/                  # Captured screenshots
TESTING.md                         # This documentation
```

## Best Practices

1. **Run tests before commits**: Ensure no regressions
2. **Review screenshots**: Visual verification is important
3. **Monitor performance**: Keep an eye on load times
4. **Check console errors**: JavaScript errors indicate issues
5. **Test responsive design**: Ensure mobile compatibility

## Future Enhancements

- [ ] Add user interaction testing (clicks, forms, etc.)
- [ ] Implement visual regression testing
- [ ] Add accessibility testing
- [ ] Create test data fixtures
- [ ] Add API endpoint mocking
- [ ] Implement parallel test execution
