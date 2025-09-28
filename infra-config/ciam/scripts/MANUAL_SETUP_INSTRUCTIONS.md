# Complete Manual Setup Instructions for External Identities

## 🎯 **Goal**
Configure Azure External Identities to show:
- ✅ "Sign in with Google" button
- ✅ "Sign in with Facebook" button  
- ✅ "Sign in with LinkedIn" button
- ✅ "Create Account" option with email/password
- ❌ NO Azure work account login (disabled)

## ⏱️ **Total Time: ~25 minutes**

---

## 📋 **Step 1: Create User Flows (5 minutes)**

### **1.1 Navigate to User Flows**
1. Go to: **https://portal.azure.com**
2. Navigate to: **Azure Active Directory** > **External Identities** > **User flows**
3. Or use direct link: **https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ExternalIdentitiesMenuBlade/~/UserFlows**

### **1.2 Create Sign-up and Sign-in Flow**
1. Click **"+ New user flow"**
2. Select **"Sign up and sign in"**
3. Version: **"Recommended"**
4. Click **"Create"**
5. **Name**: `TopVitaminSupplies-SignUpSignIn`
6. **Identity providers**: Select **"Local accounts"** (we'll add social providers later)
7. **User attributes**: Select these attributes to collect:
   - ✅ **Email Address** (required)
   - ✅ **Given Name**
   - ✅ **Surname**
   - ✅ **Display Name**
   - ✅ **Job Title** (optional)
   - ✅ **Company Name** (optional)
8. **Application claims**: Select these claims to return:
   - ✅ **Email Address**
   - ✅ **Given Name**
   - ✅ **Surname**
   - ✅ **Display Name**
   - ✅ **User's Object ID**
9. Click **"Create"**

### **1.3 Create Password Reset Flow**
1. Click **"+ New user flow"**
2. Select **"Password reset"**
3. Version: **"Recommended"**
4. **Name**: `TopVitaminSupplies-PasswordReset`
5. **Identity providers**: **"Local accounts"**
6. Click **"Create"**

### **1.4 Create Profile Editing Flow**
1. Click **"+ New user flow"**
2. Select **"Profile editing"**
3. Version: **"Recommended"**
4. **Name**: `TopVitaminSupplies-ProfileEditing`
5. **Identity providers**: **"Local accounts"**
6. **User attributes**: Select same as sign-up flow
7. Click **"Create"**

---

## 🔗 **Step 2: Configure Identity Providers (10 minutes)**

### **2.1 Navigate to Identity Providers**
1. Go to: **Azure Active Directory** > **External Identities** > **Identity providers**
2. Or use direct link: **https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ExternalIdentitiesMenuBlade/~/IdentityProviders**

### **2.2 Add Google Identity Provider**
1. Click **"+ New identity provider"**
2. Select **"Google"**
3. **Name**: `Google`
4. **Client ID**: `123456789-abcdefghijklmnop.apps.googleusercontent.com`
5. **Client Secret**: `GOCSPX-placeholder_google_client_secret`
6. Click **"Save"**

### **2.3 Add Facebook Identity Provider**
1. Click **"+ New identity provider"**
2. Select **"Facebook"**
3. **Name**: `Facebook`
4. **App ID**: `1234567890123456`
5. **App Secret**: `facebook_client_secret_placeholder`
6. Click **"Save"**

### **2.4 Add LinkedIn Identity Provider**
1. Click **"+ New identity provider"**
2. Select **"LinkedIn"**
3. **Name**: `LinkedIn`
4. **Client ID**: `1234567890abcdef`
5. **Client Secret**: `linkedin_client_secret_placeholder`
6. Click **"Save"**

---

## ⚙️ **Step 3: Configure User Flow Identity Providers (5 minutes)**

### **3.1 Configure Sign-up/Sign-in Flow**
1. Go back to **User flows**: **https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ExternalIdentitiesMenuBlade/~/UserFlows**
2. Click on: **`TopVitaminSupplies-SignUpSignIn`**
3. In the left menu, click **"Identity providers"**
4. **Enable these providers**:
   - ✅ **Local accounts** (Email)
   - ✅ **Google**
   - ✅ **Facebook**
   - ✅ **LinkedIn**
   - ❌ **Microsoft** (LEAVE UNCHECKED - no work accounts)
5. Click **"Save"**

### **3.2 Verify Configuration**
- You should see 4 identity providers enabled:
  - Local accounts (Email)
  - Google
  - Facebook  
  - LinkedIn
- Microsoft should NOT be enabled

---

## 🔗 **Step 4: Associate with Application (2 minutes)**

### **4.1 Link User Flow to Your App**
1. Stay in your user flow: **`TopVitaminSupplies-SignUpSignIn`**
2. In the left menu, click **"Applications"**
3. Click **"+ Add application"**
4. Find and select: **`Top Vitamin Supplies CIAM`** 
   - App ID: `671a313a-1698-4a50-bd15-38acac5a66c3`
5. Click **"Add"**

---

## 🧪 **Step 5: Test Your Configuration (2 minutes)**

### **5.1 Test the User Flow**
1. Stay in your user flow: **`TopVitaminSupplies-SignUpSignIn`**
2. In the left menu, click **"Overview"**
3. Click **"Run user flow"**
4. **Application**: Select `Top Vitamin Supplies CIAM`
5. **Reply URL**: `https://local.topvitaminsupply.com/auth/callback`
6. Click **"Run user flow"**

### **5.2 Verify What You See**
You should see a login page with:
- ✅ **"Sign in with Google"** button
- ✅ **"Sign in with Facebook"** button
- ✅ **"Sign in with LinkedIn"** button
- ✅ **"Create account"** option with email/password fields
- ❌ **NO Microsoft work account login**

---

## 🎉 **Step 6: Get Your URLs**

### **6.1 Your Ready-to-Use URLs**

**Sign-up/Sign-in Flow:**
```
https://login.microsoftonline.com/2a81f801-dae3-49fc-9d8f-fa35786c0087/oauth2/v2.0/authorize?p=TopVitaminSupplies-SignUpSignIn&client_id=671a313a-1698-4a50-bd15-38acac5a66c3&nonce=defaultNonce&redirect_uri=https://local.topvitaminsupply.com/auth/callback&scope=openid&response_type=code&prompt=login
```

**Password Reset Flow:**
```
https://login.microsoftonline.com/2a81f801-dae3-49fc-9d8f-fa35786c0087/oauth2/v2.0/authorize?p=TopVitaminSupplies-PasswordReset&client_id=671a313a-1698-4a50-bd15-38acac5a66c3&nonce=defaultNonce&redirect_uri=https://local.topvitaminsupply.com/auth/callback&scope=openid&response_type=code&prompt=login
```

---

## 🔧 **Step 7: Replace Placeholder Values (Later)**

### **7.1 Get Real OAuth Credentials**

**For Google:**
1. Go to: **https://console.cloud.google.com**
2. Create OAuth 2.0 credentials
3. Replace: `123456789-abcdefghijklmnop.apps.googleusercontent.com`
4. Replace: `GOCSPX-placeholder_google_client_secret`

**For Facebook:**
1. Go to: **https://developers.facebook.com**
2. Create a Facebook App
3. Replace: `1234567890123456`
4. Replace: `facebook_client_secret_placeholder`

**For LinkedIn:**
1. Go to: **https://www.linkedin.com/developers**
2. Create a LinkedIn App
3. Replace: `1234567890abcdef`
4. Replace: `linkedin_client_secret_placeholder`

---

## ✅ **Verification Checklist**

- [ ] **3 User flows created**: Sign-up/Sign-in, Password Reset, Profile Editing
- [ ] **3 Identity providers added**: Google, Facebook, LinkedIn
- [ ] **User flow configured** with 4 identity providers (Local + 3 social)
- [ ] **Microsoft work accounts disabled** (not selected)
- [ ] **Application associated** with user flow
- [ ] **"Run user flow" test** shows social login buttons
- [ ] **URLs generated** and ready to use

---

## 🎯 **Final Result**

After completing these steps, your External Identities will be fully configured with:

- ✅ **Social login buttons** (Google, Facebook, LinkedIn)
- ✅ **Local account creation** with email/password
- ✅ **Password reset functionality**
- ✅ **Profile editing capabilities**
- ✅ **OIDC support** with silent refresh
- ✅ **Full redirect** to login page support
- ✅ **Environment-specific domains**
- ❌ **Azure work accounts DISABLED** (as requested)

**Users will see exactly what you wanted**: Social login buttons and "Create Account" option, with NO Azure work account login!

---

## 🆘 **Troubleshooting**

### **If you don't see External Identities:**
- Ensure you have Azure AD Premium P1 or P2 license
- Check that External Identities is enabled in your tenant

### **If identity providers don't appear:**
- Make sure you saved the identity provider configuration
- Refresh the user flow page
- Check that the identity provider was created successfully

### **If "Run user flow" doesn't work:**
- Verify the application is associated with the user flow
- Check that the redirect URL matches your application configuration
- Ensure the user flow is published (should be automatic)

---

## 📞 **Support**

If you encounter issues:
1. Check the Azure Portal for error messages
2. Verify all steps were completed in order
3. Ensure placeholder values are properly configured
4. Test with "Run user flow" before using in your application
