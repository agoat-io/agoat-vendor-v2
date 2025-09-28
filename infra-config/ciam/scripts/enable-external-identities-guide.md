# Enable Azure Entra ID External Identities

## Prerequisites

### 1. Azure AD Premium License Required
- **Azure AD Premium P1** or **P2** license is required
- External Identities is not available with free Azure AD

### 2. Admin Permissions
- You need **Global Administrator** or **External Identity User Flow Administrator** role
- Current tenant: `2a81f801-dae3-49fc-9d8f-fa35786c0087`
- Current subscription: `nonprod-topvitaminsupply-ciam` (42be4b47-f907-44a1-b14d-438fa5b9cbdc)

## Step-by-Step Guide to Enable External Identities

### Step 1: Check Current License Status
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **Overview**
3. Look for **External Identities** section
4. If you see "Get started" button, External Identities is not enabled
5. If you see "User flows" or "Identity providers", it's already enabled

### Step 2: Enable External Identities
1. In **Azure Active Directory** > **Overview**
2. Find the **External Identities** section
3. Click **"Get started"** or **"Enable External Identities"**
4. Follow the setup wizard

### Step 3: Verify External Identities is Enabled
After enabling, you should see:
- **User flows** option in the left menu
- **Identity providers** option in the left menu
- **Custom domains** option in the left menu

## Alternative: Check via Azure CLI

Once enabled, you can verify with:

```bash
# Check if External Identities commands are available
az ad external-identities user-flow list

# If this works, External Identities is enabled
```

## If External Identities is Not Available

### Option 1: Upgrade License
1. Go to **Azure Active Directory** > **Licenses**
2. Purchase **Azure AD Premium P1** or **P2**
3. Assign the license to your tenant
4. Wait 5-10 minutes for propagation
5. Try enabling External Identities again

### Option 2: Use Different Tenant
If you have another tenant with Premium licensing:
1. Switch to that tenant: `az login --tenant <other-tenant-id>`
2. Run the External Identities configuration script there
3. Update your application to use the new tenant

### Option 3: Create New Tenant with Premium
1. Create a new Azure AD tenant
2. Purchase Premium license
3. Enable External Identities
4. Configure your application

## Current Status Check

Your current tenant details:
- **Tenant ID**: `2a81f801-dae3-49fc-9d8f-fa35786c0087`
- **Subscription**: `nonprod-topvitaminsupply-ciam`
- **Domain**: Managed (not federated)
- **External Identities**: Not available (requires Premium license)

## Next Steps After Enabling

Once External Identities is enabled, you can:

1. **Run the original script**:
   ```bash
   ./configure-external-identities.sh
   ```

2. **Create user flows** for:
   - Sign-up and sign-in
   - Password reset
   - Profile editing

3. **Configure identity providers**:
   - Microsoft
   - Google
   - Facebook
   - LinkedIn
   - Other social providers

4. **Get social login URLs** that show:
   - "Sign in with Google" button
   - "Sign in with Facebook" button
   - "Sign in with Microsoft" button
   - "Create account" option

## Troubleshooting

### "External Identities is not available"
- **Cause**: No Azure AD Premium license
- **Solution**: Purchase Premium P1 or P2 license

### "You don't have permission"
- **Cause**: Insufficient admin role
- **Solution**: Get Global Administrator or External Identity User Flow Administrator role

### "Feature not found"
- **Cause**: Tenant doesn't support External Identities
- **Solution**: Use a different tenant or create new one with Premium

## Cost Information

- **Azure AD Premium P1**: ~$6/user/month
- **Azure AD Premium P2**: ~$9/user/month
- **External Identities**: Included with Premium licenses
- **Free tier**: Does not include External Identities

## Support Resources

- [Azure AD External Identities Documentation](https://docs.microsoft.com/en-us/azure/active-directory/external-identities/)
- [Azure AD Premium Features](https://azure.microsoft.com/en-us/pricing/details/active-directory/)
- [External Identities Setup Guide](https://docs.microsoft.com/en-us/azure/active-directory/external-identities/external-identities-get-started)
