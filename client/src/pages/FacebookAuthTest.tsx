import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { checkFacebookLoginStatus, facebookLogout } from '@/lib/firebase';
import FacebookLoginButton from '@/components/FacebookLoginButton';

const FacebookAuthTest = () => {
  const [fbStatus, setFbStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setIsLoading(true);
    try {
      const status = await checkFacebookLoginStatus();
      setFbStatus(status);
      console.log('Facebook status:', status);
    } catch (error) {
      console.error('Error checking Facebook status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await facebookLogout();
      await checkStatus();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleLoginSuccess = (user: any) => {
    console.log('Login successful:', user);
    checkStatus();
  };

  const handleLoginError = (error: any) => {
    console.error('Login error:', error);
  };

  return (
    <>
      <Helmet>
        <title>Facebook Auth Test | WorkWise SA</title>
        <meta name="description" content="Test page for Facebook authentication setup" />
      </Helmet>

      <main className="flex-grow bg-light flex items-center justify-center py-10">
        <Card className="w-full max-w-2xl mx-4">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Facebook Authentication Test</CardTitle>
            <CardDescription className="text-center">
              Test and debug Facebook authentication setup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Display */}
            <div className="space-y-2">
              <h3 className="font-semibold">Current Facebook Status:</h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(fbStatus, null, 2)}
                </pre>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <div className="flex gap-4">
                <Button
                  onClick={checkStatus}
                  disabled={isLoading}
                  variant="outline"
                >
                  {isLoading ? 'Checking...' : 'Check Status'}
                </Button>
                
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="bg-red-50 text-red-700 hover:bg-red-100"
                >
                  Facebook Logout
                </Button>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Test Facebook Login:</h3>
                <FacebookLoginButton
                  onSuccess={handleLoginSuccess}
                  onError={handleLoginError}
                />
              </div>
            </div>

            {/* Debug Information */}
            <div className="space-y-2">
              <h3 className="font-semibold">Debug Information:</h3>
              <div className="p-4 bg-blue-50 rounded-lg text-sm">
                <p><strong>Facebook SDK Available:</strong> {typeof FB !== 'undefined' ? '✅ Yes' : '❌ No'}</p>
                <p><strong>Current URL:</strong> {window.location.href}</p>
                <p><strong>User Agent:</strong> {navigator.userAgent}</p>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-2">
              <h3 className="font-semibold">Testing Instructions:</h3>
              <div className="p-4 bg-green-50 rounded-lg text-sm space-y-2">
                <p>1. <strong>Check Status:</strong> Click to see current Facebook login status</p>
                <p>2. <strong>Test Login:</strong> Click the Facebook button to test authentication</p>
                <p>3. <strong>Check Console:</strong> Open browser console to see detailed logs</p>
                <p>4. <strong>Verify Firebase:</strong> Check Firebase console for authentication events</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
};

export default FacebookAuthTest;
