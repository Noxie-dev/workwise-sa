# 🚀 Production-Ready Cloudflare R2 + Images Integration

## ✅ What This Setup Provides

- **Direct uploads** to Cloudflare Images via signed URLs
- **Automatic thumbnail generation** without Sharp
- **Zero egress costs** via Cloudflare CDN
- **Auth-protected uploads** (only logged-in users)
- **DB persistence** for image metadata
- **Webhook-driven processing** for real-time updates
- **Multiple image variants** (original, thumbnail, optimized)

## 📋 Setup Steps

### 1. Cloudflare Dashboard Setup

1. **Create Cloudflare Images Account**:
   - Go to Cloudflare Dashboard → Images
   - Enable Cloudflare Images
   - Note your Account ID and Images Hash

2. **Generate API Token**:
   - Go to "My Profile" → "API Tokens"
   - Create token with `Cloudflare Images:Edit` permissions
   - Copy the token

3. **Configure Image Variants** (Optional):
   ```
   public → Original size
   optimized → Max 1080px, auto-webp, quality 85
   thumbnail → 150×150, cover crop, auto-webp
   ```

4. **Set Webhook URL**:
   - Go to Images → Settings
   - Set webhook URL: `https://your-site.netlify.app/.netlify/functions/cloudflareWebhook`
   - Set webhook secret (generate a random string)

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
# Cloudflare Configuration
CLOUDFLARE_ACCOUNT_ID=your-actual-account-id
CLOUDFLARE_IMAGES_API_TOKEN=your-actual-api-token
CLOUDFLARE_IMAGES_HASH=your-actual-images-hash
CLOUDFLARE_WEBHOOK_SECRET=your-webhook-secret-key

# Firebase Configuration
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_PROJECT_ID=your-firebase-project-id
```

### 3. Firestore Security Rules

Add these rules to your Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /userImages/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

### 4. Deploy Functions

Your Netlify Functions are ready! Make sure they're deployed:
- `/.netlify/functions/generateUploadUrl`
- `/.netlify/functions/cloudflareWebhook`
- `/.netlify/functions/getUserImages`

## 🎯 Usage Examples

### Basic Usage in Your React App

```tsx
import ImageUploader from './src/components/ImageUploader';

function ProfilePage() {
  return (
    <div>
      <ImageUploader 
        label="Profile Picture" 
        type="profile"
        onUploadComplete={(imageData) => {
          console.log('Upload complete:', imageData);
        }}
      />
      
      <ImageUploader 
        label="Professional Photo" 
        type="professional"
        onUploadComplete={(imageData) => {
          console.log('Upload complete:', imageData);
        }}
      />
    </div>
  );
}
```

### Fetching User Images

```tsx
import { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';

function DisplayUserImages() {
  const [images, setImages] = useState(null);

  useEffect(() => {
    async function fetchImages() {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      
      const response = await fetch('/.netlify/functions/getUserImages', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await response.json();
      setImages(data.images);
    }

    fetchImages();
  }, []);

  return (
    <div>
      {images?.profile && (
        <img src={images.profile.thumbnailUrl} alt="Profile" />
      )}
      {images?.professional && (
        <img src={images.professional.optimizedUrl} alt="Professional" />
      )}
    </div>
  );
}
```

## 🔧 API Endpoints

### POST `/.netlify/functions/generateUploadUrl`
**Purpose**: Generate signed upload URL for Cloudflare Images
**Auth**: Required (Firebase Bearer token)
**Body**: `{ "type": "profile" | "professional" }`
**Response**: `{ "uploadUrl": "...", "imageId": "..." }`

### GET `/.netlify/functions/getUserImages?type=profile`
**Purpose**: Get user's uploaded images
**Auth**: Required (Firebase Bearer token)
**Query**: `type` (optional) - "profile" or "professional"
**Response**: `{ "images": { "profile": {...}, "professional": {...} } }`

### POST `/.netlify/functions/cloudflareWebhook`
**Purpose**: Webhook receiver for Cloudflare Images processing
**Auth**: Webhook secret verification
**Body**: Cloudflare webhook payload

## 🎨 Image Variants & URLs

After upload, images are available at:

```
Original: https://imagedelivery.net/{HASH}/{IMAGE_ID}/public
Thumbnail: https://imagedelivery.net/{HASH}/{IMAGE_ID}/w=150,h=150,fit=cover
Optimized: https://imagedelivery.net/{HASH}/{IMAGE_ID}/w=1080,h=1080,fit=scale-down,f=webp,q=85
```

## 🔒 Security Features

- ✅ **Firebase Auth**: Only authenticated users can upload
- ✅ **User isolation**: Users can only access their own images
- ✅ **Webhook verification**: Protects against malicious webhooks
- ✅ **File validation**: Type and size limits enforced
- ✅ **Signed URLs**: Direct upload without exposing credentials

## 🚀 Production Deployment

1. **Set environment variables** in Netlify dashboard
2. **Deploy functions** (automatic with your repo)
3. **Configure Cloudflare webhook** to point to your deployed URL
4. **Test uploads** in production

## 🛠️ Troubleshooting

### Upload fails with 401
- Check Firebase token is valid
- Verify FIREBASE_API_KEY in environment

### Webhook not triggering
- Check webhook URL in Cloudflare dashboard
- Verify CLOUDFLARE_WEBHOOK_SECRET matches

### Images not processing
- Check Cloudflare Images quota/limits
- Verify CLOUDFLARE_IMAGES_HASH is correct

### Database updates failing
- Check Firestore security rules
- Verify FIREBASE_PROJECT_ID is correct

## 📈 Scaling Considerations

- **Cloudflare Images**: 100,000 images/month free, then $5/100k
- **Cloudflare CDN**: Unlimited bandwidth (free)
- **Firebase Firestore**: 50k reads/writes per day (free)
- **Netlify Functions**: 125k invocations/month (free)

This setup easily handles 10k+ users with minimal cost!
