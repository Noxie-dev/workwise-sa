import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  ArrowLeft, 
  CreditCard,
  Shield,
  Clock,
  MapPin
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import StripePaymentForm from '@/components/payment/StripePaymentForm';
import { PaymentResult, PaymentError } from '@/types/payment';

interface PaymentPageProps {
  amount?: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, string>;
}

/**
 * Payment Page Component
 * Handles the complete payment flow for WorkWise SA
 */
const PaymentPage: React.FC<PaymentPageProps> = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // State management
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'error'>('pending');
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [paymentError, setPaymentError] = useState<PaymentError | null>(null);
  const [orderDetails, setOrderDetails] = useState({
    amount: 2500, // R25.00 in cents
    currency: 'ZAR',
    description: 'WorkWise SA Premium Subscription',
    metadata: {
      plan: 'premium',
      duration: 'monthly'
    }
  });

  // Handle successful payment
  const handlePaymentSuccess = (result: PaymentResult) => {
    setPaymentStatus('success');
    setPaymentResult(result);
    
    toast({
      title: "Payment Successful!",
      description: "Your payment has been processed successfully. Welcome to WorkWise SA Premium!",
    });

    // Redirect to success page after 3 seconds
    setTimeout(() => {
      setLocation('/dashboard');
    }, 3000);
  };

  // Handle payment error
  const handlePaymentError = (error: PaymentError) => {
    setPaymentStatus('error');
    setPaymentError(error);
    
    toast({
      variant: "destructive",
      title: "Payment Failed",
      description: error.message || "An unexpected error occurred. Please try again.",
    });
  };

  // Handle payment processing start
  const handlePaymentProcessing = () => {
    setPaymentStatus('processing');
  };

  // Handle back navigation
  const handleBack = () => {
    setLocation('/pricing');
  };

  // Render success state
  if (paymentStatus === 'success' && paymentResult) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Helmet>
          <title>Payment Successful - WorkWise SA</title>
          <meta name="description" content="Your payment has been processed successfully." />
        </Helmet>
        
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-success-light rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-success-dark" />
              </div>
              
              <div>
                <h1 className="text-2xl font-bold text-secondary-foreground mb-2">
                  Payment Successful!
                </h1>
                <p className="text-muted-foreground">
                  Your payment has been processed successfully. You now have access to WorkWise SA Premium features.
                </p>
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Amount Paid:</span>
                  <span className="font-semibold">
                    {new Intl.NumberFormat('en-ZA', {
                      style: 'currency',
                      currency: orderDetails.currency
                    }).format(orderDetails.amount / 100)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Payment ID:</span>
                  <span className="font-mono text-xs">{paymentResult.paymentIntent?.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge className="bg-success text-success-foreground">
                    {paymentResult.paymentIntent?.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Button 
                  onClick={() => setLocation('/dashboard')}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary-hover"
                >
                  Go to Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setLocation('/profile')}
                  className="w-full"
                >
                  Manage Subscription
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                You will be redirected to your dashboard automatically in a few seconds.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render error state
  if (paymentStatus === 'error' && paymentError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Helmet>
          <title>Payment Failed - WorkWise SA</title>
          <meta name="description" content="Your payment could not be processed." />
        </Helmet>
        
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-destructive-light rounded-full flex items-center justify-center">
                <XCircle className="w-8 h-8 text-destructive-dark" />
              </div>
              
              <div>
                <h1 className="text-2xl font-bold text-secondary-foreground mb-2">
                  Payment Failed
                </h1>
                <p className="text-muted-foreground">
                  {paymentError.message || "An unexpected error occurred. Please try again."}
                </p>
              </div>

              <Alert className="border-destructive bg-destructive-light">
                <XCircle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-destructive-dark">
                  <strong>Error Code:</strong> {paymentError.code || 'Unknown'}<br />
                  <strong>Type:</strong> {paymentError.type || 'Unknown'}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Button 
                  onClick={() => setPaymentStatus('pending')}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary-hover"
                >
                  Try Again
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleBack}
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Pricing
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render main payment form
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Complete Payment - WorkWise SA</title>
        <meta name="description" content="Complete your WorkWise SA Premium subscription payment." />
      </Helmet>

      {/* Header */}
      <div className="bg-workwise-blue text-white py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Complete Your Purchase</h1>
              <p className="text-workwise-yellow-light">
                Secure payment powered by Stripe
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-workwise-yellow" />
              <span className="text-sm">SSL Secured</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <Button 
                variant="outline" 
                onClick={handleBack}
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Pricing
              </Button>
            </div>

            <StripePaymentForm
              amount={orderDetails.amount}
              currency={orderDetails.currency}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              description={orderDetails.description}
              metadata={orderDetails.metadata}
            />
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Plan Details */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Plan:</span>
                    <span className="font-semibold">Premium Monthly</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Duration:</span>
                    <span>1 Month</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Billing:</span>
                    <span>Monthly</span>
                  </div>
                </div>

                <hr className="border-border" />

                {/* Pricing */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Premium Subscription</span>
                    <span>{new Intl.NumberFormat('en-ZA', {
                      style: 'currency',
                      currency: orderDetails.currency
                    }).format(orderDetails.amount / 100)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>VAT (15%)</span>
                    <span>{new Intl.NumberFormat('en-ZA', {
                      style: 'currency',
                      currency: orderDetails.currency
                    }).format((orderDetails.amount * 0.15) / 100)}</span>
                  </div>
                </div>

                <hr className="border-border" />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{new Intl.NumberFormat('en-ZA', {
                    style: 'currency',
                    currency: orderDetails.currency
                  }).format((orderDetails.amount * 1.15) / 100)}</span>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">What's Included:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      Unlimited job applications
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      AI-powered cover letter generation
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      Advanced job search filters
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      Priority customer support
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      Resume optimization tools
                    </li>
                  </ul>
                </div>

                {/* Security Notice */}
                <Alert className="bg-info-light border-info">
                  <Shield className="h-4 w-4 text-info-dark" />
                  <AlertDescription className="text-info-dark text-xs">
                    Your payment is processed securely by Stripe. We never store your card details.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;