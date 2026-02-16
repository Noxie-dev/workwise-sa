# WorkWise SA

WorkWise SA is a comprehensive job search platform designed to connect job seekers with employers in South Africa, offering career resources and CV building tools.

## Features

- User authentication (Email/Password, Email Link, and Google Sign-In)
- Job search and filtering
- Company listings
- CV builder
- Career resources
- User profiles
- WiseUp learning platform (content available; bookmark flow currently in progress)

## Tech Stack

- **Frontend**: React, Vite, TailwindCSS, shadcn/ui, React Query
- **Backend**: Node.js (Express) with TypeScript
- **Authentication**: Firebase Authentication
- **Database**: PostgreSQL (production), SQLite (development/test)
- **ORM**: Drizzle ORM
- **Testing**: Vitest + React Testing Library; Playwright for end-to-end

## Getting Started

### Prerequisites

- Node.js (v16 or newer)
- npm or yarn
- Git with SSH authentication configured (recommended)

### Installation

1. Download and extract the project files:
   ```
   cd workwisesa
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Setup environment variables:
   - Copy the `.env.example` file to create your own `.env` files:
   ```bash
   cp .env.example .env
   cp .env.example client/.env
   ```
   - Fill in the actual values for each environment variable
   - See [ENV_SETUP.md](ENV_SETUP.md) for detailed instructions and explanations of all environment variables

4. (Optional) Set up SSH authentication for GitHub:
   ```bash
   npm run setup:ssh
   ```
   See [GitHub SSH Setup Guide](docs/GITHUB_SSH_SETUP.md) for detailed instructions.

5. Start the development server:
   ```
   npm run dev
   ```
   - Client runs on: http://localhost:5173 (or next available port)
   - Server runs on: http://localhost:3001

## Project Structure

```
workwisesa/
├── client/             # Frontend React app
│   ├── public/         # Static files
│   └── src/            # React source code
│       ├── components/ # UI components
│       ├── contexts/   # React contexts
│       ├── hooks/      # Custom hooks
│       ├── lib/        # Utilities and libraries
│       └── pages/      # Page components
├── server/             # Backend Express server
│   ├── controllers/    # API route controllers
│   ├── models/         # Database models
│   └── routes/         # API routes
└── public/             # Shared static assets
```

## Development Standards

### Coding Standards & Workflow

- **Style Guide**: ESLint (Airbnb) with Prettier
- **Testing**: Vitest + React Testing Library; Playwright for end-to-end checks
- **Quality Gates**: `npm run qa:quick` (lint + type-check + unit) and `npm run qa:all` (lint + type-check + coverage + e2e)

### Quick Commands

```bash
# Setup
npm run setup:ssh          # Configure SSH for GitHub
npm run verify:ssh         # Test SSH connection

# Development
npm run dev                 # Start development servers
npm run build              # Build for production
npm run test               # Run unit/integration tests (Vitest)
npm run test:coverage      # Unit/integration with coverage
npm run test:e2e           # Playwright E2E suite
npm run qa:quick           # Lint + type-check + unit
npm run qa:all             # Lint + type-check + coverage + E2E

# Environment
npm run env:check          # Check environment files
npm run env:sanitize       # Sanitize environment variables

# Deployment
npm run deploy:fast        # Fast deployment to Netlify
npm run deploy:prod        # Production deployment
npm run deploy:firebase    # Deploy to Firebase
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## WiseUp Status

- WiseUp cards/pages are present with sample data.
- Bookmark experience is partially implemented and currently in progress; expect mock/sample behavior until the API wiring is finished.

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the UI components

- [Firebase](https://firebase.google.com/) for authentication services
