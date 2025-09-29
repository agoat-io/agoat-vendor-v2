# Requirement Change Request: Fix OIDC Logout Flow

**Date:** 2025-09-29 03:45:00  
**Request Type:** Bug Fix  

## Summary
Fix the OIDC logout functionality to use the correct Cognito logout URL and implement proper logout callback handling.

## Issues Identified
1. **Incorrect Logout URL**: Current logout is using wrong Cognito endpoint
2. **Missing Logout Callback**: No proper logout callback handler in the application
3. **Azure Dependencies**: AuthLogout component still using Azure MSAL instead of OIDC

## Cognito Logout Requirements
Based on Cognito documentation, the logout flow should:
1. Use the correct Cognito logout endpoint with proper parameters
2. Include `logout_uri` parameter for post-logout redirect
3. Handle logout callback in the application
4. Clear local session data

## Changes Required
1. **Fix OIDC Configuration**: Update logout endpoint in oidc-config.json
2. **Update Logout Handler**: Fix logout URL construction in backend
3. **Update Frontend**: Convert AuthLogout component to use OIDC
4. **Add Logout Callback**: Implement proper logout callback handling

## Impact
- **Functional**: Logout flow will work correctly with Cognito
- **Security**: Proper session cleanup and logout confirmation
- **User Experience**: Seamless logout and redirect flow

## Acceptance Criteria
- [x] Logout redirects to correct Cognito logout URL
- [x] Cognito logout includes proper logout_uri parameter
- [x] Application handles logout callback correctly
- [x] Local session data is cleared on logout
- [x] User is redirected to appropriate page after logout
- [x] Token revocation is implemented for refresh and access tokens
- [x] Logout callback revokes tokens before redirecting

## Implementation Summary

### Fixed Issues
1. **Correct Logout URL Format**: Uses custom Cognito domain: `https://auth.dev.np-topvitaminsupply.com/logout`
2. **Proper Logout Sequence**: Implemented the correct logout flow as per Cognito documentation:
   - Step 1: Revoke refresh token via `/oauth2/revoke`
   - Step 2: Clear all tokens and session data
   - Step 3: Redirect to Cognito `/logout` endpoint
3. **Token Revocation**: Added `/api/auth/oidc/revoke` endpoint to revoke tokens using Cognito's `/oauth2/revoke` endpoint
4. **Simplified Logout Callback**: Updated logout callback to only handle final redirect after Cognito clears its session
5. **Custom Domain Usage**: Fixed to use custom Cognito domain instead of AWS standard domain format
6. **Configuration-Based Endpoint**: Fixed to use `end_session_endpoint` from configuration instead of hardcoded `/logout`
7. **Updated Logout URI**: Added `logout_uri` parameter pointing to `/auth/signout` endpoint

### Files Modified
- `app-api/handlers/oidc_auth_handlers_config.go` - Fixed logout URL format and implemented proper logout sequence
- `app-api/main.go` - Added revoke token route and `/auth/signout` endpoint
- `unified-app/src/pages/AuthLogout.tsx` - Updated to follow proper logout sequence
- `unified-app/src/App.tsx` - Added `/auth/signout` route

### Technical Details
- **Logout URL**: Now uses `https://auth.dev.np-topvitaminsupply.com/logout?client_id=4lt0iqap612c9jug55f3a1s69k&logout_uri=https%3A%2F%2Fdev.np-topvitaminsupply.com%2Fauth%2Fsignout`
- **Signout URL**: Cognito redirects to `https://dev.np-topvitaminsupply.com/auth/signout` after logout
- **Token Revocation**: Uses Cognito's `/oauth2/revoke` endpoint with proper client_id
- **Logout Flow**: Follows Cognito's recommended sequence for secure logout
- **Security**: Tokens are revoked before redirecting to Cognito logout endpoint
