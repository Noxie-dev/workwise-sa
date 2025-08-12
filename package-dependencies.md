# Required Dependencies for Cloudflare R2 + Images Integration

## Backend Dependencies (Netlify Functions)
Add these to your `package.json`:

```json
{
  "dependencies": {
    "node-fetch": "^3.3.2",
    "firebase": "^10.7.1",
    "aws-sdk": "^2.1491.0"
  }
}
```

## Installation Commands
```bash
npm install node-fetch firebase aws-sdk
```

## Frontend Dependencies (if not already installed)
```bash
npm install firebase
```

## Notes
- `node-fetch` - For making HTTP requests in Netlify Functions
- `firebase` - For Firebase Auth and Firestore
- `aws-sdk` - For S3-compatible API with Cloudflare R2 (optional, only if using R2 backup)
