# WorkWise SA Technical Stack Report

## Overview
WorkWise SA is a comprehensive job platform designed for the South African market. The application features job listings, user profiles, CV building capabilities, educational resources (WiseUp), and AI-powered job matching and content generation.

## Tech Stack Summary

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Routing**: Wouter
- **State Management**: React Query (TanStack Query)
- **UI Components**: 
  - Radix UI component library
  - Custom components with Tailwind CSS
- **Form Handling**: React Hook Form with Zod validation
- **Data Visualization**: Recharts
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **API Documentation**: Swagger/OpenAPI

### Database
- **Primary Database**: PostgreSQL (via Neon Serverless)
- **ORM**: Drizzle ORM
- **Schema Validation**: Zod
- **Migration Tool**: Drizzle Kit

### Authentication & Storage
- **Authentication**: Firebase Authentication
- **Document Storage**: Firebase Firestore
- **File Storage**: Firebase Storage

### AI Services
- **Text Generation**: Google Gemini Pro
- **Advanced AI Features**: Anthropic Claude 3.7 Sonnet

### Deployment & Hosting
- **Hosting Options**:
  - Firebase Hosting
  - Netlify

### Testing
- **Testing Framework**: Vitest
- **Component Testing**: React Testing Library
- **Mock Server**: Supertest

## Architecture Details

### Database Schema
The application uses a relational database with the following key tables:
- Users
- Jobs
- Companies
- Categories
- Files (for document storage)
- WiseUp content (educational resources)
- User interactions and engagement tracking

### API Structure
The backend provides RESTful APIs for:
- User authentication and profile management
- Job listings and search
- CV building and management
- WiseUp content delivery
- AI-powered recommendations and content generation

### AI Integration
The application leverages AI for several features:
1. **CV Enhancement**: Generating professional summaries and job descriptions
2. **Content Translation**: Supporting multiple languages
3. **Image Analysis**: Evaluating profile photos for professional appearance
4. **Job Matching**: Recommending relevant positions based on user profiles

### Real-time Features
The application implements WebSocket connections for real-time notifications and updates.

## Development Environment
- **Package Manager**: npm
- **Code Quality**: ESLint, Prettier
- **Development Container**: Docker via devcontainer configuration
- **Environment Variables**: Managed through .env files with example templates

## Deployment Pipeline
The application supports deployment to both Firebase and Netlify with specific build scripts for each platform.

## Scalability Considerations
- Database connections support both SQLite (for testing) and PostgreSQL (for production)
- Modular architecture allows for component reuse and extension
- Chunked build output optimizes loading performance

## Security Features
- Firebase Authentication for secure user management
- Environment variable sanitization
- CORS protection
- Request ID tracking for debugging

## Future Expansion Areas
Based on the codebase structure, the application appears prepared for:
- Enhanced AI-driven features
- Mobile application development
- Expanded employer services
- Analytics and reporting capabilities