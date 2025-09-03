# Authentication Setup Guide - WorkWise SA

This guide provides comprehensive instructions for setting up Two-Factor Authentication (2FA) with WhatsApp and Single Sign-On (SSO) for WorkWise SA.

## 🚀 Overview

The authentication system includes:
- **Two-Factor Authentication (2FA)** with WhatsApp via Twilio Verify
- **Single Sign-On (SSO)** with Google, Facebook, Microsoft, and Apple
- **Enhanced Security** with Firebase Authentication
- **User Management** with comprehensive profile and security settings

## 📋 Prerequisites

- Firebase project with Authentication enabled
- Twilio account with Verify service
- Google Cloud Console project (for Google SSO)
- Node.js 18+ and npm
- Firebase CLI installed

## 🔧 Phase 1: Twilio Setup for 2FA

### Step 1: Create Twilio Account

1. **Sign up for Twilio**:
   - Go to [Twilio Console](https://console.twilio.com/)
   - Create a new account or sign in
   - Complete phone number verification

2. **Get Account Credentials**:
   - Navigate to **Dashboard**
   - Copy your **Account SID** and **Auth Token**
   - Keep these secure - you'll need them for Firebase Functions

### Step 2: Set Up Twilio Verify Service

1. **Create Verify Service**:
   - Go to **Explore Products** → **Verify**
   - Click **"Create a new Verify Service"**
   - Name it "WorkWiseSA 2FA"
   - Copy the **Service SID**

2. **Configure WhatsApp Channel**:
   - In your Verify Service, go to **Settings**
   - Enable **WhatsApp** channel
   - Link a Twilio phone number (sandbox available for testing)

### Step 3: Test Twilio Integration

Use the provided curl command to test:

```bash
curl 'https://verify.twilio.com/v2/Services/YOUR_SERVICE_SID/Verifications' -X POST \
--data-urlencode 'To=+270823982486' \
--data-urlencode 'Channel=whatsapp' \
-u YOUR_ACCOUNT_SID:YOUR_AUTH_TOKEN
```

## 🔧 Phase 2: Firebase Functions Setup

### Step 1: Install Dependencies

```bash
cd functions
npm install
```

### Step 2: Set Environment Variables

```bash
# Set Twilio credentials
firebase functions:config:set \
  twilio.accountsid="YOUR_ACCOUNT_SID" \
  twilio.authtoken="YOUR_AUTH_TOKEN" \
  twilio.verifysid="YOUR_VERIFY_SERVICE_SID"

# Deploy functions
firebase deploy --only functions
```

### Step 3: Test Functions

The following functions are available:

- `sendTwoFactorCode` - Send WhatsApp verification code
- `verifyTwoFactorCode` - Verify the code
- `enableTwoFactor` - Enable 2FA for user
- `disableTwoFactor` - Disable 2FA for user
- `getSecuritySettings` - Get user security settings
- `updateSecuritySettings` - Update security settings

## 🔧 Phase 3: Frontend Integration

### Step 1: Environment Variables

Create `.env` file in client directory:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id

# Stripe Configuration
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key

# Twilio Configuration (for testing)
REACT_APP_TWILIO_ACCOUNT_SID=your_account_sid
REACT_APP_TWILIO_VERIFY_SERVICE_SID=your_verify_service_sid
```

### Step 2: Firebase Authentication Setup

1. **Enable Authentication Providers**:
   - Go to Firebase Console → Authentication → Sign-in method
   - Enable **Email/Password**
   - Enable **Google** (configure OAuth consent screen)
   - Enable **Facebook** (add Facebook App ID and Secret)

2. **Configure OAuth Redirect URIs**:
   - Add your domain to authorized domains
   - Configure redirect URIs for each provider

### Step 3: Test Authentication Flow

1. **Access Enhanced Login**:
   - Navigate to `/enhanced-login`
   - Test email/password login
   - Test Google SSO
   - Test 2FA flow

## 🔧 Phase 4: Google SSO Setup

### Step 1: Google Cloud Console

1. **Create OAuth 2.0 Credentials**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth 2.0 Client ID**
   - Configure authorized origins and redirect URIs

2. **Configure OAuth Consent Screen**:
   - Set up OAuth consent screen
   - Add required scopes: `email`, `profile`
   - Configure authorized domains

### Step 2: Firebase Integration

1. **Add Google Provider**:
   - In Firebase Console → Authentication → Sign-in method
   - Enable Google provider
   - Add your Google OAuth client ID and secret

## 🔧 Phase 5: Testing & Validation

### Step 1: Test 2FA Flow

1. **Register/Login with Email**:
   - Create account or login
   - Enable 2FA in security settings
   - Test WhatsApp code sending

2. **Verify 2FA**:
   - Enter phone number
   - Receive WhatsApp code
   - Verify code entry
   - Confirm successful authentication

### Step 2: Test SSO Flow

1. **Google SSO**:
   - Click "Continue with Google"
   - Complete OAuth flow
   - Verify user creation/login

2. **Facebook SSO**:
   - Click "Continue with Facebook"
   - Complete OAuth flow
   - Verify user creation/login

### Step 3: Security Testing

1. **Test Security Features**:
   - Verify 2FA enforcement
   - Test session management
   - Validate token refresh
   - Check logout functionality

## 🔧 Phase 6: Production Deployment

### Step 1: Environment Configuration

1. **Production Environment Variables**:
   ```bash
   # Set production Twilio credentials
   firebase functions:config:set \
     twilio.accountsid="PROD_ACCOUNT_SID" \
     twilio.authtoken="PROD_AUTH_TOKEN" \
     twilio.verifysid="PROD_VERIFY_SERVICE_SID"
   ```

2. **Update Client Environment**:
   ```env
   # Production Firebase Configuration
   REACT_APP_FIREBASE_API_KEY=prod_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=prod_project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=prod_project_id
   ```

### Step 2: Deploy to Production

```bash
# Deploy Firebase Functions
firebase deploy --only functions

# Build and deploy client
cd client
npm run build
# Deploy to your hosting platform
```

## 🔧 Phase 7: Monitoring & Maintenance

### Step 1: Set Up Monitoring

1. **Firebase Analytics**:
   - Enable Firebase Analytics
   - Track authentication events
   - Monitor 2FA usage

2. **Twilio Monitoring**:
   - Set up Twilio webhooks
   - Monitor verification success rates
   - Track API usage and costs

### Step 2: Security Best Practices

1. **Regular Security Audits**:
   - Review authentication logs
   - Monitor for suspicious activity
   - Update dependencies regularly

2. **User Education**:
   - Provide 2FA setup guides
   - Educate users on security features
   - Offer support for authentication issues

## 📚 API Reference

### Authentication Service Methods

```typescript
// Sign in with email/password
await authService.signInWithEmail(email, password);

// Sign in with Google
await authService.signInWithGoogle();

// Send 2FA code
await authService.sendTwoFactorCode({ phoneNumber });

// Verify 2FA code
await authService.verifyTwoFactorCode({ phoneNumber, code });

// Enable/disable 2FA
await authService.enableTwoFactor(phoneNumber);
await authService.disableTwoFactor();
```

### Firebase Functions

```typescript
// Send verification code
const response = await sendTwoFactorCode({ phoneNumber });

// Verify code
const result = await verifyTwoFactorCode({ phoneNumber, code });

// Manage 2FA settings
await enableTwoFactor({ phoneNumber });
await disableTwoFactor();
```

## 🚨 Troubleshooting

### Common Issues

1. **Twilio Verification Fails**:
   - Check phone number format (+27XXXXXXXXX)
   - Verify Twilio credentials
   - Ensure WhatsApp channel is enabled

2. **Google SSO Not Working**:
   - Verify OAuth client configuration
   - Check authorized domains
   - Ensure Firebase project is linked

3. **2FA Code Not Received**:
   - Check phone number format
   - Verify Twilio account status
   - Check spam/blocked messages

### Debug Mode

Enable debug logging:

```typescript
// In development
localStorage.setItem('debug', 'auth:*');

// Check console for detailed logs
```

## 📞 Support

For technical support:
- Check Firebase Console logs
- Review Twilio Console for verification status
- Contact support with specific error messages
- Include user ID and timestamp for issues

## 🔄 Updates & Maintenance

### Regular Updates

1. **Dependencies**: Update Firebase, Twilio, and React dependencies monthly
2. **Security**: Review and update security settings quarterly
3. **Monitoring**: Check authentication metrics weekly

### Backup & Recovery

1. **User Data**: Regular backups of Firestore user data
2. **Configuration**: Document all environment variables
3. **Recovery**: Test disaster recovery procedures

---

This guide provides a complete setup for WorkWise SA's authentication system. Follow each phase carefully and test thoroughly before deploying to production.