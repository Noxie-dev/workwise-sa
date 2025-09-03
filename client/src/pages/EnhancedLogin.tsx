import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Shield,
  Smartphone
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import EnhancedLoginForm from '@/components/auth/EnhancedLoginForm';
import { User } from 'firebase/auth';

/**
 * Enhanced Login Page Component
 * Handles complete authentication flow with 2FA and SSO
 */
const EnhancedLogin: React.FC = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !loading) {
      setLocation('/dashboard');
    }
  }, [user, loading, setLocation]);

  // Handle successful login
  const handleLoginSuccess = (user: User) => {
    setSuccess(true);
    setIsLoading(false);
    setError(null);
    
    toast({
      title: "Login Successful!",
      description: `Welcome back, ${user.displayName || user.email}`,
    });

    // Redirect to dashboard after a short delay
    setTimeout(() => {
      setLocation('/dashboard');
    }, 2000);
  };

  // Handle login error
  const handleLoginError = (error: string) => {
    setError(error);
    setIsLoading(false);
    setSuccess(false);
  };

  // Handle 2FA requirement
  const handleTwoFactorRequired = (phoneNumber: string) => {
    setIsLoading(false);
    toast({
      title: "2FA Required",
      description: "Please complete two-factor authentication to continue",
    });
  };

  // Handle back navigation
  const handleBack = () => {
    setLocation('/');
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show success state
  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Helmet>
          <title>Login Successful - WorkWise SA</title>
          <meta name="description" content="You have successfully logged in to WorkWise SA." />
        </Helmet>
        
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-success-light rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-success-dark" />
              </div>
              
              <div>
                <h1 className="text-2xl font-bold text-secondary-foreground mb-2">
                  Login Successful!
                </h1>
                <p className="text-muted-foreground">
                  You are being redirected to your dashboard...
                </p>
              </div>

              <Button 
                onClick={() => setLocation('/dashboard')}
                className="w-full bg-primary text-primary-foreground hover:bg-primary-hover"
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Sign In - WorkWise SA</title>
        <meta name="description" content="Sign in to your WorkWise SA account with secure authentication." />
      </Helmet>

      {/* Header */}
      <div className="bg-workwise-blue text-white py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
                <p className="text-workwise-yellow-light">
                  Sign in to continue your career journey
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-workwise-yellow" />
              <span className="text-sm">Secure Login</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 py-12">
        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-destructive bg-destructive-light">
            <XCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive-dark">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Login Form */}
        <EnhancedLoginForm
          onSuccess={handleLoginSuccess}
          onError={handleLoginError}
          onTwoFactorRequired={handleTwoFactorRequired}
          isLoading={isLoading}
        />

        {/* Security Features */}
        <div className="mt-8 space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-secondary-foreground mb-4">
              Security Features
            </h3>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
              <Smartphone className="w-5 h-5 text-primary" />
              <div>
                <h4 className="font-medium text-sm">Two-Factor Authentication</h4>
                <p className="text-xs text-muted-foreground">WhatsApp verification for added security</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
              <Shield className="w-5 h-5 text-primary" />
              <div>
                <h4 className="font-medium text-sm">Secure SSO</h4>
                <p className="text-xs text-muted-foreground">Sign in with Google for convenience</p>
              </div>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Need help signing in?
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation('/contact')}
            >
              Contact Support
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation('/help')}
            >
              Help Center
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedLogin;