# WorkWiseSA Codebase and Development Server Report

## Project Overview

WorkWiseSA is a web application built to help users find job opportunities, improve their skills, and connect with potential employers in South Africa. The application includes features such as job listings, CV scanning, profile enhancement, and educational content through the "WiseUp" learning hub.

## Tech Stack

### Frontend
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Routing**: Wouter (lightweight router)
- **State Management**: React Query for data fetching
- **Form Handling**: React Hook Form with Zod validation
- **UI Components**: Radix UI primitives with shadcn/ui
- **Build Tool**: Vite

### Backend
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Firebase Authentication
- **Storage**: Firebase Storage
- **AI Integration**: Google Gemini AI (for CV scanning and image enhancement)

### Development Tools
- **Package Manager**: npm
- **Testing**: Vitest, Jest, and React Testing Library
- **Type Checking**: TypeScript
- **Build Tools**: esbuild, Vite

## Project Structure

The project follows a modern full-stack architecture with clear separation between client and server:

```
WorkWiseSA/
├── client/                  # Frontend React application
│   ├── public/              # Static assets
│   └── src/                 # Source code
│       ├── components/      # Reusable UI components
│       ├── contexts/        # React contexts
│       ├── hooks/           # Custom React hooks
│       ├── lib/             # Utility libraries
│       ├── pages/           # Page components
│       │   └── WiseUp/      # WiseUp feature components
│       ├── utils/           # Utility functions
│       └── __tests__/       # Test files
├── server/                  # Backend Express application
│   ├── routes/              # API routes
│   ├── server/              # Server configuration
│   ├── services/            # Business logic
│   └── tests/               # Test files
├── shared/                  # Shared code between client and server
│   └── schema.ts            # Database schema
├── public/                  # Public assets
└── uploads/                 # Temporary upload directory
```

## Development Server Configuration

The development environment is set up with a dual-server approach:

1. **Client Dev Server (Vite)**
   - Port: Default Vite port (typically 5173)
   - Serves the React application with hot module replacement
   - Configured in `vite.config.ts`

2. **API Server (Express)**
   - Port: 5000 (configured in `.env`)
   - Serves the REST API endpoints
   - Configured in `server/server/index.ts`

### Starting the Development Environment

The development environment is started using:

```bash
npm run dev
```

This command:
1. Copies assets from public to client/public
2. Concurrently starts both the client and server

The individual commands are:
- `npm run dev:client`: Starts the Vite development server
- `npm run dev:server`: Starts the Express API server using tsx

## Key Features

### 1. Authentication
- Firebase Authentication integration
- Multiple auth methods: Email/Password, Google, Email link (passwordless)

### 2. WiseUp Learning Hub
- Educational content and sponsored content
- Video player with custom controls
- Content filtering and navigation
- Two-panel layout with responsive design

### 3. CV Scanning and Analysis
- Upload and analyze CVs using Google Gemini AI
- Extract structured data from CV documents and images
- Provide job recommendations based on CV content

### 4. Profile Picture Enhancement
- AI-powered image enhancement for profile pictures
- Optimizes lighting, contrast, and professional appearance

### 5. Job Listings and Applications
- Browse job listings by category
- Apply for jobs with resume and cover letter
- Track application status

## Database Schema

The application uses PostgreSQL with Drizzle ORM. Key tables include:

- **users**: User profiles and authentication
- **categories**: Job categories
- **companies**: Company profiles
- **jobs**: Job listings
- **userInteractions**: User engagement tracking
- **jobApplications**: Job application tracking
- **userNotifications**: User notification system

## API Endpoints

The server exposes several REST API endpoints:

- `/api/enhance-image`: POST - Enhance profile pictures using AI
- `/api/scan-cv`: POST - Scan and analyze CV documents
- `/api/cv/generate-summary`: POST - Generate professional summary
- `/api/cv/generate-job-description`: POST - Generate job description
- `/api/cv/translate`: POST - Translate text
- `/api/cv/claude/analyze-image`: POST - Analyze image with Claude AI
- `/api/recommendations`: GET/POST - Job recommendations

## Environment Configuration

The application uses environment variables for configuration:

- **Database**: PostgreSQL connection string
- **Firebase**: Project ID, API keys, auth domain
- **AI Services**: Google Gemini API key
- **Security**: Session secrets

## Build and Deployment

The build process is configured to:

1. Copy assets to the client public directory
2. Build the client application using Vite
3. Build the server using esbuild
4. Output to a `dist` directory

The production server can be started with:

```bash
npm run start
```

## Testing

The application includes testing setup with:

- **Vitest**: For unit and integration tests
- **React Testing Library**: For component testing
- **Jest**: For additional test utilities

## Recommendations

1. **Database Migration**: The project appears to be transitioning from PostgreSQL to Firestore (based on .env comments). This should be completed consistently across the codebase.

2. **Environment Variables**: Some API keys are exposed in the .env file. These should be secured and not committed to version control.

3. **Error Handling**: Implement more robust error handling in API endpoints and client-side requests.

4. **Testing Coverage**: Expand test coverage, particularly for API endpoints and critical user flows.

5. **Documentation**: Add more comprehensive documentation for API endpoints and component usage.

6. **Security**: Implement rate limiting and additional security measures for API endpoints.

7. **Accessibility**: Ensure all components meet accessibility standards (WCAG).

8. **Performance Optimization**: Implement code splitting and lazy loading for larger components.
