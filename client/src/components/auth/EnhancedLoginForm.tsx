import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle,
  Smartphone,
  ArrowRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/services/authService';
import { LoginFormProps, SSO_PROVIDERS } from '@/types/auth';
import TwoFactorForm from './TwoFactorForm';
import SSOButton from './SSOButton';

interface LoginFormData {
  email: string;
  password: string;
}

/**
 * Enhanced Login Form Component
 * Handles email/password login, 2FA, and SSO
 */
const EnhancedLoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onError,
  onTwoFactorRequired,
  isLoading = false
}) => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoadingStep, setIsLoadingStep] = useState(false);
  const [currentStep, setCurrentStep] = useState<'login' | 'two-factor'>('login');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: ''
    },
    mode: 'onChange'
  });

  // Handle email/password login
  const handleEmailLogin = async (data: LoginFormData) => {
    setIsLoadingStep(true);
    try {
      const user = await authService.signInWithEmail(data.email, data.password);
      
      // Check if user has 2FA enabled
      const hasTwoFactor = await authService.hasTwoFactorEnabled(user.uid);
      
      if (hasTwoFactor) {
        setUserEmail(data.email);
        setCurrentStep('two-factor');
        onTwoFactorRequired(user.phoneNumber || '');
      } else {
        onSuccess(user);
        toast({
          title: "Login Successful!",
          description: `Welcome back, ${user.displayName || user.email}`,
        });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      onError(error.message || 'Login failed');
      
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Please check your credentials and try again",
      });
    } finally {
      setIsLoadingStep(false);
    }
  };

  // Handle SSO login
  const handleSSOLogin = async (user: any) => {
    try {
      onSuccess(user);
      toast({
        title: "Login Successful!",
        description: `Welcome, ${user.displayName || user.email}`,
      });
    } catch (error: any) {
      console.error('SSO login error:', error);
      onError(error.message || 'SSO login failed');
    }
  };

  // Handle 2FA completion
  const handleTwoFactorComplete = (success: boolean) => {
    if (success) {
      const user = authService.getCurrentUser();
      if (user) {
        onSuccess(user);
        toast({
          title: "Login Successful!",
          description: "Two-factor authentication completed",
        });
      }
    }
  };

  // Handle 2FA error
  const handleTwoFactorError = (error: string) => {
    onError(error);
    toast({
      variant: "destructive",
      title: "2FA Failed",
      description: error,
    });
  };

  // Handle 2FA code sent
  const handleTwoFactorCodeSent = (verificationSid: string) => {
    toast({
      title: "Code Sent!",
      description: "Please check your WhatsApp for the verification code",
    });
  };

  // Handle forgot password
  const handleForgotPassword = async () => {
    const email = (document.getElementById('email') as HTMLInputElement)?.value;
    if (!email) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter your email address first",
      });
      return;
    }

    try {
      await authService.resetPassword(email);
      toast({
        title: "Reset Email Sent",
        description: "Please check your email for password reset instructions",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: error.message || "Failed to send reset email",
      });
    }
  };

  // Handle back to login
  const handleBackToLogin = () => {
    setCurrentStep('login');
    setUserEmail('');
    setUserPhone('');
  };

  if (currentStep === 'two-factor') {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-secondary-foreground mb-2">
            Two-Factor Authentication
          </h2>
          <p className="text-muted-foreground">
            Please complete 2FA verification for {userEmail}
          </p>
        </div>
        
        <TwoFactorForm
          phoneNumber={userPhone}
          onCodeSent={handleTwoFactorCodeSent}
          onVerificationComplete={handleTwoFactorComplete}
          onError={handleTwoFactorError}
          isLoading={isLoading || isLoadingStep}
        />
        
        <Button
          variant="outline"
          onClick={handleBackToLogin}
          className="w-full"
        >
          Back to Login
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-secondary-foreground">
          Welcome Back
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* SSO Buttons */}
        <div className="space-y-3">
          {SSO_PROVIDERS.filter(provider => provider.enabled).map((provider) => (
            <SSOButton
              key={provider.id}
              provider={provider}
              onSuccess={handleSSOLogin}
              onError={onError}
              disabled={isLoading || isLoadingStep}
            />
          ))}
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit(handleEmailLogin)} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-sm font-medium text-secondary-foreground">
              Email Address*
            </Label>
            <Controller
              name="email"
              control={control}
              rules={{
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Invalid email format'
                }
              }}
              render={({ field }) => (
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    {...field}
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                    disabled={isLoading || isLoadingStep}
                  />
                </div>
              )}
            />
            {errors.email && (
              <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="password" className="text-sm font-medium text-secondary-foreground">
              Password*
            </Label>
            <Controller
              name="password"
              control={control}
              rules={{
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              }}
              render={({ field }) => (
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    {...field}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className={`pl-10 pr-10 ${errors.password ? 'border-destructive' : ''}`}
                    disabled={isLoading || isLoadingStep}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    disabled={isLoading || isLoadingStep}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              )}
            />
            {errors.password && (
              <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <Label htmlFor="remember-me" className="text-sm text-muted-foreground">
                Remember me
              </Label>
            </div>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-primary hover:text-primary-hover"
              disabled={isLoading || isLoadingStep}
            >
              Forgot password?
            </button>
          </div>

          <Button
            type="submit"
            disabled={!isValid || isLoading || isLoadingStep}
            className="w-full bg-primary text-primary-foreground hover:bg-primary-hover"
          >
            {isLoadingStep ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </form>

        {/* Sign Up Link */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => setLocation('/register')}
              className="text-primary hover:text-primary-hover font-medium"
            >
              Sign up
            </button>
          </p>
        </div>

        {/* Security Notice */}
        <Alert className="bg-info-light border-info">
          <AlertCircle className="h-4 w-4 text-info-dark" />
          <AlertDescription className="text-info-dark text-xs">
            Your account is protected with industry-standard security measures. 
            We may require two-factor authentication for additional security.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default EnhancedLoginForm;