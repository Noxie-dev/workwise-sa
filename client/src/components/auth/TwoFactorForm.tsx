import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Loader2,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/services/authService';
import { TwoFactorFormProps, PhoneNumberValidationResult } from '@/types/auth';

interface TwoFactorFormData {
  phoneNumber: string;
  verificationCode: string;
}

/**
 * Two-Factor Authentication Form Component
 * Handles WhatsApp 2FA verification flow
 */
const TwoFactorForm: React.FC<TwoFactorFormProps> = ({
  phoneNumber: initialPhoneNumber,
  onCodeSent,
  onVerificationComplete,
  onError,
  isLoading = false
}) => {
  const { toast } = useToast();
  const [step, setStep] = useState<'phone' | 'verification' | 'success'>('phone');
  const [isLoadingStep, setIsLoadingStep] = useState(false);
  const [verificationSid, setVerificationSid] = useState<string | null>(null);
  const [phoneValidation, setPhoneValidation] = useState<PhoneNumberValidationResult | null>(null);
  const [countdown, setCountdown] = useState(0);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<TwoFactorFormData>({
    defaultValues: {
      phoneNumber: initialPhoneNumber || '',
      verificationCode: ''
    },
    mode: 'onChange'
  });

  const watchedPhoneNumber = watch('phoneNumber');

  // Validate phone number on change
  useEffect(() => {
    if (watchedPhoneNumber) {
      const validation = authService.validatePhoneNumber(watchedPhoneNumber);
      setPhoneValidation(validation);
    }
  }, [watchedPhoneNumber]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Handle phone number submission
  const handlePhoneSubmit = async (data: TwoFactorFormData) => {
    if (!phoneValidation?.isValid) {
      toast({
        variant: "destructive",
        title: "Invalid Phone Number",
        description: phoneValidation?.errors.join(', ') || "Please enter a valid phone number",
      });
      return;
    }

    setIsLoadingStep(true);
    try {
      const response = await authService.sendTwoFactorCode({
        phoneNumber: phoneValidation.formatted,
        userId: authService.getCurrentUser()?.uid
      });

      if (response.success) {
        setVerificationSid(response.verificationSid || '');
        setStep('verification');
        setCountdown(60); // 60 second countdown
        onCodeSent(response.verificationSid || '');
        
        toast({
          title: "Code Sent!",
          description: `Verification code sent to ${authService.formatPhoneNumber(phoneValidation.formatted)}`,
        });
      } else {
        throw new Error(response.message || 'Failed to send verification code');
      }
    } catch (error: any) {
      console.error('Send 2FA code error:', error);
      onError(error.message || 'Failed to send verification code');
      
      toast({
        variant: "destructive",
        title: "Failed to Send Code",
        description: error.message || "Please try again",
      });
    } finally {
      setIsLoadingStep(false);
    }
  };

  // Handle verification code submission
  const handleVerificationSubmit = async (data: TwoFactorFormData) => {
    if (!phoneValidation?.formatted) {
      onError('Phone number is required');
      return;
    }

    setIsLoadingStep(true);
    try {
      const response = await authService.verifyTwoFactorCode({
        phoneNumber: phoneValidation.formatted,
        code: data.verificationCode,
        verificationSid: verificationSid || undefined
      });

      if (response.success && response.verified) {
        setStep('success');
        onVerificationComplete(true);
        
        toast({
          title: "Verification Successful!",
          description: "Two-factor authentication completed successfully",
        });
      } else {
        throw new Error(response.message || 'Invalid verification code');
      }
    } catch (error: any) {
      console.error('Verify 2FA code error:', error);
      onError(error.message || 'Invalid verification code');
      
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error.message || "Please check your code and try again",
      });
    } finally {
      setIsLoadingStep(false);
    }
  };

  // Handle resend code
  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    setIsLoadingStep(true);
    try {
      const response = await authService.sendTwoFactorCode({
        phoneNumber: phoneValidation?.formatted || '',
        userId: authService.getCurrentUser()?.uid
      });

      if (response.success) {
        setCountdown(60);
        toast({
          title: "Code Resent!",
          description: "A new verification code has been sent",
        });
      } else {
        throw new Error(response.message || 'Failed to resend code');
      }
    } catch (error: any) {
      console.error('Resend code error:', error);
      toast({
        variant: "destructive",
        title: "Failed to Resend",
        description: error.message || "Please try again",
      });
    } finally {
      setIsLoadingStep(false);
    }
  };

  // Handle back to phone step
  const handleBackToPhone = () => {
    setStep('phone');
    setVerificationSid(null);
    setCountdown(0);
  };

  if (step === 'success') {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-success-light rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-success-dark" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-secondary-foreground mb-2">
                Verification Complete!
              </h3>
              <p className="text-muted-foreground">
                Your two-factor authentication has been set up successfully.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-secondary-foreground">
          <Smartphone className="w-5 h-5 text-primary" />
          Two-Factor Authentication
        </CardTitle>
      </CardHeader>
      <CardContent>
        {step === 'phone' ? (
          <form onSubmit={handleSubmit(handlePhoneSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="phoneNumber" className="text-sm font-medium text-secondary-foreground">
                Phone Number*
              </Label>
              <Controller
                name="phoneNumber"
                control={control}
                rules={{
                  required: 'Phone number is required',
                  validate: (value) => {
                    const validation = authService.validatePhoneNumber(value);
                    return validation.isValid || validation.errors.join(', ');
                  }
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="phoneNumber"
                    placeholder="+27 82 123 4567"
                    className={`mt-1 ${errors.phoneNumber ? 'border-destructive' : ''}`}
                    disabled={isLoading || isLoadingStep}
                  />
                )}
              />
              {errors.phoneNumber && (
                <p className="text-sm text-destructive mt-1">{errors.phoneNumber.message}</p>
              )}
              {phoneValidation && !phoneValidation.isValid && (
                <div className="mt-2 space-y-1">
                  {phoneValidation.errors.map((error, index) => (
                    <p key={index} className="text-sm text-destructive">{error}</p>
                  ))}
                </div>
              )}
              {phoneValidation && phoneValidation.isValid && (
                <div className="mt-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-sm text-success-dark">
                    {phoneValidation.country} number
                  </span>
                </div>
              )}
            </div>

            <Alert className="bg-info-light border-info">
              <MessageSquare className="h-4 w-4 text-info-dark" />
              <AlertDescription className="text-info-dark text-sm">
                We'll send a verification code to your WhatsApp number. Make sure you have WhatsApp installed and active.
              </AlertDescription>
            </Alert>

            <Button
              type="submit"
              disabled={!phoneValidation?.isValid || isLoading || isLoadingStep}
              className="w-full bg-primary text-primary-foreground hover:bg-primary-hover"
            >
              {isLoadingStep ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending Code...
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send WhatsApp Code
                </>
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmit(handleVerificationSubmit)} className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleBackToPhone}
                disabled={isLoading || isLoadingStep}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Badge variant="outline" className="text-xs">
                {authService.formatPhoneNumber(phoneValidation?.formatted || '')}
              </Badge>
            </div>

            <div>
              <Label htmlFor="verificationCode" className="text-sm font-medium text-secondary-foreground">
                Verification Code*
              </Label>
              <Controller
                name="verificationCode"
                control={control}
                rules={{
                  required: 'Verification code is required',
                  pattern: {
                    value: /^\d{6}$/,
                    message: 'Code must be 6 digits'
                  }
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="verificationCode"
                    placeholder="123456"
                    maxLength={6}
                    className={`mt-1 text-center text-lg tracking-widest ${errors.verificationCode ? 'border-destructive' : ''}`}
                    disabled={isLoading || isLoadingStep}
                  />
                )}
              />
              {errors.verificationCode && (
                <p className="text-sm text-destructive mt-1">{errors.verificationCode.message}</p>
              )}
            </div>

            <Alert className="bg-info-light border-info">
              <MessageSquare className="h-4 w-4 text-info-dark" />
              <AlertDescription className="text-info-dark text-sm">
                Check your WhatsApp for a 6-digit verification code from WorkWise SA.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Button
                type="submit"
                disabled={!isValid || isLoading || isLoadingStep}
                className="w-full bg-primary text-primary-foreground hover:bg-primary-hover"
              >
                {isLoadingStep ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Verify Code
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleResendCode}
                disabled={countdown > 0 || isLoading || isLoadingStep}
                className="w-full"
              >
                {countdown > 0 ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resend in {countdown}s
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resend Code
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default TwoFactorForm;