# Cognito Return URL State Feature

## Overview
This feature implements state preservation for Cognito authentication flow, ensuring users return to their original page after authentication. The implementation includes frontend state capture, backend state handling, and secure return URL processing.

## Feature Description

### User Story
**As a user**, I want to be redirected back to the page I was on before logging in, so that I can continue my workflow seamlessly after authentication.

### Acceptance Criteria
- ✅ User clicks login from any page
- ✅ User is redirected to Cognito managed login UI
- ✅ After successful authentication, user returns to original page
- ✅ Page state is preserved (URL, query parameters, hash)
- ✅ Security validation prevents open redirects
- ✅ Fallback to default page if return URL is invalid

## Technical Implementation

### Frontend Components

#### 1. CognitoAuthService (`cognitoAuth.ts`)
**Purpose**: Core authentication service with state preservation

**Key Features**:
- **State Capture**: Captures current page state before redirect
- **URL Validation**: Validates return URLs to prevent open redirects
- **PKCE Support**: Implements OAuth2 PKCE for security
- **Token Management**: Handles token refresh and storage

**State Preservation Flow**:
```typescript
// Capture current page state
const pageState = {
  url: window.location.href,
  pathname: window.location.pathname,
  search: window.location.search,
  hash: window.location.hash,
  timestamp: Date.now()
};

// Store in sessionStorage
sessionStorage.setItem('cognito_page_state', JSON.stringify(pageState));

// Initiate login with return URL
await cognitoAuth.login(returnUrl);
```

#### 2. CognitoAuthContext (`CognitoAuthContext.tsx`)
**Purpose**: React context for authentication state management

**Key Features**:
- **State Management**: Manages authentication state across components
- **Return URL Handling**: Processes return URLs after authentication
- **Token Refresh**: Automatic token refresh with background calls
- **Page Restoration**: Restores user to original page after login

**Return URL Processing**:
```typescript
// Check if user just returned from authentication
if (cognitoAuth.isAuthenticated()) {
  const pageState = cognitoAuth.restorePageState();
  if (pageState && pageState.url !== window.location.href) {
    // Navigate to the original page
    window.location.href = pageState.url;
  }
}
```

#### 3. CognitoLogin Page (`CognitoLogin.tsx`)
**Purpose**: Login page with return URL display and handling

**Key Features**:
- **Return URL Display**: Shows user where they'll be redirected
- **State Preservation**: Captures current page as return URL
- **User Experience**: Clear indication of return destination
- **Security Notice**: Informs user about secure authentication

### Backend Components

#### 1. CognitoAuthHandlers (`cognito_auth_handlers.go`)
**Purpose**: Backend handlers for Cognito authentication with state management

**Key Features**:
- **PKCE Implementation**: Secure OAuth2 flow with PKCE
- **State Parameter**: Uses state parameter for return URL preservation
- **URL Validation**: Validates return URLs to prevent open redirects
- **User Management**: Creates/updates users and CIAM mappings

**State Parameter Flow**:
```go
// Generate state parameter with return URL
stateData := map[string]string{
    "state":         state,
    "return_url":    returnURL,
    "code_verifier": codeVerifier,
}
stateJSON, _ := json.Marshal(stateData)
encodedState := base64.URLEncoding.EncodeToString(stateJSON)

// Include in authorization URL
authURL := oauth2Config.AuthCodeURL(encodedState, ...)
```

#### 2. Return URL Validation
**Purpose**: Security validation to prevent open redirects

**Validation Rules**:
- **Allowed Origins**: Only specific domains are allowed
- **Suspicious Patterns**: Blocks javascript:, data:, vbscript:, file: URLs
- **URL Parsing**: Validates URL structure and components
- **Fallback**: Uses default URL if validation fails

**Allowed Origins**:
```go
allowedOrigins := []string{
    "https://dev.np-totalvitaminsupply.com",
    "http://localhost:3000",
    "http://localhost:5173",
}
```

### API Endpoints

#### 1. Login Endpoint
```
GET /auth/cognito/login?return_url=<encoded_url>
```
- **Purpose**: Initiates Cognito authentication with return URL
- **Parameters**: `return_url` (optional) - URL to return to after authentication
- **Response**: Redirects to Cognito managed login UI
- **Security**: Validates return URL and generates secure state parameter

#### 2. Callback Endpoint
```
GET /auth/cognito/callback?code=<auth_code>&state=<state>
```
- **Purpose**: Handles Cognito authentication callback
- **Parameters**: `code` - Authorization code from Cognito, `state` - State parameter with return URL
- **Response**: Redirects to return URL after successful authentication
- **Security**: Validates state parameter and processes return URL

#### 3. Token Refresh Endpoint
```
GET /auth/cognito/refresh
```
- **Purpose**: Refreshes authentication tokens
- **Headers**: `X-Refresh-Token` - Current refresh token
- **Response**: New access and refresh tokens
- **Security**: Validates refresh token and returns new tokens

#### 4. Logout Endpoint
```
GET /auth/cognito/logout?return_url=<encoded_url>
```
- **Purpose**: Logs out user and redirects to return URL
- **Parameters**: `return_url` (optional) - URL to redirect to after logout
- **Response**: Redirects to Cognito logout URL
- **Security**: Validates return URL and clears session

## Security Considerations

### 1. Open Redirect Prevention
- **URL Validation**: Strict validation of return URLs
- **Allowed Origins**: Whitelist of allowed domains
- **Pattern Detection**: Blocks suspicious URL patterns
- **Fallback Handling**: Default URL if validation fails

### 2. State Parameter Security
- **CSRF Protection**: State parameter prevents CSRF attacks
- **PKCE Implementation**: Code challenge/verifier for additional security
- **Secure Encoding**: Base64 URL encoding for state data
- **Expiration**: State parameters have limited lifetime

### 3. Token Security
- **Secure Storage**: Tokens stored in secure session storage
- **Automatic Refresh**: Background token refresh to maintain session
- **Validation**: Proper JWT token validation
- **Logout Handling**: Secure token cleanup on logout

## User Experience

### 1. Seamless Flow
- **No Interruption**: User workflow is not interrupted
- **State Preservation**: All page state is preserved
- **Visual Feedback**: Clear indication of return destination
- **Error Handling**: Graceful fallback to default page

### 2. Security Transparency
- **Return URL Display**: User sees where they'll be redirected
- **Security Notice**: Information about secure authentication
- **Validation Feedback**: Clear error messages for invalid URLs
- **Trust Indicators**: Visual cues for secure authentication

### 3. Performance
- **Fast Redirects**: Minimal delay in authentication flow
- **Efficient State**: Lightweight state preservation
- **Background Refresh**: Non-blocking token refresh
- **Caching**: Efficient state storage and retrieval

## Configuration

### 1. Cognito Configuration
```go
cognitoConfig := &handlers.CognitoConfig{
    UserPoolID:   "us-east-1_FJUcN8W07",
    ClientID:     "4lt0iqap612c9jug55f3a1s69k",
    Region:       "us-east-1",
    Domain:       "auth.dev.np-topvitaminsupply.com",
    JWKSURL:      "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_FJUcN8W07/.well-known/jwks.json",
    IssuerURL:    "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_FJUcN8W07",
    AuthURL:      "https://auth.dev.np-topvitaminsupply.com/login/continue",
    TokenURL:     "https://auth.dev.np-topvitaminsupply.com/oauth2/token",
    RedirectURI:  "https://dev.np-totalvitaminsupply.com/auth/cognito/callback",
    Scope:        "email openid phone",
    ResponseType: "code",
}
```

### 2. Allowed Origins
```go
allowedOrigins := []string{
    "https://dev.np-totalvitaminsupply.com",
    "http://localhost:3000",
    "http://localhost:5173",
}
```

### 3. Frontend Configuration
```typescript
const config = {
  userPoolId: 'us-east-1_FJUcN8W07',
  clientId: '4lt0iqap612c9jug55f3a1s69k',
  region: 'us-east-1',
  domain: 'auth.dev.np-topvitaminsupply.com',
  redirectUri: 'https://dev.np-totalvitaminsupply.com/auth/cognito/callback',
  scope: 'email openid phone',
  responseType: 'code'
};
```

## Testing

### 1. Unit Tests
- **State Capture**: Test page state capture functionality
- **URL Validation**: Test return URL validation logic
- **Token Management**: Test token refresh and storage
- **Error Handling**: Test error scenarios and fallbacks

### 2. Integration Tests
- **Authentication Flow**: Test complete authentication flow
- **Return URL Processing**: Test return URL handling
- **Security Validation**: Test security measures
- **Cross-Browser**: Test across different browsers

### 3. Security Tests
- **Open Redirect**: Test prevention of open redirects
- **CSRF Protection**: Test state parameter security
- **Token Security**: Test token handling and validation
- **Input Validation**: Test malicious input handling

## Deployment

### 1. Environment Configuration
- **Production URLs**: Update allowed origins for production
- **Secure Storage**: Implement secure session storage
- **HTTPS**: Ensure all URLs use HTTPS in production
- **Monitoring**: Set up authentication monitoring

### 2. Database Migration
- **CIAM Tables**: Ensure CIAM tables are created
- **User Mappings**: Verify user-CIAM mapping functionality
- **Indexes**: Check performance indexes are in place
- **Data Migration**: Migrate existing users if needed

### 3. Frontend Deployment
- **Build Process**: Ensure proper build configuration
- **Environment Variables**: Set correct environment variables
- **CDN Configuration**: Configure CDN for static assets
- **Error Monitoring**: Set up frontend error monitoring

## Monitoring and Maintenance

### 1. Authentication Metrics
- **Login Success Rate**: Monitor authentication success
- **Return URL Usage**: Track return URL patterns
- **Token Refresh**: Monitor token refresh frequency
- **Error Rates**: Track authentication errors

### 2. Security Monitoring
- **Failed Validations**: Monitor failed URL validations
- **Suspicious Activity**: Track suspicious authentication attempts
- **Token Abuse**: Monitor for token misuse
- **CSRF Attempts**: Track potential CSRF attacks

### 3. Performance Monitoring
- **Authentication Speed**: Monitor authentication performance
- **State Processing**: Track state processing time
- **Token Refresh**: Monitor token refresh performance
- **User Experience**: Track user experience metrics

---

## Conclusion

The Cognito Return URL State feature provides a seamless authentication experience while maintaining security and performance. Users can authenticate from any page and return to their original location, preserving their workflow and improving user experience. The implementation includes comprehensive security measures, proper error handling, and efficient state management.
