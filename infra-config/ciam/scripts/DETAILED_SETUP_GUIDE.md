# 📋 Complete External Identities Setup Guide

## 🎯 **Objective**
Configure Azure External Identities to provide social login buttons and local account creation while excluding Azure work accounts.

## 🕐 **Estimated Time: 25 minutes**

## 📊 **Configuration Summary**
- **Tenant ID**: `2a81f801-dae3-49fc-9d8f-fa35786c0087`
- **Application ID**: `671a313a-1698-4a50-bd15-38acac5a66c3`
- **Application Name**: `Top Vitamin Supplies CIAM`
- **Domain**: `topvitaminsupply.com`

---

# 🚀 **STEP-BY-STEP INSTRUCTIONS**

## 📝 **Step 1: Create User Flows (5 minutes)**

### **⚠️ IMPORTANT: External Identities Limitation**
**Azure External Identities only supports "Sign up and sign in" user flows.** Unlike Azure AD B2C, External Identities does not have separate Password Reset or Profile Editing user flows. All functionality is handled within the single "Sign up and sign in" flow.

### **1.1 Navigate to External Identities**

**Option A: Through Azure Portal Navigation**
1. Open browser and go to: **https://portal.azure.com**
2. Sign in with your Azure account
3. In the left sidebar, click **"Azure Active Directory"**
4. In the Azure AD menu, click **"External Identities"**
5. In the External Identities menu, click **"User flows"**

**Option B: Direct Link (Recommended)**
1. Go directly to: **https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ExternalIdentitiesMenuBlade/~/UserFlows**

### **1.2 Create Sign-up and Sign-in User Flow**

1. **Click** the **"+ New user flow"** button (blue button at the top)

**What you should see:**
- A page with "Sign up and sign in" as text
- No clickable tiles or version dropdown
- Just a "Create" button or "Next" button

2. **Create the User Flow**:
   - You should see **"Sign up and sign in"** as text (this is already selected)
   - **No version dropdown needed** - the system will use the recommended version
   - Simply click **"Create"** or **"Next"** button to proceed

3. **Configure Basic Settings**:
   - **Name**: Enter `TopVitaminSupplies-SignUpSignIn`
   - **Identity providers**: 
     - ✅ Check **"Local accounts"** (email/password - this will be the DEFAULT)
     - ✅ Check **"Email signup"** (if available)
     - ✅ Check **"Google"** (if you added it in Step 2)
     - ✅ Check **"Facebook"** (if you added it in Step 2)
     - ✅ Check **"LinkedIn"** (if you added it in Step 2)
     - ❌ **DO NOT** check any Microsoft work account options

4. **Configure User Attributes** (what to collect during signup):
   - Click **"Show more..."** to see all options
   - Select these attributes:
     - ✅ **Email Address** (required - should be pre-selected)
     - ✅ **Given Name**
     - ✅ **Surname** 
     - ✅ **Display Name**
     - ✅ **Job Title** (optional)
     - ✅ **Company Name** (optional)
   - Leave others unchecked unless needed

5. **Configure Application Claims** (what to return to your app):
   - Select these claims:
     - ✅ **Email Addresses**
     - ✅ **Given Name**
     - ✅ **Surname**
     - ✅ **Display Name**
     - ✅ **User's Object ID**
     - ✅ **Identity Provider**
   - Leave others unchecked unless needed

6. **Click "Create"** (blue button at bottom)

7. **Wait for creation** - you'll see a notification when complete

### **✅ Step 1 Verification**
You should now see 1 user flow in your list:
- `TopVitaminSupplies-SignUpSignIn`

**Note**: This single user flow handles:
- ✅ **Sign up** (account creation)
- ✅ **Sign in** (login)
- ✅ **Password reset** (built-in functionality)
- ✅ **Profile management** (handled through the same flow)

---

## 🎯 **Step 1.5: Configure Social Login Display Order (5 minutes)**

**IMPORTANT**: After creating your user flow, you need to configure how the login options appear to users.

### **1.5.1 Go to Your User Flow**
1. **Navigate back to your user flow**: `TopVitaminSupplies-SignUpSignIn`
2. **Click on the user flow name** to open its configuration

### **1.5.2 Configure Identity Provider Order**
1. **Go to "Identity providers" section** in the left sidebar
2. **Click on "Identity providers"**
3. **You should see a list of enabled providers**
4. **Note**: Identity providers are NOT draggable in External Identities
5. **The order is typically determined by**:
   - **Microsoft Entra ID** (always first - cannot be unchecked)
   - **Google** (if enabled)
   - **Facebook** (if enabled) 
   - **LinkedIn** (if enabled)
6. **Local accounts** (email/password) are handled automatically - not a separate provider

### **1.5.3 Configure Login Page Layout**
1. **Go to "Page layouts" or "Customize" section**
2. **Look for "Sign-in page" or "Unified sign-in page"**
3. **Configure the layout to show**:
   - **Social providers prominently** (Google, Facebook, LinkedIn buttons)
   - **Email/password form** as the primary option
4. **Note**: Microsoft Entra ID will always be present but can be configured to show personal accounts only

### **1.5.4 Save Configuration**
1. **Click "Save"** to apply all changes

**Result**: Users will see:
- **Microsoft Entra ID** (personal accounts only - not work accounts)
- **Social login buttons** (Google, Facebook, LinkedIn)
- **Email/password form** for local account creation
- **Note**: Microsoft Entra ID cannot be removed but can be configured for personal accounts only

---

## 🔗 **Step 2: Configure Identity Providers (10 minutes)**

### **2.1 Navigate to Identity Providers**

**Option A: Through Menu**
1. In the External Identities menu, click **"Identity providers"**

**Option B: Direct Link**
1. Go to: **https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ExternalIdentitiesMenuBlade/~/IdentityProviders**

### **2.2 Add Google Identity Provider**

1. **Click** the **"+ New identity provider"** button

2. **Select Provider Type**:
   - Click on **"Google"** tile

3. **Configure Google Settings**:
   - **Name**: `Google` (default is fine)
   - **Client ID**: `123456789-abcdefghijklmnop.apps.googleusercontent.com`
   - **Client Secret**: `GOCSPX-placeholder_google_client_secret`

4. **Click "Save"**

5. **Wait for confirmation** - you'll see Google appear in your identity providers list

### **2.3 Add Facebook Identity Provider**

1. **Click** the **"+ New identity provider"** button again

2. **Select Provider Type**:
   - Click on **"Facebook"** tile

3. **Configure Facebook Settings**:
   - **Name**: `Facebook` (default is fine)
   - **App ID**: `1234567890123456`
   - **App Secret**: `facebook_client_secret_placeholder`

4. **Click "Save"**

### **2.4 Add LinkedIn Identity Provider**

1. **Click** the **"+ New identity provider"** button again

2. **Select Provider Type**:
   - Click on **"LinkedIn"** tile

3. **Configure LinkedIn Settings**:
   - **Name**: `LinkedIn` (default is fine)
   - **Client ID**: `1234567890abcdef`
   - **Client Secret**: `linkedin_client_secret_placeholder`

4. **Click "Save"**

### **✅ Step 2 Verification**
You should now see 3 identity providers in your list:
- Google
- Facebook
- LinkedIn

---

## ⚙️ **Step 3: Configure User Flow Identity Providers (5 minutes)**

### **3.1 Navigate Back to User Flows**
1. Go to: **https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ExternalIdentitiesMenuBlade/~/UserFlows**

### **3.2 Configure Sign-up/Sign-in Flow Identity Providers**

1. **Click** on your user flow: **`TopVitaminSupplies-SignUpSignIn`**

2. **Navigate to Identity Providers**:
   - In the left sidebar menu, click **"Identity providers"**

3. **Configure Identity Providers**:
   - You'll see a list of available identity providers
   - **Enable these providers** (check the boxes):
     - ✅ **Local accounts** (should already be checked)
     - ✅ **Google**
     - ✅ **Facebook**
     - ✅ **LinkedIn**
   - **Disable these providers** (uncheck if checked):
     - ❌ **Microsoft Account** (if present)
     - ❌ **Azure Active Directory** (if present)
     - ❌ Any other Microsoft-related providers

4. **Click "Save"** (important - don't forget this step!)

5. **Wait for confirmation** - you should see a success message

### **3.3 Verify Configuration**
After saving, you should see:
- **4 identity providers enabled**: Local accounts, Google, Facebook, LinkedIn
- **0 Microsoft providers enabled**

---

## 🔗 **Step 4: Associate User Flow with Application (2 minutes)**

### **4.1 Link User Flow to Your Application**

1. **Stay in your user flow**: `TopVitaminSupplies-SignUpSignIn`

2. **Navigate to Applications**:
   - In the left sidebar menu, click **"Applications"**

3. **Add Your Application**:
   - Click **"+ Add application"** button
   - You'll see a list of applications in your tenant
   - **Find and select**: `Top Vitamin Supplies CIAM`
     - App ID should show: `671a313a-1698-4a50-bd15-38acac5a66c3`
   - Click **"Add"**

4. **Verify Association**:
   - You should see your application listed
   - Status should show as "Added" or similar

---

## 🧪 **Step 5: Test Your Configuration (3 minutes)**

### **5.1 Test the User Flow**

1. **Stay in your user flow**: `TopVitaminSupplies-SignUpSignIn`

2. **Navigate to Overview**:
   - In the left sidebar menu, click **"Overview"**

3. **Find the Test Option** (try these locations):
   
   **Option A: Look for "Run user flow" button**:
   - Should be at the top of the user flow overview page
   - Might be labeled as "Test user flow" or "Run now"
   
   **Option B: If no "Run user flow" button, look for**:
   - **"Test"** tab in the left sidebar
   - **"Properties"** section with a test link
   - **"Overview"** section with a test URL
   
   **Option C: Manual URL Test**:
   - Copy this URL and paste it in a new browser tab:
   ```
   https://login.microsoftonline.com/2a81f801-dae3-49fc-9d8f-fa35786c0087/oauth2/v2.0/authorize?p=TopVitaminSupplies-SignUpSignIn&client_id=671a313a-1698-4a50-bd15-38acac5a66c3&nonce=defaultNonce&redirect_uri=https://local.topvitaminsupply.com/auth/callback&scope=openid&response_type=code&prompt=login
   ```

4. **Verify Login Page**:
   - A new tab/window should open with your login page
   - **You should see**:
     - ✅ **Microsoft Entra ID** (personal accounts - @gmail.com, @hotmail.com, etc.)
     - ✅ **"Sign in with Google"** button with Google logo
     - ✅ **"Sign in with Facebook"** button with Facebook logo
     - ✅ **"Sign in with LinkedIn"** button with LinkedIn logo
     - ✅ **Email and password fields** for local account creation
     - ✅ **"Create account"** or "Sign up" link/button
   - **Note**: Microsoft Entra ID will be present but should show personal accounts only

5. **Close the test window** (don't complete the login - just verify the buttons appear)

### **✅ Step 5 Verification**

**If you can't find a "Run user flow" button, that's normal for External Identities!**

**Alternative Testing Methods:**

1. **Direct URL Test** (Recommended):
   - Open a new incognito/private browser window
   - Paste this URL:
   ```
   https://login.microsoftonline.com/2a81f801-dae3-49fc-9d8f-fa35786c0087/oauth2/v2.0/authorize?p=TopVitaminSupplies-SignUpSignIn&client_id=671a313a-1698-4a50-bd15-38acac5a66c3&nonce=defaultNonce&redirect_uri=https://local.topvitaminsupply.com/auth/callback&scope=openid&response_type=code&prompt=login
   ```
   - You should see the login page with social buttons

2. **Check User Flow Status**:
   - In your user flow overview, look for status indicators
   - Should show "Active" or "Enabled"

3. **Verify Configuration**:
   - Go to Identity providers section - should show Google, Facebook, LinkedIn
   - Go to Applications section - should show your app is associated

**Success Criteria**: If the direct URL shows social login buttons and local account options without Microsoft work account login, your configuration is successful!

---

## 🎉 **Step 6: Get Your Production URLs**

### **6.1 Your Ready-to-Use URL**

Copy this URL for use in your application:

**Single User Flow URL (handles sign-up, sign-in, and password reset):**
```
https://login.microsoftonline.com/2a81f801-dae3-49fc-9d8f-fa35786c0087/oauth2/v2.0/authorize?p=TopVitaminSupplies-SignUpSignIn&client_id=671a313a-1698-4a50-bd15-38acac5a66c3&nonce=defaultNonce&redirect_uri=https://local.topvitaminsupply.com/auth/callback&scope=openid&response_type=code&prompt=login
```

**This single URL provides:**
- ✅ **Sign up** (new account creation)
- ✅ **Sign in** (existing account login)  
- ✅ **Password reset** (forgot password functionality)
- ✅ **Social logins** (Google, Facebook, LinkedIn)

### **6.2 URL Parameters Explained**

- `p=TopVitaminSupplies-SignUpSignIn` - Your user flow name
- `client_id=671a313a-1698-4a50-bd15-38acac5a66c3` - Your application ID
- `redirect_uri=https://local.topvitaminsupply.com/auth/callback` - Where to redirect after login
- `scope=openid` - OIDC scope for authentication
- `response_type=code` - Authorization code flow
- `prompt=login` - Force login prompt

---

## 🔧 **Step 7: Replace Placeholder Credentials (Future Task)**

### **7.1 Google OAuth Setup**
When ready to use real Google authentication:

1. **Go to Google Cloud Console**: https://console.cloud.google.com
2. **Create a new project** or select existing project
3. **Enable Google+ API**
4. **Create OAuth 2.0 credentials**:
   - Application type: Web application
   - Authorized redirect URIs: Add your Azure B2C redirect URI
5. **Copy Client ID and Client Secret**
6. **Update in Azure Portal**:
   - Go to Identity Providers > Google
   - Replace placeholder values with real credentials

### **7.2 Facebook App Setup**
When ready to use real Facebook authentication:

1. **Go to Facebook Developers**: https://developers.facebook.com
2. **Create a new app**
3. **Add Facebook Login product**
4. **Configure OAuth redirect URIs**
5. **Copy App ID and App Secret**
6. **Update in Azure Portal**:
   - Go to Identity Providers > Facebook
   - Replace placeholder values with real credentials

### **7.3 LinkedIn App Setup**
When ready to use real LinkedIn authentication:

1. **Go to LinkedIn Developers**: https://www.linkedin.com/developers
2. **Create a new app**
3. **Add Sign In with LinkedIn product**
4. **Configure OAuth redirect URIs**
5. **Copy Client ID and Client Secret**
6. **Update in Azure Portal**:
   - Go to Identity Providers > LinkedIn
   - Replace placeholder values with real credentials

---

## ✅ **Final Verification Checklist**

### **Configuration Checklist**
- [ ] **3 User flows created**: Sign-up/Sign-in, Password Reset, Profile Editing
- [ ] **3 Identity providers added**: Google, Facebook, LinkedIn (with placeholder credentials)
- [ ] **User flow identity providers configured**: 4 providers enabled (Local + 3 social)
- [ ] **Microsoft work accounts disabled**: No Microsoft providers enabled in user flow
- [ ] **Application associated**: User flow linked to Top Vitamin Supplies CIAM app
- [ ] **Test successful**: "Run user flow" shows social login buttons
- [ ] **URLs generated**: Ready-to-use authentication URLs available

### **Expected User Experience**
When users visit your authentication URL, they will see:
- ✅ **"Sign in with Google"** button (with Google branding)
- ✅ **"Sign in with Facebook"** button (with Facebook branding)
- ✅ **"Sign in with LinkedIn"** button (with LinkedIn branding)
- ✅ **Email and password fields** for local account creation
- ✅ **"Create account"** or "Sign up now" link
- ❌ **NO Microsoft work account options**

---

## 🆘 **Troubleshooting Guide**

### **Problem: Can't find External Identities**
**Solution**: 
- Ensure you have Azure AD Premium P1 or P2 license
- Check that External Identities is enabled in your tenant
- Try the direct links provided in this guide

### **Problem: Identity providers don't appear in user flow**
**Solution**:
- Verify identity providers were saved successfully
- Refresh the user flow page
- Check that you clicked "Save" after configuring identity providers in the user flow

### **Problem: "Run user flow" shows error**
**Solution**:
- Verify the application is properly associated with the user flow
- Check that redirect URL matches your application configuration
- Ensure user flow is in "Published" state (should be automatic)

### **Problem: Social login buttons don't appear**
**Solution**:
- Verify identity providers are enabled in the user flow (Step 3)
- Check that identity providers were created successfully (Step 2)
- Ensure you saved the user flow identity provider configuration

### **Problem: Microsoft work accounts still appear**
**Solution**:
- Go back to user flow > Identity providers
- Uncheck any Microsoft-related providers
- Save the configuration
- Test again with "Run user flow"

---

## 📞 **Support Resources**

### **Azure Documentation**
- [External Identities Documentation](https://docs.microsoft.com/en-us/azure/active-directory/external-identities/)
- [User Flows Guide](https://docs.microsoft.com/en-us/azure/active-directory-b2c/user-flow-overview)
- [Identity Providers Setup](https://docs.microsoft.com/en-us/azure/active-directory-b2c/add-identity-provider)

### **Quick Reference Links**
- **Azure Portal**: https://portal.azure.com
- **User Flows**: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ExternalIdentitiesMenuBlade/~/UserFlows
- **Identity Providers**: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ExternalIdentitiesMenuBlade/~/IdentityProviders
- **Custom Branding**: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ExternalIdentitiesMenuBlade/~/CustomBranding

---

## 🎯 **Success Criteria**

### **You've successfully completed the setup when:**
1. ✅ All 3 user flows are created and configured
2. ✅ All 3 identity providers are added and working
3. ✅ User flow shows 4 identity providers (Local + 3 social)
4. ✅ "Run user flow" test shows social login buttons
5. ✅ No Microsoft work account options are visible
6. ✅ URLs are generated and ready for your application

### **Final Result:**
Your External Identities configuration will provide users with:
- **Social login options** (Google, Facebook, LinkedIn)
- **Local account creation** with email/password
- **Password reset functionality**
- **Profile editing capabilities**
- **No Azure work account access** (as requested)

**Congratulations! Your External Identities setup is complete! 🎉**
