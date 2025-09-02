# Authentication Module Refactoring Guide

## Overview

The authentication module has been completely refactored to provide a more robust, secure, and maintainable authentication system. This guide outlines the changes made and how to migrate existing code to use the new system.

## Key Improvements

### 1. **Centralized Type System**
- All authentication types are now defined in `shared/auth-types.ts`
- Consistent interfaces across client and server
- Strong typing for better development experience

### 2. **Enhanced Security**
- Proper role-based access control (RBAC)
- Permission-based authorization
- Token management and refresh
- Input validation and sanitization

### 3. **Better Error Handling**
- Standardized error codes and messages
- Comprehensive error handling across all auth operations
- User-friendly error messages with toast notifications

### 4. **Improved Architecture**
- Separation of concerns between Firebase integration and business logic
- Centralized auth service with adapter pattern
- Enhanced middleware for server-side authentication

### 5. **Enhanced User Experience**
- Loading states and proper feedback
- Profile completion tracking
- Email verification flow
- Remember me functionality

## New File Structure

```
shared/
├── auth-types.ts              # Centralized type definitions
├── auth-service.ts            # Core authentication service
└── firebase-auth-adapter.ts   # Firebase integration layer

client/src/
├── contexts/
│   └── EnhancedAuthContext.tsx    # Enhanced auth context
├── hooks/
│   └── useEnhancedAuth.ts         # Enhanced auth hooks
└── components/
    └── EnhancedAuthGuard.tsx      # Enhanced auth guard

server/middleware/
└── enhanced-auth.ts           # Enhanced server middleware
```

## Migration Guide

### 1. **Update Imports**

**Before:**
```typescript
import { useAuth } from '@/contexts/AuthContext';
import { loginWithEmailPassword } from '@/services/authService';
```

**After:**
```typescript
import { useAuth } from '@/hooks/useEnhancedAuth';
import { firebaseAuthAdapter } from '@shared/firebase-auth-adapter';
```

### 2. **Update Auth Context Usage**

**Before:**
```typescript
const { user, isAuthenticated, login } = useAuth();
```

**After:**
```typescript
const { 
  user, 
  isAuthenticated, 
  loginWithToast,
  hasPermission,
  isAdmin 
} = useAuth();
```

### 3. **Update Auth Guards**

**Before:**
```typescript
<AuthGuard>
  <ProtectedContent />
</AuthGuard>
```

**After:**
```typescript
<EnhancedAuthGuard 
  requiredPermissions={['jobs:view']}
  requireCompleteProfile={true}
>
  <ProtectedContent />
</EnhancedAuthGuard>
```

### 4. **Update Server Middleware**

**Before:**
```typescript
import { authenticate } from '../middleware/auth';
```

**After:**
```typescript
import { 
  authenticate, 
  requireAdmin, 
  requirePermission 
} from '../middleware/enhanced-auth';
```

### 5. **Update Route Protection**

**Before:**
```typescript
app.get('/admin', authenticate, (req, res) => {
  // Admin route
});
```

**After:**
```typescript
app.get('/admin', 
  authenticate, 
  requireAdmin, 
  (req, res) => {
    // Admin route
  }
);
```

## New Features

### 1. **Role-Based Access Control**

```typescript
// Check if user has admin role
const { isAdmin } = useAuth();

// Check specific permissions
const { hasPermission } = useAuth();
const canCreateJobs = hasPermission('jobs:create');
```

### 2. **Enhanced Auth Guards**

```typescript
// Admin-only content
<AdminGuard>
  <AdminDashboard />
</AdminGuard>

// Content requiring specific permissions
<EnhancedAuthGuard 
  requiredPermissions={['jobs:create', 'jobs:edit']}
  requireAllPermissions={true}
>
  <JobManagement />
</EnhancedAuthGuard>

// Content requiring complete profile
<ProfileCompletionGuard>
  <AdvancedFeatures />
</ProfileCompletionGuard>
```

### 3. **Toast Notifications**

```typescript
const { loginWithToast, registerWithToast } = useAuth();

// Automatically shows success/error toasts
await loginWithToast(email, password);
await registerWithToast(userData);
```

### 4. **Server-Side Authorization**

```typescript
// Require specific role
app.get('/admin/users', authenticate, requireAdmin, handler);

// Require specific permissions
app.post('/jobs', 
  authenticate, 
  requirePermission('jobs:create'), 
  handler
);

// Require multiple permissions (ALL)
app.put('/jobs/:id', 
  authenticate, 
  requireAllPermissions(['jobs:edit', 'jobs:view']), 
  handler
);
```

## Type Definitions

### User Roles
- `user` - Regular user
- `admin` - Administrator
- `moderator` - Content moderator
- `employer` - Job poster

### Permissions
- `dashboard:view` - View dashboard
- `profile:view` - View profile
- `profile:edit` - Edit profile
- `jobs:view` - View jobs
- `jobs:apply` - Apply to jobs
- `jobs:create` - Create jobs
- `jobs:edit` - Edit jobs
- `jobs:delete` - Delete jobs
- `admin:view` - View admin panel
- `admin:users` - Manage users
- `admin:settings` - Manage settings
- `admin:analytics` - View analytics
- `admin:content` - Manage content
- `admin:security` - Manage security
- `marketing:view` - View marketing
- `marketing:edit` - Edit marketing
- `notifications:view` - View notifications
- `notifications:send` - Send notifications

## Error Handling

The new system provides comprehensive error handling with standardized error codes:

```typescript
// Firebase Auth errors
AUTH_ERROR_CODES.USER_NOT_FOUND
AUTH_ERROR_CODES.WRONG_PASSWORD
AUTH_ERROR_CODES.EMAIL_ALREADY_IN_USE
AUTH_ERROR_CODES.WEAK_PASSWORD
AUTH_ERROR_CODES.INVALID_EMAIL
AUTH_ERROR_CODES.TOO_MANY_REQUESTS

// Custom application errors
AUTH_ERROR_CODES.INVALID_TOKEN
AUTH_ERROR_CODES.TOKEN_EXPIRED
AUTH_ERROR_CODES.INSUFFICIENT_PERMISSIONS
AUTH_ERROR_CODES.PROFILE_INCOMPLETE
AUTH_ERROR_CODES.EMAIL_NOT_VERIFIED
```

## Security Improvements

1. **Token Management**: Automatic token refresh and secure storage
2. **Input Validation**: Comprehensive validation for all auth inputs
3. **Rate Limiting**: Protection against brute force attacks
4. **Role-Based Access**: Granular permission system
5. **Profile Completion**: Enforced profile completion for certain features
6. **Email Verification**: Optional email verification requirement

## Testing

The new auth system includes comprehensive error handling and can be tested with:

```typescript
// Test authentication
const result = await auth.login(email, password);
expect(result.success).toBe(true);

// Test authorization
expect(auth.hasPermission('jobs:create')).toBe(true);

// Test role checking
expect(auth.isAdmin).toBe(false);
```

## Backward Compatibility

The old auth system is marked as deprecated but still functional for backward compatibility. However, it's recommended to migrate to the new system for:

- Better security
- Enhanced user experience
- Improved maintainability
- Better error handling
- Type safety

## Next Steps

1. **Update existing components** to use the new auth hooks
2. **Replace old auth guards** with enhanced versions
3. **Update server routes** to use new middleware
4. **Test thoroughly** with different user roles and permissions
5. **Remove deprecated code** once migration is complete

## Support

For questions or issues with the migration, please refer to:
- Type definitions in `shared/auth-types.ts`
- Example usage in the enhanced auth context and hooks
- Server middleware examples in `server/middleware/enhanced-auth.ts`