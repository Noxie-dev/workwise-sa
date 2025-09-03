import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { loadStripe, Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PaymentFormData, PaymentResult, PaymentError } from '@/types/payment';
import BillingAddressForm from './BillingAddressForm';

// Stripe configuration
const STRIPE_PUBLISHABLE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx';

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

interface StripePaymentFormProps {
  amount: number;
  currency?: string;
  onSuccess: (result: PaymentResult) => void;
  onError: (error: PaymentError) => void;
  description?: string;
  metadata?: Record<string, string>;
}

interface PaymentFormInnerProps {
  amount: number;
  currency: string;
  onSuccess: (result: PaymentResult) => void;
  onError: (error: PaymentError) => void;
  description?: string;
  metadata?: Record<string, string>;
}

/**
 * Inner payment form component that uses Stripe hooks
 */
const PaymentFormInner: React.FC<PaymentFormInnerProps> = ({
  amount,
  currency,
  onSuccess,
  onError,
  description,
  metadata
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [billingAddress, setBillingAddress] = useState<any>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<{ name: string }>({
    defaultValues: {
      name: ''
    },
    mode: 'onChange'
  });

  // Handle card element changes
  const handleCardChange = (event: any) => {
    if (event.error) {
      setCardError(event.error.message);
    } else {
      setCardError(null);
    }
  };

  // Handle billing address submission
  const handleBillingAddressSubmit = (data: any) => {
    setBillingAddress(data);
    toast({
      title: "Billing Address Saved",
      description: "Your billing address has been saved successfully.",
    });
  };

  // Handle form submission
  const onSubmit = async (data: { name: string }) => {
    if (!stripe || !elements || !billingAddress) {
      toast({
        variant: "destructive",
        title: "Form Incomplete",
        description: "Please complete all required fields including billing address.",
      });
      return;
    }

    setIsLoading(true);
    setCardError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Create payment method
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: data.name,
          address: {
            line1: `${billingAddress.houseNumber} ${billingAddress.streetName}`,
            line2: billingAddress.apartmentNo || '',
            city: billingAddress.cityTown,
            state: billingAddress.province,
            postal_code: billingAddress.postalCode,
            country: 'ZA'
          }
        }
      });

      if (pmError) {
        throw pmError;
      }

      if (!paymentMethod) {
        throw new Error('Failed to create payment method');
      }

      // Here you would typically send the payment method to your server
      // For now, we'll simulate a successful payment
      const result: PaymentResult = {
        success: true,
        paymentIntent: {
          id: `pi_${Date.now()}`,
          amount: amount,
          currency: currency,
          status: 'succeeded',
          client_secret: `pi_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`
        }
      };

      toast({
        title: "Payment Successful",
        description: "Your payment has been processed successfully.",
      });

      onSuccess(result);

    } catch (error: any) {
      console.error('Payment error:', error);
      
      const paymentError: PaymentError = {
        type: error.type || 'card_error',
        code: error.code,
        message: error.message || 'An unexpected error occurred',
        decline_code: error.decline_code
      };

      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
      });

      onError(paymentError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Payment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-secondary-foreground">
            <CreditCard className="w-5 h-5 text-primary" />
            Complete Your Purchase
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Amount Display */}
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Amount</span>
                <span className="text-2xl font-bold text-secondary-foreground">
                  {new Intl.NumberFormat('en-ZA', {
                    style: 'currency',
                    currency: currency
                  }).format(amount / 100)}
                </span>
              </div>
              {description && (
                <p className="text-sm text-muted-foreground mt-2">{description}</p>
              )}
            </div>

            {/* Name on Card */}
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-secondary-foreground">
                Name on Card*
              </Label>
              <Controller
                name="name"
                control={control}
                rules={{
                  required: 'Name on card is required',
                  minLength: {
                    value: 2,
                    message: 'Name must be at least 2 characters'
                  }
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="name"
                    placeholder="Jane Doe"
                    className={`mt-1 ${errors.name ? 'border-destructive' : ''}`}
                  />
                )}
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Card Details */}
            <div>
              <Label className="text-sm font-medium text-secondary-foreground">
                Card Details*
              </Label>
              <div className="mt-1">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#1A202C',
                        fontFamily: '"Inter", sans-serif',
                        '::placeholder': {
                          color: '#718096',
                        },
                        padding: '12px',
                      },
                      invalid: {
                        color: '#E53E3E',
                      },
                    },
                    hidePostalCode: true, // We'll collect this in billing address
                  }}
                  onChange={handleCardChange}
                />
              </div>
              {cardError && (
                <Alert className="mt-2 border-destructive bg-destructive-light">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive-dark">
                    {cardError}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Billing Address */}
            <BillingAddressForm
              onSubmit={handleBillingAddressSubmit}
              disabled={isLoading}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={!stripe || !isValid || !billingAddress || isLoading}
              className="w-full bg-accent hover:bg-primary text-accent-foreground hover:text-primary-foreground font-semibold py-3 px-4 rounded-md transition duration-300"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay {new Intl.NumberFormat('en-ZA', {
                    style: 'currency',
                    currency: currency
                  }).format(amount / 100)}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="bg-info-light border-info">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-info-dark mt-0.5" />
            <div>
              <h4 className="font-medium text-info-dark mb-1">Secure Payment</h4>
              <p className="text-sm text-info-dark">
                Your payment information is encrypted and processed securely by Stripe. 
                We never store your card details on our servers.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Main Stripe Payment Form Component
 */
const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  amount,
  currency = 'ZAR',
  onSuccess,
  onError,
  description,
  metadata
}) => {
  const [stripeError, setStripeError] = useState<string | null>(null);

  useEffect(() => {
    if (!STRIPE_PUBLISHABLE_KEY || STRIPE_PUBLISHABLE_KEY.startsWith('pk_test_')) {
      console.warn('Using test Stripe key. Make sure to set REACT_APP_STRIPE_PUBLISHABLE_KEY in production.');
    }
  }, []);

  if (!STRIPE_PUBLISHABLE_KEY) {
    return (
      <Alert className="border-destructive bg-destructive-light">
        <XCircle className="h-4 w-4 text-destructive" />
        <AlertDescription className="text-destructive-dark">
          Stripe configuration error. Please contact support.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentFormInner
        amount={amount}
        currency={currency}
        onSuccess={onSuccess}
        onError={onError}
        description={description}
        metadata={metadata}
      />
    </Elements>
  );
};

export default StripePaymentForm;