/**
 * Payment Types for WorkWise SA
 * TypeScript definitions for Stripe payment integration
 */

export interface BillingAddress {
  houseNumber: string;
  streetName: string;
  apartmentNo?: string;
  suburb?: string;
  cityTown: string;
  province: string;
  postalCode: string;
  country: string;
}

export interface PaymentFormData {
  name: string;
  billingAddress: BillingAddress;
}

export interface PaymentMethod {
  id: string;
  type: 'card';
  card: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  billing_details: {
    name: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled';
  client_secret: string;
}

export interface PaymentError {
  type: string;
  code?: string;
  message: string;
  decline_code?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentIntent?: PaymentIntent;
  error?: PaymentError;
}

export interface PaymentFormProps {
  amount: number;
  currency?: string;
  onSuccess: (paymentIntent: PaymentIntent) => void;
  onError: (error: PaymentError) => void;
  onCancel?: () => void;
  description?: string;
  metadata?: Record<string, string>;
}

export interface StripeConfig {
  publishableKey: string;
  apiVersion?: string;
  locale?: string;
}

// South African provinces for validation
export const SOUTH_AFRICAN_PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape',
  'Western Cape'
] as const;

export type SouthAfricanProvince = typeof SOUTH_AFRICAN_PROVINCES[number];

// Payment status types
export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'canceled'
  | 'requires_action';

// Currency types
export type Currency = 'ZAR' | 'USD' | 'EUR';

// Payment method types
export type PaymentMethodType = 'card' | 'bank_transfer' | 'wallet';

// Form validation schemas
export interface PaymentFormValidation {
  name: {
    required: boolean;
    minLength: number;
    maxLength: number;
  };
  billingAddress: {
    houseNumber: { required: boolean; pattern: RegExp };
    streetName: { required: boolean; minLength: number };
    cityTown: { required: boolean; minLength: number };
    province: { required: boolean; enum: string[] };
    postalCode: { required: boolean; pattern: RegExp };
  };
}

// API response types
export interface CreatePaymentIntentRequest {
  amount: number;
  currency: string;
  description?: string;
  metadata?: Record<string, string>;
  customer_id?: string;
}

export interface CreatePaymentIntentResponse {
  client_secret: string;
  payment_intent_id: string;
}

export interface ConfirmPaymentRequest {
  payment_intent_id: string;
  payment_method_id: string;
}

export interface ConfirmPaymentResponse {
  success: boolean;
  payment_intent: PaymentIntent;
  error?: PaymentError;
}