import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, UserPlus, LogIn, Loader2 } from 'lucide-react';
import { Link } from 'wouter';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  message?: string;
  showSignUpPrompt?: boolean;
}

/**
 * Component that protects content behind authentication
 * Shows a sign-up prompt for unauthenticated users
 */
const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  fallback,
  message = "Please sign in to access this content",
  showSignUpPrompt = true
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="flex items-center space-x-2 text-muted">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showSignUpPrompt) {
      return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Authentication Required</CardTitle>
              <p className="text-muted text-sm mt-2">{message}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                <h3 className="font-medium text-sm mb-2">Join WorkWise SA to:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• View full job descriptions</li>
                  <li>• Apply for positions instantly</li>
                  <li>• Get personalized recommendations</li>
                  <li>• Track your applications</li>
                </ul>
              </div>
              
              <div className="flex flex-col space-y-3">
                <Link href="/register">
                  <Button className="w-full bg-primary hover:bg-primary/90" size="lg">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Free Account
                  </Button>
                </Link>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted">Or</span>
                  </div>
                </div>
                
                <Link href="/login">
                  <Button variant="outline" className="w-full" size="lg">
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <Lock className="w-12 h-12 text-muted mx-auto mb-4" />
          <p className="text-muted">{message}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;