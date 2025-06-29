# Email Link Authentication Guide

This guide explains how to set up and use Firebase Email Link Authentication (passwordless sign-in) in the WorkWise SA application.

## Overview

Email Link Authentication allows users to sign in by clicking a link sent to their email address, without needing to remember a password. This provides:

- Low-friction sign-up and sign-in experience
- Reduced security risks from password reuse
- Email verification as part of the authentication process
- Accessibility for users without social media accounts

## Setup Instructions

### 1. Enable Email Link Authentication in Firebase Console

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** > **Sign-in method**
4. Enable the **Email/Password** provider
5. Check the **Email link (passwordless sign-in)** option
6. Click **Save**

### 2. Add Authorized Domains

1. In the Firebase Console, go to **Authentication** > **Settings**
2. Under **Authorized domains**, add your application domains:
   - For local development: `localhost`
   - For production: Your actual domain (e.g., `workwisesa.co.za`)
   - For staging/testing: Any test domains you use

### 3. Configure Environment Variables

Add the following variables to your `.env` files:

```
# For mobile app integration (optional)
VITE_IOS_BUNDLE_ID=com.workwisesa.app
VITE_ANDROID_PACKAGE_NAME=com.workwisesa.app

# For Firebase Dynamic Links (optional)
VITE_FIREBASE_DYNAMIC_LINK_DOMAIN=your-dynamic-link-domain.page.link
```

## How It Works

### Sending the Sign-In Link

When a user requests to sign in with an email link:

1. The application calls `sendSignInLink(email)` function
2. Firebase sends an email with a secure sign-in link to the user
3. The email address is stored in localStorage for verification

```javascript
// Example usage
import { sendSignInLink } from '@/lib/firebase';

const handleSendLink = async (email) => {
  try {
    await sendSignInLink(email);
    // Show success message
  } catch (error) {
    // Handle error
  }
};
```

### Completing the Sign-In Process

When the user clicks the link in their email:

1. They are redirected to the application's sign-in completion page
2. The application verifies the link using `checkIfSignInWithEmailLink`
3. The email address is retrieved from localStorage or requested from the user
4. The sign-in is completed using `completeSignInWithEmailLink`

```javascript
// Example usage
import { 
  checkIfSignInWithEmailLink, 
  completeSignInWithEmailLink, 
  getEmailFromStorage 
} from '@/lib/firebase';

// Check if the current URL is a sign-in link
if (checkIfSignInWithEmailLink(window.location.href)) {
  // Get email from storage
  const email = getEmailFromStorage();
  
  if (email) {
    // Complete sign-in
    await completeSignInWithEmailLink(email, window.location.href);
    // Redirect to profile or dashboard
  } else {
    // Ask user for their email
  }
}
```

## Testing

You can test the email link authentication flow using the provided test script:

```bash
node scripts/test-email-link-auth.js your-test-email@example.com
```

## Troubleshooting

### Common Issues

1. **"auth/unauthorized-domain" error**
   - Make sure your domain is added to the authorized domains list in Firebase Console

2. **"auth/operation-not-allowed" error**
   - Ensure Email/Password provider and Email link sign-in method are enabled

3. **Link not working**
   - Check that the `actionCodeSettings.url` in `firebase.ts` points to the correct sign-in completion page
   - Verify that the route for the sign-in completion page is properly set up

4. **Email not received**
   - Check spam/junk folders
   - Verify the email address is correct
   - Ensure Firebase project has proper billing set up for sending emails

## Security Considerations

- Do not pass the user's email in URL parameters to prevent session injection attacks
- Always verify the email address matches the one the link was sent to
- Consider implementing rate limiting for email link requests
- Set appropriate expiration times for the email links

## References

- [Firebase Documentation: Email Link Authentication](https://firebase.google.com/docs/auth/web/email-link-auth)
- [Firebase Authentication Security Rules](https://firebase.google.com/docs/rules/basics#auth)
