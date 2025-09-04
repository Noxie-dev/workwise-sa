/**
 * Authentication Types for WorkWise SA
 * TypeScript definitions for 2FA, SSO, and authentication flows
 */

import { User } from 'firebase/auth';

// 2FA Types
export interface TwoFactorAuthRequest {
  phoneNumber: string;
  userId?: string;
}

export interface TwoFactorAuthResponse {
  success: boolean;
  message: string;
  verificationSid?: string;
  error?: string;
}

export interface TwoFactorVerificationRequest {
  phoneNumber: string;
  code: string;
  verificationSid?: string;
}

export interface TwoFactorVerificationResponse {
  success: boolean;
  message: string;
  verified: boolean;
  error?: string;
}

// SSO Types
export interface SSOProvider {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
}

export interface SSOLoginRequest {
  provider: 'google' | 'facebook' | 'microsoft' | 'apple';
  redirectUrl?: string;
}

export interface SSOLoginResponse {
  success: boolean;
  user?: User;
  error?: string;
  message?: string;
}

// Authentication Flow Types
export type AuthStep = 
  | 'email'
  | 'password'
  | 'two-factor'
  | 'verification'
  | 'success'
  | 'error';

export interface AuthState {
  currentStep: AuthStep;
  email: string;
  password: string;
  phoneNumber: string;
  verificationCode: string;
  isLoading: boolean;
  error: string | null;
  user: User | null;
  twoFactorRequired: boolean;
  verificationSid: string | null;
}

// User Profile Types
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  twoFactorEnabled: boolean;
  twoFactorMethod?: 'sms' | 'whatsapp' | 'email';
  createdAt: Date;
  lastLoginAt: Date;
  provider: string[];
  isVerified: boolean;
}

// Authentication Context Types
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signOut: () => Promise<void>;
  sendTwoFactorCode: (phoneNumber: string) => Promise<TwoFactorAuthResponse>;
  verifyTwoFactorCode: (phoneNumber: string, code: string) => Promise<TwoFactorVerificationResponse>;
  enableTwoFactor: (phoneNumber: string) => Promise<void>;
  disableTwoFactor: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Phone Number Validation
export interface PhoneNumberValidation {
  isValid: boolean;
  formatted: string;
  country: string;
  countryCode: string;
}

// Security Types
export interface SecuritySettings {
  twoFactorEnabled: boolean;
  twoFactorMethod: 'sms' | 'whatsapp' | 'email';
  backupCodes: string[];
  trustedDevices: TrustedDevice[];
  loginNotifications: boolean;
  suspiciousActivityAlerts: boolean;
}

export interface TrustedDevice {
  id: string;
  name: string;
  type: 'mobile' | 'desktop' | 'tablet';
  lastUsed: Date;
  location?: string;
  ipAddress?: string;
}

// Session Management
export interface SessionInfo {
  id: string;
  userId: string;
  deviceInfo: string;
  ipAddress: string;
  location?: string;
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
}

// Error Types
export interface AuthError {
  code: string;
  message: string;
  details?: any;
}

// Configuration Types
export interface AuthConfig {
  enableTwoFactor: boolean;
  enableSSO: boolean;
  allowedSSOProviders: string[];
  twoFactorMethods: ('sms' | 'whatsapp' | 'email')[];
  sessionTimeout: number; // in minutes
  maxLoginAttempts: number;
  lockoutDuration: number; // in minutes
}

// WhatsApp Integration Types
export interface WhatsAppMessage {
  to: string;
  message: string;
  template?: string;
  variables?: Record<string, string>;
}

export interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Twilio Integration Types
export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  verifyServiceSid: string;
  whatsappNumber?: string;
}

export interface TwilioVerificationRequest {
  to: string;
  channel: 'sms' | 'whatsapp' | 'call' | 'email';
  locale?: string;
}

export interface TwilioVerificationResponse {
  sid: string;
  status: 'pending' | 'approved' | 'canceled';
  to: string;
  channel: string;
  valid: boolean;
}

// Firebase Functions Types
export interface FirebaseFunctionRequest {
  phoneNumber: string;
  userId?: string;
  action: 'send' | 'verify';
  code?: string;
}

export interface FirebaseFunctionResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

// Component Props Types
export interface TwoFactorFormProps {
  phoneNumber: string;
  onCodeSent: (verificationSid: string) => void;
  onVerificationComplete: (success: boolean) => void;
  onError: (error: string) => void;
  isLoading?: boolean;
}

export interface SSOButtonProps {
  provider: SSOProvider;
  onSuccess: (user: User) => void;
  onError: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

export interface LoginFormProps {
  onSuccess: (user: User) => void;
  onError: (error: string) => void;
  onTwoFactorRequired: (phoneNumber: string) => void;
  isLoading?: boolean;
}

// Validation Types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface PhoneNumberValidationResult extends ValidationResult {
  formatted: string;
  country: string;
  countryCode: string;
}

// Constants
export const SUPPORTED_COUNTRIES = [
  { code: 'ZA', name: 'South Africa', dialCode: '+27' },
  { code: 'US', name: 'United States', dialCode: '+1' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44' },
  { code: 'AU', name: 'Australia', dialCode: '+61' },
  { code: 'CA', name: 'Canada', dialCode: '+1' },
] as const;

export const TWO_FACTOR_METHODS = [
  { id: 'whatsapp', name: 'WhatsApp', icon: '📱' },
  { id: 'sms', name: 'SMS', icon: '💬' },
  { id: 'email', name: 'Email', icon: '📧' },
] as const;

export const SSO_PROVIDERS = [
  { id: 'google', name: 'Google', icon: '🔍', enabled: true },
  { id: 'facebook', name: 'Facebook', icon: '📘', enabled: false },
  { id: 'microsoft', name: 'Microsoft', icon: '🏢', enabled: false },
  { id: 'apple', name: 'Apple', icon: '🍎', enabled: false },
] as const;