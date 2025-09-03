# Facebook Authentication Setup Guide

This guide will help you set up Facebook authentication for your WorkWise SA application with proper status checking and callback handling.

## Prerequisites

1. A Facebook Developer account
2. A Facebook App created in the Facebook Developer Console
3. Firebase project with Facebook authentication enabled

## Step 1: Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" and then "Create App"
3. Choose "Consumer" as the app type
4. Fill in your app details and create the app

## Step 2: Configure Facebook App Settings

1. In your Facebook app dashboard, go to "Settings" > "Basic"
2. Note down your **App ID** and **App Secret**
3. Add your domain to "App Domains" (e.g., `localhost` for development, your production domain for production)
4. Go to "Facebook Login" > "Settings"
5. Add your OAuth redirect URIs:
   - Development: `http://localhost:3000/__/auth/handler`
   - Production: `https://yourdomain.com/__/auth/handler`

## Step 3: Update HTML Configuration

Update the Facebook SDK configuration in `client/index.html`:

```html
<script>
  window.fbAsyncInit = function() {
    FB.init({
      appId      : 'YOUR_FACEBOOK_APP_ID',        // Replace with your actual app ID
      cookie     : true,
      xfbml      : true,
      version    : 'v18.0'                        // Use the latest stable version
    });
      
    FB.AppEvents.logPageView();
    
    // Check login status on page load
    FB.getLoginStatus(function(response) {
      statusChangeCallback(response);
    });
  };

  // This function is called when someone finishes with the Login Button
  function checkLoginState() {
    FB.getLoginStatus(function(response) {
      statusChangeCallback(response);
    });
  }

  // This is called with the results from FB.getLoginStatus()
  function statusChangeCallback(response) {
    console.log('Facebook login status:', response);
    
    if (response.status === 'connected') {
      // Logged into your app and Facebook
      console.log('Welcome! Fetching your information....');
      FB.api('/me', function(response) {
        console.log('Good to see you, ' + response.name + '.');
        // Trigger custom event for app integration
        window.dispatchEvent(new CustomEvent('facebookLoginSuccess', {
          detail: {
            accessToken: response.accessToken,
            userID: response.userID
          }
        }));
      });
    } else if (response.status === 'not_authorized') {
      // The person is logged into Facebook, but not your app
      console.log('Please log into this app.');
    } else {
      // The person is not logged into Facebook
      console.log('Please log into Facebook.');
    }
  }

  (function(d, s, id){
     var js, fjs = d.getElementsByTagName(s)[0];
     if (d.getElementById(id)) {return;}
     js = d.createElement(s); js.id = id;
     js.src = "https://connect.facebook.net/en_US/sdk.js";
     fjs.parentNode.insertBefore(js, fjs);
   }(document, 'script', 'facebook-jssdk'));
</script>
```

## Step 4: Enable Facebook Authentication in Firebase

1. Go to your Firebase Console
2. Navigate to "Authentication" > "Sign-in method"
3. Click on "Facebook" in the list of providers
4. Enable Facebook authentication
5. Enter your Facebook App ID and App Secret
6. Save the configuration

## Step 5: Environment Variables (Optional)

For better security, you can store your Facebook app ID in environment variables:

1. Create a `.env` file in your client directory
2. Add: `VITE_FACEBOOK_APP_ID=your_app_id_here`
3. Update the HTML to use: `appId: import.meta.env.VITE_FACEBOOK_APP_ID || 'YOUR_FACEBOOK_APP_ID'`

## Step 6: Implementation Details

### Facebook Login Flow

The implementation includes:

1. **Status Checking**: Automatically checks Facebook login status on page load
2. **Proper Callbacks**: Handles all Facebook login states (connected, not_authorized, unknown)
3. **Access Token Management**: Properly manages Facebook access tokens for Firebase authentication
4. **Error Handling**: Comprehensive error handling for various failure scenarios

### Response Object Structure

The Facebook SDK provides a response object with the following structure:

```javascript
{
  status: 'connected', // or 'not_authorized' or 'unknown'
  authResponse: {
    accessToken: '...',      // Access token for API calls
    expiresIn: '...',        // Token expiration time
    signedRequest: '...',    // Signed parameter with user info
    userID: '...'            // Facebook user ID
  }
}
```

### Status Values

- **`connected`**: User is logged into Facebook and has authorized your app
- **`not_authorized`**: User is logged into Facebook but hasn't authorized your app
- **`unknown`**: User is not logged into Facebook or has logged out

## Step 7: Test the Integration

1. Start your development server
2. Navigate to the login or register page
3. Click the "Facebook" button
4. You should see the Facebook login popup
5. Complete the authentication flow
6. Check the browser console for status messages

## Troubleshooting

### Common Issues

1. **"App not configured" error**: Make sure your domain is added to the Facebook app settings
2. **"Invalid OAuth redirect URI"**: Verify the redirect URIs in your Facebook app settings
3. **"Facebook sign-in is not enabled"**: Ensure Facebook authentication is enabled in Firebase
4. **"Facebook SDK not loaded"**: Check if the Facebook SDK script is loading correctly
5. **Popup blocked**: Check if your browser is blocking popups for the site

### Debug Steps

1. Check the browser console for Facebook SDK messages
2. Verify the Facebook SDK is loading correctly (check Network tab)
3. Check Firebase console for authentication errors
4. Ensure your Facebook app is not in development mode (if testing with non-developer accounts)
5. Test the `FB.getLoginStatus()` function in the browser console

### Console Debugging

You can test Facebook SDK functions in the browser console:

```javascript
// Check login status
FB.getLoginStatus(function(response) { console.log(response); });

// Check if SDK is loaded
console.log('FB object:', FB);

// Check app configuration
console.log('FB app config:', FB.getAppId());
```

## Security Considerations

1. Never expose your Facebook App Secret in client-side code
2. Use environment variables for sensitive configuration
3. Implement proper server-side validation
4. Consider implementing additional security measures like CSRF protection
5. Validate Facebook access tokens on your backend

## Production Deployment

1. Update your Facebook app settings with your production domain
2. Ensure your production domain is added to the OAuth redirect URIs
3. Test the authentication flow in production
4. Monitor authentication logs for any issues
5. Set up proper error monitoring and logging

## Support

If you encounter issues:

1. Check the [Facebook Developer Documentation](https://developers.facebook.com/docs/)
2. Review [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
3. Check the browser console and Firebase console for error messages
4. Ensure all configuration steps have been completed correctly
5. Test with the Facebook SDK debugger in your app settings
