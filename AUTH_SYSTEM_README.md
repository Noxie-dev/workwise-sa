# WorkWise SA Authentication System

## 🚀 Quick Start

### 1. Setup Development Environment
```bash
npm run setup:dev
```

### 2. Configure Environment Variables
Update your `.env` and `client/.env` files with your Firebase configuration:
```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=workwise-sa-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=workwise-sa-project
VITE_FIREBASE_STORAGE_BUCKET=workwise-sa-project.appspot.com
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Start Development Server
```bash
npm run dev:clean
```

## 🔧 Issues Fixed

### ✅ API Routing Issues
- **Problem**: Client was calling `/api/categories` but server routes were under `/api/v1/`
- **Solution**: Added backward compatibility routes in `src/api/index.ts`
- **Result**: Both `/api/categories` and `/api/v1/categories` now work

### ✅ Facebook Login HTTPS Issue
- **Problem**: Facebook login requires HTTPS, but development uses HTTP
- **Solution**: Added HTTPS check in `src/firebase.ts` with clear error message
- **Result**: Clear error message when trying to use Facebook login in development

### ✅ JSX Attribute Warning
- **Problem**: `jsx` attribute was being passed as boolean instead of string
- **Solution**: Changed `<style jsx>` to `<style jsx="true">` in `BlogWise.tsx`
- **Result**: No more JSX attribute warnings

### ✅ API Endpoint 500 Errors
- **Problem**: API endpoints were returning 500 errors due to poor error handling
- **Solution**: Enhanced error handling and logging in API routes
- **Result**: Better error messages and debugging information

### ✅ Auth Service Consolidation
- **Problem**: Multiple duplicate auth service implementations
- **Solution**: Created unified auth service in `shared/unified-auth-service.ts`
- **Result**: Single source of truth for authentication logic

### ✅ Legacy Code Cleanup
- **Problem**: Deprecated auth services still present
- **Solution**: Marked legacy services as deprecated with migration guides
- **Result**: Clear migration path for developers

## 🏗️ Architecture Overview

### Unified Authentication System
```
┌─────────────────────────────────────────────────────────────┐
│                    Client Application                       │
├─────────────────────────────────────────────────────────────┤
│  AuthContext (React)                                       │
│  ├── useAuth() hook                                        │
│  ├── AuthGuard components                                  │
│  └── AuthProvider wrapper                                  │
├─────────────────────────────────────────────────────────────┤
│  Unified Auth Service                                      │
│  ├── Authentication methods                                │
│  ├── User management                                       │
│  ├── Token management                                      │
│  └── Authorization logic                                   │
├─────────────────────────────────────────────────────────────┤
│  Firebase Auth Adapter                                     │
│  ├── Firebase integration                                  │
│  ├── Error handling                                        │
│  └── Token conversion                                      │
├─────────────────────────────────────────────────────────────┤
│  Firebase Authentication                                   │
│  ├── Email/Password                                        │
│  ├── Google OAuth                                          │
│  ├── Facebook OAuth (HTTPS only)                           │
│  └── Email Link                                            │
└─────────────────────────────────────────────────────────────┘
```

### API Routing Structure
```
/api/
├── v1/                    # Versioned API routes
│   ├── categories         # GET /api/v1/categories
│   ├── companies          # GET /api/v1/companies
│   ├── jobs               # GET /api/v1/jobs
│   ├── auth/              # Authentication routes
│   └── protected/         # Protected routes
├── categories             # Backward compatibility
├── companies              # Backward compatibility
├── jobs                   # Backward compatibility
└── auth                   # Backward compatibility
```

## 🔐 Authentication Features

### Supported Authentication Methods
- ✅ **Email/Password** - Standard Firebase authentication
- ✅ **Google OAuth** - Social login via Firebase
- ⚠️ **Facebook OAuth** - Requires HTTPS (disabled in development)
- ✅ **Email Link** - Passwordless authentication
- ✅ **Two-Factor Authentication** - WhatsApp/SMS via Twilio

### User Roles & Permissions
```typescript
UserRole = 'user' | 'admin' | 'moderator' | 'employer'

Permissions include:
- dashboard:view, profile:view/edit
- jobs:view/apply/create/edit/delete
- admin:view/users/settings/analytics/content/security
- marketing:view/edit
- notifications:view/send
```

### Security Features
- 🔒 **Token-based authentication** with automatic refresh
- 🛡️ **Role-based access control** (RBAC)
- 🔐 **Two-factor authentication** with Twilio
- 📱 **WhatsApp integration** for 2FA codes
- 🚫 **Resource ownership validation**
- 📧 **Email verification** enforcement

## 🚀 Usage Examples

### Using the Auth Context
```tsx
import { useAuth, AuthProvider } from '@shared/auth-context';

function App() {
  return (
    <AuthProvider>
      <MyApp />
    </AuthProvider>
  );
}

function MyApp() {
  const { user, isAuthenticated, login, logout } = useAuth();

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div>
      <h1>Welcome, {user?.displayName}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Using Auth Guards
```tsx
import { AuthGuard } from '@shared/auth-context';

function AdminPanel() {
  return (
    <AuthGuard requireAdmin={true}>
      <AdminContent />
    </AuthGuard>
  );
}

function ProtectedContent() {
  return (
    <AuthGuard permissions={['jobs:create']}>
      <JobCreationForm />
    </AuthGuard>
  );
}
```

### API Authentication
```typescript
// Server-side middleware
import { authenticate, requireAdmin } from './middleware/enhanced-auth';

app.get('/api/admin/users', authenticate, requireAdmin, (req, res) => {
  // Only admins can access this endpoint
});

// Client-side API calls
const token = await authService.getToken();
const response = await fetch('/api/protected/data', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## 🛠️ Development

### Running the Development Server
```bash
# Start both client and server
npm run dev:clean

# Start only client (port 5173)
npm run dev:client

# Start only server (port 3001)
npm run dev:server
```

### Database Setup
```bash
# Run migrations
npm run db:migrate

# Open database studio
npm run db:studio

# Check migration status
npm run db:status
```

### Testing
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e
```

## 🔧 Troubleshooting

### Common Issues

#### 1. 404 Errors on API Calls
- **Cause**: Server not running or wrong port
- **Solution**: Ensure server is running on port 3001
- **Check**: `npm run dev:server`

#### 2. 500 Errors on API Calls
- **Cause**: Database connection issues or missing data
- **Solution**: Check server logs and database connection
- **Check**: Run `npm run db:migrate`

#### 3. Facebook Login Not Working
- **Cause**: Facebook requires HTTPS
- **Solution**: Use production environment or enable HTTPS in development
- **Note**: Error message will guide you

#### 4. Firebase Authentication Errors
- **Cause**: Missing or incorrect Firebase configuration
- **Solution**: Check your `.env` files and Firebase project settings
- **Check**: Run `npm run env:check`

#### 5. Database Connection Issues
- **Cause**: Database not initialized or migrations not run
- **Solution**: Run database migrations and check connection
- **Check**: `npm run db:status`

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev:server

# Check environment variables
npm run env:check

# Validate Firebase configuration
npm run firebase:validate
```

## 📚 Migration Guide

### From Legacy Auth Services
If you're using the old auth services, here's how to migrate:

#### Before (Legacy)
```typescript
import { loginWithEmailPassword } from '@/services/authService';

const result = await loginWithEmailPassword(email, password);
```

#### After (Unified)
```typescript
import { useAuth } from '@shared/auth-context';

const { login } = useAuth();
const result = await login(email, password);
```

### Component Migration
```tsx
// Before
import { useAuth } from '@/hooks/useAuth';

// After
import { useAuth } from '@shared/auth-context';
```

## 🔮 Future Enhancements

### Planned Features
- [ ] **Biometric Authentication** - Fingerprint/Face ID support
- [ ] **Social Login Expansion** - LinkedIn, Twitter, GitHub
- [ ] **Advanced 2FA** - TOTP, hardware keys
- [ ] **Session Management** - Device tracking, remote logout
- [ ] **Audit Logging** - Comprehensive security event tracking
- [ ] **Rate Limiting** - Advanced protection against brute force
- [ ] **Password Policies** - Configurable password requirements
- [ ] **Account Recovery** - Advanced recovery options

### Performance Optimizations
- [ ] **Token Caching** - Improved token management
- [ ] **Lazy Loading** - On-demand auth service loading
- [ ] **Connection Pooling** - Database connection optimization
- [ ] **CDN Integration** - Static asset optimization

## 📞 Support

### Getting Help
1. Check this README for common issues
2. Run the setup script: `npm run setup:dev`
3. Check the server logs for detailed error messages
4. Verify your environment configuration

### Reporting Issues
When reporting issues, please include:
- Error messages from console
- Steps to reproduce
- Environment details (OS, Node version, etc.)
- Relevant configuration (without sensitive data)

---

**Happy coding! 🚀**