# Environment Variables Setup Guide

This guide explains how to set up environment variables for the WorkWiseSA project.

## Overview

The WorkWiseSA project uses environment variables to manage configuration settings such as API keys, database connections, and other sensitive information. These variables are stored in `.env` files, which should never be committed to version control.

## Setup Instructions

1. Copy the `.env.example` file to create your own `.env` file:

```bash
cp .env.example .env
```

2. For client-side environment variables, create a `.env` file in the `client` directory:

```bash
cp .env.example client/.env
```

3. Fill in the actual values for each environment variable in both `.env` files.

## Environment Variables Explanation

### Server Environment Variables

These variables are used by the server-side code:

- **Database Configuration**
  - `DATABASE_URL`: Connection string for your database (PostgreSQL in production, SQLite for development)

- **File Storage Configuration**
  - `UPLOAD_DIR`: Directory where uploaded files are stored
  - `FILE_SERVE_URL`: URL where uploaded files can be accessed

- **Application Settings**
  - `NODE_ENV`: Environment mode (`development`, `production`, or `test`)
  - `PORT`: Port number for the server to listen on

- **Security**
  - `SESSION_SECRET`: Secret key for session management (generate a strong random string)

- **Firebase Admin SDK Configuration**
  - `GOOGLE_APPLICATION_CREDENTIALS`: Path to your Firebase service account JSON file
  - `FIREBASE_SERVICE_ACCOUNT`: Alternative: Stringified JSON of your service account credentials (for environments like Netlify)

- **Firebase Server Configuration**
  - `FIREBASE_PROJECT_ID`: Your Firebase project ID
  - `FIREBASE_API_KEY`: Your Firebase API key
  - `FIREBASE_AUTH_DOMAIN`: Your Firebase auth domain
  - `FIREBASE_STORAGE_BUCKET`: Your Firebase storage bucket
  - `FIREBASE_MESSAGING_SENDER_ID`: Your Firebase messaging sender ID
  - `FIREBASE_APP_ID`: Your Firebase app ID

- **AI Integration Keys**
  - `GOOGLE_GENAI_API_KEY`: Your Google Gemini API key
  - `ANTHROPIC_API_KEY`: Your Anthropic API key

### Client Environment Variables (Vite)

These variables are used by the client-side code and must be prefixed with `VITE_` to be accessible:

- **Firebase Client Configuration**
  - `VITE_FIREBASE_API_KEY`: Your Firebase API key
  - `VITE_FIREBASE_AUTH_DOMAIN`: Your Firebase auth domain
  - `VITE_FIREBASE_PROJECT_ID`: Your Firebase project ID
  - `VITE_FIREBASE_STORAGE_BUCKET`: Your Firebase storage bucket
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`: Your Firebase messaging sender ID
  - `VITE_FIREBASE_APP_ID`: Your Firebase app ID

- **API Configuration**
  - `VITE_API_URL`: URL for API requests (http://localhost:5000 for development, /.netlify/functions/api for production)

- **AI Integration Keys (Client)**
  - `VITE_GOOGLE_GENAI_API_KEY`: Your Google Gemini API key

## Security Best Practices

1. **Never commit your `.env` files to version control**
2. **Use different API keys for development and production environments**
3. **Regularly rotate your API keys and secrets**
4. **Restrict API key permissions to only what's necessary**
5. **Consider using a secrets management service for production environments**

## Troubleshooting

If you encounter issues with environment variables:

1. Ensure your `.env` files are in the correct locations
2. Verify that all required variables are set
3. Check for typos in variable names
4. Restart your development server after making changes to `.env` files
5. For Vite client variables, ensure they are prefixed with `VITE_`
