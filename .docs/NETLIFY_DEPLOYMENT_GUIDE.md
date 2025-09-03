# Netlify Deployment Guide - Updated for CLI v23.1.3

This guide covers the updated deployment process for WorkWise SA using the latest Netlify CLI features and best practices.

## Prerequisites

- Netlify CLI v23.1.3+ installed
- Node.js 20+ 
- Firebase project configured
- Environment variables set up

## Quick Deployment

### Fast Deploy (Recommended for development)
```bash
npm run deploy:fast
```

### Production Deploy
```bash
npm run deploy:prod
```

## Environment Variables Setup

### Required Netlify Environment Variables

Set these in your Netlify dashboard (Site settings > Environment variables):

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=workwise-sa-project
FIREBASE_STORAGE_BUCKET=workwise-sa-project.appspot.com
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...} # JSON string

# AI Integration
GOOGLE_GENAI_API_KEY=your_google_genai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Build Configuration
NODE_VERSION=20
NODE_OPTIONS=--max-old-space-size=4096
NPM_FLAGS=--production=false
```

### Prepare Firebase Service Account
```bash
npm run netlify:prepare
```

This script will:
- Read your Firebase service account key
- Convert it to the format needed for Netlify
- Display the environment variable value to copy

## Build Process

### Optimized Build Command
```bash
npm run netlify:build
```

This runs:
1. `copy-assets` - Copy static assets
2. `build:client:optimized` - Build with Terser minification
3. `netlify:post-build` - Post-build optimizations

### Build Optimizations

- **Terser minification** for better compression
- **Code splitting** with optimized chunks
- **Asset optimization** with proper caching headers
- **Security headers** automatically applied
- **Build verification** and size reporting

## Functions

### Updated Function Configuration

- **Node.js 20** runtime
- **ESBuild 0.25.0** bundler with source maps
- **Streaming enabled** for better performance
- **External dependencies** properly configured

### Function Structure
```
netlify/functions/
├── api.js          # Main API handler
├── auth.ts         # Authentication functions
├── categories.js   # Categories API
├── utils/          # Shared utilities
└── package.json    # Function dependencies
```

## Security Enhancements

### Headers Applied
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` for camera/microphone/geolocation

### Caching Strategy
- **Static assets**: 1 year cache with immutable flag
- **API responses**: No cache
- **HTML**: Standard browser caching

## Monitoring & Debugging

### Deployment Verification
```bash
netlify status
netlify logs:deploy
netlify functions:list
```

### Build Information
After deployment, check `/build-info.json` for:
- Build timestamp
- Node.js version
- Git commit/branch info
- Build size metrics

## Performance Optimizations

### Bundle Splitting
- **React core**: Separate vendor chunk
- **Firebase modules**: Split by service (auth, firestore, etc.)
- **UI libraries**: Grouped by functionality
- **Heavy libraries**: Isolated chunks (charts, PDF, etc.)

### Build Size Monitoring
- Automatic size calculation and reporting
- Warning for builds over 50MB
- Bundle analysis available with `npm run build:analyze`

## Troubleshooting

### Common Issues

1. **Build timeout**: Increase `NETLIFY_TIMEOUT` environment variable
2. **Memory issues**: Ensure `NODE_OPTIONS=--max-old-space-size=4096`
3. **Function errors**: Check function logs with `netlify logs:functions`
4. **Missing environment variables**: Verify all required vars are set

### Debug Commands
```bash
# Check site status
netlify status

# View recent deployments
netlify logs:deploy

# Test functions locally
netlify dev

# Validate configuration
netlify build --dry-run
```

## Latest CLI Features Used

- **Streaming functions** for better performance
- **Enhanced build caching** with `NETLIFY_CACHE_NEXTJS`
- **Improved timeout handling** with extended limits
- **JSON output** for better CI/CD integration
- **Source maps** for function debugging

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Firebase service account set up
- [ ] Build passes locally (`npm run build`)
- [ ] Functions validate (`netlify functions:list`)
- [ ] Security headers configured
- [ ] Performance optimizations applied
- [ ] Monitoring set up

## Next Steps

1. Set up **Netlify Analytics** for performance monitoring
2. Configure **Split Testing** for A/B testing
3. Enable **Large Media** if handling large assets
4. Set up **Deploy Notifications** for team updates

---

For more information, see the [Netlify CLI documentation](https://cli.netlify.com/) or run `netlify help`.