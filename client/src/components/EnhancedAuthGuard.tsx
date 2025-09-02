/**
 * Enhanced Authentication Guard Component
 * This component provides comprehensive protection for routes and content
 * with role-based access control, permission checking, and profile completion requirements.
 */

import React from 'react';
import { useAuth } from '@/hooks/useEnhancedAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Lock, 
  UserPlus, 
  LogIn, 
  Loader2, 
  Shield, 
  UserCheck,
  Mail,
  AlertCircle
} from 'lucide-react';
import { Link } from 'wouter';
import { Permission, UserRole } from '@shared/auth-types';

// ============================================================================
// INTERFACES
// ============================================================================

interface EnhancedAuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  message?: string;
  showSignUpPrompt?: boolean;
  
  // Authorization requirements
  requiredPermissions?: Permission[];
  requiredRoles?: UserRole[];
  requireAllPermissions?: boolean; // If true, user needs ALL permissions; if false, ANY permission
  
  // Profile requirements
  requireCompleteProfile?: boolean;
  requireEmailVerification?: boolean;
  
  // Custom error messages
  permissionDeniedMessage?: string;
  profileIncompleteMessage?: string;
  emailNotVerifiedMessage?: string;
  
  // Loading state
  loadingComponent?: React.ReactNode;
}

// ============================================================================
// ENHANCED AUTH GUARD COMPONENT
// ============================================================================

const EnhancedAuthGuard: React.FC<EnhancedAuthGuardProps> = ({ 
  children, 
  fallback,
  message = "Please sign in to access this content",
  showSignUpPrompt = true,
  requiredPermissions = [],
  requiredRoles = [],
  requireAllPermissions = false,
  requireCompleteProfile = false,
  requireEmailVerification = false,
  permissionDeniedMessage = "You don't have permission to access this content",
  profileIncompleteMessage = "Please complete your profile to access this content",
  emailNotVerifiedMessage = "Please verify your email to access this content",
  loadingComponent
}) => {
  const { 
    user, 
    isLoading, 
    isAuthenticated, 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isProfileComplete,
    userDisplayName
  } = useAuth();

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="flex items-center space-x-2 text-muted">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // ============================================================================
  // AUTHENTICATION CHECK
  // ============================================================================

  if (!isAuthenticated || !user) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showSignUpPrompt) {
      return <UnauthenticatedPrompt message={message} />;
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

  // ============================================================================
  // EMAIL VERIFICATION CHECK
  // ============================================================================

  if (requireEmailVerification && !user.emailVerified) {
    return (
      <EmailVerificationRequired 
        message={emailNotVerifiedMessage}
        userEmail={user.email}
      />
    );
  }

  // ============================================================================
  // PROFILE COMPLETION CHECK
  // ============================================================================

  if (requireCompleteProfile && !isProfileComplete) {
    return (
      <ProfileCompletionRequired 
        message={profileIncompleteMessage}
        userName={userDisplayName}
      />
    );
  }

  // ============================================================================
  // ROLE-BASED ACCESS CHECK
  // ============================================================================

  if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    return (
      <PermissionDenied 
        message={permissionDeniedMessage}
        reason="You don't have the required role to access this content"
        userRole={user.role}
        requiredRoles={requiredRoles}
      />
    );
  }

  // ============================================================================
  // PERMISSION-BASED ACCESS CHECK
  // ============================================================================

  if (requiredPermissions.length > 0) {
    const hasAccess = requireAllPermissions 
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);

    if (!hasAccess) {
      return (
        <PermissionDenied 
          message={permissionDeniedMessage}
          reason="You don't have the required permissions to access this content"
          userPermissions={user.permissions}
          requiredPermissions={requiredPermissions}
        />
      );
    }
  }

  // ============================================================================
  // ALL CHECKS PASSED - RENDER CHILDREN
  // ============================================================================

  return <>{children}</>;
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Component shown when user is not authenticated
 */
const UnauthenticatedPrompt: React.FC<{ message: string }> = ({ message }) => (
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

/**
 * Component shown when email verification is required
 */
const EmailVerificationRequired: React.FC<{ 
  message: string; 
  userEmail: string; 
}> = ({ message, userEmail }) => (
  <div className="flex items-center justify-center min-h-[400px] p-4">
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-yellow-600" />
        </div>
        <CardTitle className="text-xl">Email Verification Required</CardTitle>
        <p className="text-muted text-sm mt-2">{message}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-yellow-50 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            We've sent a verification email to <strong>{userEmail}</strong>. 
            Please check your inbox and click the verification link.
          </p>
        </div>
        
        <div className="flex flex-col space-y-3">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.location.reload()}
          >
            Check Again
          </Button>
          
          <Link href="/resend-verification">
            <Button variant="ghost" className="w-full">
              Resend Verification Email
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  </div>
);

/**
 * Component shown when profile completion is required
 */
const ProfileCompletionRequired: React.FC<{ 
  message: string; 
  userName: string; 
}> = ({ message, userName }) => (
  <div className="flex items-center justify-center min-h-[400px] p-4">
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
          <UserCheck className="w-8 h-8 text-blue-600" />
        </div>
        <CardTitle className="text-xl">Complete Your Profile</CardTitle>
        <p className="text-muted text-sm mt-2">{message}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Hi <strong>{userName}</strong>! To access this content, 
            please complete your profile setup.
          </p>
        </div>
        
        <div className="flex flex-col space-y-3">
          <Link href="/profile-setup">
            <Button className="w-full bg-primary hover:bg-primary/90">
              Complete Profile
            </Button>
          </Link>
          
          <Link href="/profile">
            <Button variant="outline" className="w-full">
              Go to Profile
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  </div>
);

/**
 * Component shown when user doesn't have required permissions
 */
const PermissionDenied: React.FC<{ 
  message: string; 
  reason: string;
  userRole?: UserRole;
  requiredRoles?: UserRole[];
  userPermissions?: Permission[];
  requiredPermissions?: Permission[];
}> = ({ 
  message, 
  reason, 
  userRole, 
  requiredRoles, 
  userPermissions, 
  requiredPermissions 
}) => (
  <div className="flex items-center justify-center min-h-[400px] p-4">
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-red-600" />
        </div>
        <CardTitle className="text-xl">Access Denied</CardTitle>
        <p className="text-muted text-sm mt-2">{message}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-800">
              <p className="font-medium">{reason}</p>
              
              {userRole && requiredRoles && (
                <div className="mt-2">
                  <p>Your role: <strong>{userRole}</strong></p>
                  <p>Required roles: <strong>{requiredRoles.join(', ')}</strong></p>
                </div>
              )}
              
              {userPermissions && requiredPermissions && (
                <div className="mt-2">
                  <p>Required permissions: <strong>{requiredPermissions.join(', ')}</strong></p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col space-y-3">
          <Link href="/contact">
            <Button variant="outline" className="w-full">
              Contact Support
            </Button>
          </Link>
          
          <Link href="/">
            <Button variant="ghost" className="w-full">
              Go Home
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  </div>
);

// ============================================================================
// CONVENIENCE COMPONENTS
// ============================================================================

/**
 * Admin-only guard component
 */
export const AdminGuard: React.FC<Omit<EnhancedAuthGuardProps, 'requiredRoles'>> = (props) => (
  <EnhancedAuthGuard 
    {...props} 
    requiredRoles={['admin']}
    permissionDeniedMessage="Admin access required"
  />
);

/**
 * Employer guard component
 */
export const EmployerGuard: React.FC<Omit<EnhancedAuthGuardProps, 'requiredRoles'>> = (props) => (
  <EnhancedAuthGuard 
    {...props} 
    requiredRoles={['employer', 'admin']}
    permissionDeniedMessage="Employer access required"
  />
);

/**
 * Moderator guard component
 */
export const ModeratorGuard: React.FC<Omit<EnhancedAuthGuardProps, 'requiredRoles'>> = (props) => (
  <EnhancedAuthGuard 
    {...props} 
    requiredRoles={['moderator', 'admin']}
    permissionDeniedMessage="Moderator access required"
  />
);

/**
 * Profile completion guard component
 */
export const ProfileCompletionGuard: React.FC<Omit<EnhancedAuthGuardProps, 'requireCompleteProfile'>> = (props) => (
  <EnhancedAuthGuard 
    {...props} 
    requireCompleteProfile={true}
  />
);

/**
 * Email verification guard component
 */
export const EmailVerificationGuard: React.FC<Omit<EnhancedAuthGuardProps, 'requireEmailVerification'>> = (props) => (
  <EnhancedAuthGuard 
    {...props} 
    requireEmailVerification={true}
  />
);

// ============================================================================
// EXPORTS
// ============================================================================

export default EnhancedAuthGuard;