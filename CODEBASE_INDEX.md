# WorkWise Codebase Index

## 📁 Project Structure Overview

```
workwise-sa/
├── client/                 # Frontend React/TypeScript application
├── server/                 # Backend Node.js/TypeScript server
├── functions/              # Firebase Cloud Functions
├── shared/                 # Shared types and schemas
├── database/               # Database schemas and migrations
├── docs/                   # Project documentation
├── scripts/                # Utility and build scripts
├── .devcontainer/          # Docker development container setup
├── migrations/             # Database migration files
├── netlify/                # Netlify deployment configuration
├── scrapy_jobs/            # Web scraping jobs
└── public/                 # Static assets and public files
```

## 🎯 Frontend (Client)

### Core Application Files
- **Entry Points**
  - `client/src/main.tsx` - Main application entry point (1.6KB)
  - `client/src/App.tsx` - Root application component (7.2KB)
  - `client/src/App.jsx` - Alternative App component (437B)
  - `client/index.html` - HTML template

### Key Components & Structure
- **Components** (`client/src/components/`)
  - Layout components (Header, Footer, Sidebar)
  - Navigation and routing components
  - Reusable UI components

- **Pages** (`client/src/pages/`)
  - Main page components and views

- **Core** (`client/src/core/`)
  - Core application logic and utilities

- **Services** (`client/src/services/`)
  - API services and external integrations

- **Hooks** (`client/src/hooks/`)
  - Custom React hooks

- **Contexts** (`client/src/contexts/`)
  - React context providers

- **Utils** (`client/src/utils/`)
  - Utility functions and helpers

- **Types** (`client/src/types/`)
  - TypeScript type definitions
  - `client/src/types.ts` - Main types file (3.3KB)

- **Styles** (`client/src/styles/`)
  - CSS and styling files

- **Data** (`client/src/data/`)
  - Data models and mock data

- **Lib** (`client/src/lib/`)
  - Library configurations and utilities

### Testing & Development
- `client/src/setupTests.ts` - Test setup configuration (2.2KB)
- `client/src/__tests__/` - Test files directory
- `client/src/__mocks__/` - Mock files directory
- `client/src/queryClient.js` - React Query client (122B)

### Configuration Files
- `client/package.json` - Frontend dependencies and scripts
- `client/tsconfig.json` - TypeScript configuration
- `client/vite.config.ts` - Vite build configuration
- `client/tailwind.config.js` - Tailwind CSS configuration
- `client/postcss.config.js` - PostCSS configuration
- `client/jest.config.js` - Jest testing configuration

## 🖥️ Backend (Server)

### Core Server Files
- **Main Files**
  - `server/wiseup.ts` - WiseUp main logic (7.3KB)
  - `server/websocket.ts` - WebSocket server (6.1KB)
  - `server/storage.ts` - Storage service (27KB)
  - `server/firestore-storage.ts` - Firestore storage (15KB)
  - `server/jobDistribution.ts` - Job distribution logic (20KB)
  - `server/jobRecommendation.ts` - Job recommendation system (20KB)

### API & Routes
- **Routes**
  - `server/routes.ts` - Main API routes (12KB)
  - `server/recommendationRoutes.ts` - Recommendation routes (6.8KB)
  - `server/routes/` - Additional route definitions

### Services & Middleware
- **Services** (`server/services/`)
  - Business logic services
- **Middleware** (`server/middleware/`)
  - Express middleware components
- **Utils** (`server/utils/`)
  - Utility functions

### Database & Storage
- **Database**
  - `server/db.ts` - Database connection (1.4KB)
  - `server/migrations.ts` - Migration management (2.4KB)
  - `server/migrations/` - Migration files directory

### AI & External Services
- `server/ai.ts` - AI service integration (4.3KB)
- `server/anthropic.ts` - Anthropic AI integration (6.1KB)
- `server/firebase.ts` - Firebase configuration (5.3KB)

### File Management
- `server/fileService.ts` - File handling service (3.5KB)

### Configuration Files
- `server/package.json` - Backend dependencies and scripts
- `server/tsconfig.json` - TypeScript configuration
- `server/vite.ts` - Vite configuration for server (2.3KB)
- `server/vitest.config.ts` - Vitest configuration (259B)

## 🔥 Firebase Functions

### Cloud Functions
- **Entry Points**
  - `functions/index.js` - Main functions entry point
  - `functions/package.json` - Functions dependencies

### Configuration
- `firebase.json` - Firebase project configuration
- `firestore.rules` - Firestore security rules
- `storage.rules` - Storage security rules

## 🔗 Shared Code

### Types & Schemas
- `shared/schema.ts` - Shared data schemas (9.4KB)
- `shared/wiseup-schema.ts` - WiseUp-specific schemas (4.0KB)
- `shared/job-types.ts` - Job-related type definitions (3.0KB)

## 🗄️ Database

### Schema & Migrations
- `database/schema-optimization.sql` - Database optimization scripts
- `migrations/` - Database migration files
  - `0001_add_files_table.sql` - Files table migration
  - `0002_add_wiseup_tables.sql` - WiseUp tables migration
  - `0003_add_missing_tables.sql` - Missing tables migration
  - `0004_payment_subscription_system.sql` - Payment system migration
  - `0005_update_users_table.sql` - Users table update

### Database Files
- `database.db` - SQLite database file
- `workwise.db` - Alternative database file
- `test.db` - Test database file

## 🛠️ Scripts & Tools

### Development & Container Scripts
- `scripts/dev-container.sh` - Development container management (1.4KB)

### Validation & Security Scripts
- `scripts/validate-firebase.js` - Firebase configuration validation (7.2KB)
- `scripts/validate-netlify-config.js` - Netlify config validation (5.1KB)
- `scripts/validate-security.js` - Security validation (4.0KB)
- `scripts/sanitize-env.js` - Environment variable sanitization (4.8KB)

### Build & Optimization Scripts
- `scripts/vite-bundle-analyzer.js` - Bundle analysis (2.0KB)
- `scripts/optimize-build.js` - Build optimization (908B)
- `scripts/analyze-bundle.js` - Bundle analysis (2.0KB)

### Deployment Scripts
- `scripts/firebase-deploy.js` - Firebase deployment (3.7KB)
- `scripts/netlify-post-build.js` - Netlify post-build (3.9KB)
- `scripts/prepare-netlify-deploy.js` - Netlify deployment prep (5.4KB)
- `scripts/fast-deploy.js` - Quick deployment (1.9KB)

### Testing & Development Scripts
- `scripts/test-auth-persistence.js` - Auth persistence testing (3.8KB)
- `scripts/test-deployment.js` - Deployment testing (4.2KB)
- `scripts/test-email-link-auth.js` - Email auth testing (3.3KB)
- `scripts/create-test-users.js` - Test user creation (3.2KB)

### Database Scripts
- `scripts/generate-migration.ts` - Migration generation (705B)
- `scripts/generate-migrations.ts` - Multiple migration generation (925B)
- `scripts/run-migrations.js` - Migration execution (4.8KB)
- `scripts/run-migrations.ts` - TypeScript migration runner (1.9KB)

### Firebase & Emulator Scripts
- `scripts/start-with-emulator-check.js` - Emulator startup (3.7KB)
- `scripts/check-emulators.js` - Emulator status check (1.6KB)
- `scripts/check-firebase-config.js` - Firebase config check (2.5KB)

### Environment Scripts
- `scripts/setup-production-env.js` - Production environment setup (2.6KB)

## 📚 Documentation

### Project Documentation
- `README.md` - Main project readme
- `DEV_CONTAINER_README.md` - Development container guide
- `CODEBASE_INDEX.md` - This comprehensive codebase index
- `ACCESSIBILITY_IMPLEMENTATION_PLAN.md` - Accessibility plan
- `BACKEND_IMPROVEMENTS.md` - Backend improvement notes
- `BUNDLE_OPTIMIZATION_GUIDE.md` - Bundle optimization guide
- `CLOUDFLARE_SETUP.md` - Cloudflare configuration
- `COMPANIES_PAGE_DEMO.md` - Companies page demo
- `ENV_ANALYSIS_REPORT.md` - Environment analysis
- `FIREBASE_UPDATE_SUMMARY.md` - Firebase updates
- `NETLIFY_DEPLOYMENT_GUIDE.md` - Netlify deployment
- `PROFILE_IMPLEMENTATION_REPORT.md` - Profile implementation
- `QA_PROCESS.md` - Quality assurance process
- `TIERED_JOB_ACCESS_IMPLEMENTATION.md` - Job access implementation

### Implementation Plans
- `docs/implementation-plans/` - Detailed implementation plans
- `docs/guides/` - Development guides

## 🧪 Testing

### Test Configuration
- `jest.config.js` - Jest testing configuration
- `vitest.config.ts` - Vitest configuration
- `playwright.config.ts` - Playwright E2E testing
- `tests/e2e/` - End-to-end tests

### Test Files
- `test-*.js` - Various test scripts
- `tests/` - Test directory structure

## 🚀 Deployment & Infrastructure

### Deployment Configurations
- `netlify.toml` - Netlify deployment configuration
- `netlify/functions/` - Netlify serverless functions
- `firebase.json` - Firebase configuration
- `lighthouserc.json` - Lighthouse CI configuration

### Environment Files
- `.env` - Environment variables
- `requirements.txt` - Python dependencies (for scrapers)

## 🔍 Search & Navigation

### Key Search Terms
- **Authentication**: `auth`, `login`, `signup`, `firebase`
- **Jobs**: `job`, `career`, `employment`, `wiseup`
- **Profile**: `profile`, `user`, `account`, `settings`
- **Companies**: `company`, `employer`, `business`
- **Database**: `database`, `schema`, `migration`, `prisma`
- **API**: `api`, `endpoint`, `route`, `controller`
- **UI Components**: `component`, `ui`, `layout`, `form`

### File Type Patterns
- **React Components**: `*.tsx`, `*.jsx`
- **TypeScript**: `*.ts`
- **JavaScript**: `*.js`
- **Configuration**: `*.json`, `*.config.*`, `*.toml`
- **Documentation**: `*.md`
- **Database**: `*.sql`, `*.db`
- **Styles**: `*.css`, `*.scss`

## 📊 Code Statistics

### File Counts by Type
- **TypeScript/TSX**: ~350 files (React components, utilities)
- **JavaScript**: ~50 files (scripts, configurations)
- **Configuration**: ~20 files (package.json, config files)
- **Documentation**: ~15 files (README, guides)
- **Database**: ~10 files (schemas, migrations)
- **Styles**: ~5 files (CSS, Tailwind config)

### Main Technologies
- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, TypeScript
- **Database**: SQLite, Prisma, Firebase Firestore
- **Cloud**: Firebase Functions, Netlify Functions
- **Testing**: Jest, Vitest, Playwright
- **Build Tools**: Vite, Webpack, Babel

## 🎯 Development Workflow

### Getting Started
1. **Setup**: Use development container (`./scripts/dev-container.sh start`)
2. **Install**: Dependencies are pre-installed in container
3. **Develop**: Use VS Code Dev Containers for best experience
4. **Test**: Run tests with configured testing frameworks
5. **Build**: Use Vite for frontend, Node.js for backend
6. **Deploy**: Use Netlify for frontend, Firebase for backend

### Key Commands
```bash
# Development
./scripts/dev-container.sh start
./scripts/dev-container.sh shell

# Frontend
cd client && npm run dev

# Backend
cd server && npm run dev

# Functions
cd functions && npm run dev

# Testing
npm test
npm run test:e2e
```

## 🔧 Key Features & Components

### Job Management System
- Job distribution and recommendation algorithms
- AI-powered job matching
- Tiered access control system

### File Management
- File upload and storage services
- Firebase Storage integration
- File processing and validation

### AI Integration
- Anthropic AI integration
- Job recommendation AI
- Content analysis and processing

### Authentication & Security
- Firebase Authentication
- Email link authentication
- Role-based access control

---

**This index provides a comprehensive overview of the WorkWise codebase structure. Use it to quickly locate files, understand the architecture, and navigate the project effectively.**
