# Facebook App Configuration Guide for WorkWise SA

This guide provides all the required configuration fields for your Facebook app to meet Facebook's requirements for authentication and data handling.

## 📱 **Required Facebook App Configuration Fields**

### **1. App Domains**
Add these domains to your Facebook app settings:

**Development Environment:**
- `localhost`
- `127.0.0.1`

**Production Environment:**
- `workwise-sa.com` (replace with your actual domain)
- `www.workwise-sa.com` (replace with your actual domain)

### **2. Contact Email**
**Primary Contact Email:**
- `admin@workwise-sa.com` (replace with your actual contact email)

**Alternative Contact Emails:**
- `privacy@workwise-sa.com` (for privacy-related inquiries)
- `legal@workwise-sa.com` (for legal matters)
- `support@workwise-sa.com` (for general support)

### **3. Privacy Policy URL**
**Development:**
- `http://localhost:3000/privacy-policy`

**Production:**
- `https://workwise-sa.com/privacy-policy`

**Note:** This URL must be publicly accessible and contain a comprehensive privacy policy that covers:
- Data collection practices
- How data is used
- Data sharing policies
- User rights (access, correction, deletion)
- Contact information for privacy inquiries

### **4. Terms of Service URL**
**Development:**
- `http://localhost:3000/terms-of-service`

**Production:**
- `https://workwise-sa.com/terms-of-service`

**Note:** This URL must be publicly accessible and contain:
- User agreement terms
- Acceptable use policies
- User responsibilities
- Platform rules and guidelines
- Contact information for legal matters

### **5. User Data Deletion URL**
**Development:**
- `http://localhost:3000/user-data-deletion`

**Production:**
- `https://workwise-sa.com/user-data-deletion`

**Note:** This endpoint must:
- Allow users to request deletion of their personal data
- Process deletion requests within 30 days
- Provide confirmation of deletion
- Handle data deletion requests from Facebook users

## 🔧 **Facebook App Setup Steps**

### **Step 1: Create Facebook App**
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Choose "Consumer" as app type
4. Enter app name: "WorkWise SA"
5. Enter contact email: `admin@workwise-sa.com`

### **Step 2: Configure Basic Settings**
1. Go to "Settings" → "Basic"
2. **App Domains:** Add your domains
3. **Privacy Policy URL:** Add your privacy policy URL
4. **Terms of Service URL:** Add your terms of service URL
5. **User Data Deletion URL:** Add your data deletion URL

### **Step 3: Configure Facebook Login**
1. Go to "Facebook Login" → "Settings"
2. **Valid OAuth Redirect URIs:**
   - Development: `http://localhost:3000/__/auth/handler`
   - Production: `https://workwise-sa.com/__/auth/handler`

### **Step 4: App Review (Production)**
1. **Data Deletion Requirements:**
   - Implement data deletion endpoint
   - Process deletion requests within 30 days
   - Provide deletion confirmation
   - Handle Facebook user deletion requests

2. **Privacy Policy Requirements:**
   - Clear data collection practices
   - User rights explanation
   - Contact information
   - Data retention policies

3. **Terms of Service Requirements:**
   - User agreement terms
   - Platform rules
   - User responsibilities
   - Dispute resolution

## 📋 **Configuration Checklist**

- [ ] App domains configured (localhost for development, your domain for production)
- [ ] Contact email set to your business email
- [ ] Privacy Policy URL points to a working privacy policy page
- [ ] Terms of Service URL points to a working terms page
- [ ] User Data Deletion URL points to a working deletion request page
- [ ] OAuth redirect URIs configured for both development and production
- [ ] Facebook Login enabled in your app
- [ ] App submitted for review (if going to production)

## 🚨 **Important Notes**

### **Data Deletion Compliance**
- Facebook requires that you process data deletion requests within 30 days
- You must provide confirmation of deletion
- The deletion endpoint must be publicly accessible
- Consider implementing webhook support for Facebook deletion requests

### **Privacy Policy Requirements**
- Must be comprehensive and cover all data practices
- Should explain how Facebook data is used
- Must include user rights and contact information
- Should be written in clear, understandable language

### **Terms of Service Requirements**
- Must cover all platform usage
- Should include user responsibilities
- Must explain data handling practices
- Should include dispute resolution procedures

## 🔗 **URL Structure Summary**

```
Development URLs:
├── Privacy Policy: http://localhost:3000/privacy-policy
├── Terms of Service: http://localhost:3000/terms-of-service
└── Data Deletion: http://localhost:3000/user-data-deletion

Production URLs:
├── Privacy Policy: https://workwise-sa.com/privacy-policy
├── Terms of Service: https://workwise-sa.com/terms-of-service
└── Data Deletion: https://workwise-sa.com/user-data-deletion
```

## 📞 **Contact Information for Facebook App**

**Primary Contact:**
- Email: `admin@workwise-sa.com`
- Role: App Administrator

**Privacy Contact:**
- Email: `privacy@workwise-sa.com`
- Role: Privacy Officer

**Legal Contact:**
- Email: `legal@workwise-sa.com`
- Role: Legal Team

**Support Contact:**
- Email: `support@workwise-sa.com`
- Role: Customer Support

## ✅ **Verification Steps**

1. **Test Privacy Policy Page:**
   - Visit your privacy policy URL
   - Ensure it loads correctly
   - Verify all required sections are present

2. **Test Terms of Service Page:**
   - Visit your terms of service URL
   - Ensure it loads correctly
   - Verify all required sections are present

3. **Test Data Deletion Page:**
   - Visit your data deletion URL
   - Ensure the form works correctly
   - Verify deletion requests are processed

4. **Test Facebook Login:**
   - Use the Facebook auth test page (`/facebook-auth-test`)
   - Verify Facebook SDK loads correctly
   - Test login flow end-to-end

## 🆘 **Troubleshooting**

### **Common Issues:**
1. **"App not configured" error:** Check app domains and OAuth redirect URIs
2. **"Invalid OAuth redirect URI":** Verify redirect URIs in Facebook app settings
3. **Privacy policy not accessible:** Ensure the page is publicly accessible
4. **Data deletion not working:** Verify the endpoint is functional and accessible

### **Support Resources:**
- [Facebook Developer Documentation](https://developers.facebook.com/docs/)
- [Facebook App Review Guidelines](https://developers.facebook.com/docs/app-review/)
- [Facebook Data Deletion Requirements](https://developers.facebook.com/docs/development/data-deletion-requirements/)
