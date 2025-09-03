import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { signInWithFacebook, checkFacebookLoginStatus } from '@/lib/firebase';

interface FacebookLoginButtonProps {
  onSuccess?: (user: any) => void;
  onError?: (error: any) => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const FacebookLoginButton: React.FC<FacebookLoginButtonProps> = ({
  onSuccess,
  onError,
  disabled = false,
  className = '',
  children = 'Continue with Facebook'
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [fbStatus, setFbStatus] = useState<string>('unknown');
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Check Facebook login status when component mounts
    checkFacebookLoginStatus().then((response) => {
      setFbStatus(response.status);
    });

    // Listen for Facebook login success events
    const handleFacebookLoginSuccess = (event: CustomEvent) => {
      console.log('Facebook login success event received:', event.detail);
      // This event is dispatched from the global Facebook SDK
    };

    window.addEventListener('facebookLoginSuccess', handleFacebookLoginSuccess as EventListener);

    return () => {
      window.removeEventListener('facebookLoginSuccess', handleFacebookLoginSuccess as EventListener);
    };
  }, []);

  const handleFacebookLogin = async () => {
    setIsLoading(true);
    try {
      const user = await signInWithFacebook();
      console.log('Facebook login successful:', user);
      
      // Show success message
      toast({
        title: "Login Successful",
        description: "Welcome! Redirecting to profile setup...",
      });
      
      if (onSuccess) {
        onSuccess(user);
      } else {
        // Default navigation to profile setup
        navigate('/profile-setup');
      }
    } catch (error: any) {
      console.error('Facebook login failed:', error);
      
      let errorMessage = "Failed to sign in with Facebook. Please try again.";
      
      // Handle specific error cases
      if (error.message?.includes('Facebook SDK not loaded')) {
        errorMessage = "Facebook login is not available. Please refresh the page and try again.";
      } else if (error.message?.includes('cancelled')) {
        errorMessage = "Facebook login was cancelled. Please try again.";
      } else if (error.message?.includes('failed')) {
        errorMessage = "Facebook login failed. Please check your Facebook account and try again.";
      }

      // Show error toast
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: errorMessage,
      });

      if (onError) {
        onError({ message: errorMessage, originalError: error });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      className={`w-full ${className}`}
      onClick={handleFacebookLogin}
      disabled={disabled || isLoading}
      type="button"
    >
      <i className="fab fa-facebook mr-2"></i>
      {isLoading ? 'Connecting...' : children}
    </Button>
  );
};

export default FacebookLoginButton;
