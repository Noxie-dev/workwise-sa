# WorkWise SA

WorkWise SA is a comprehensive job search platform designed to connect job seekers with employers in South Africa, offering career resources and CV building tools.

## Features

- User authentication (Email/Password, Email Link, and Google Sign-In)
- Job search and filtering
- Company listings
- CV builder
- Career resources
- User profiles
- WiseUp learning platform with bookmark functionality

## Tech Stack

- **Frontend**: React, Vite, TailwindCSS, shadcn/ui, React Query
- **Backend**: Node.js, Express
- **Authentication**: Firebase Authentication
- **Database**: PostgreSQL (production), SQLite (development)
- **ORM**: Drizzle ORM

## Getting Started

### Prerequisites

- Node.js (v16 or newer)
- npm or yarn

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

4. Start the development server:
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

- **Style Guide**: ESLint with Airbnb config and Prettier for consistent formatting
- **Testing**: Jest and React Testing Library with ≥80% coverage requirement
- **Security**: Snyk for static analysis and dependency scanning

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## WiseUp Bookmark Functionality

The WiseUp feature includes a comprehensive bookmark system that allows users to save and organize content for later viewing.

### How to Use the Bookmark Functionality

1. **Saving Content**:
   - When viewing content in the WiseUp feature, click the "Bookmark" button to save items for later
   - The button will toggle between "Bookmark" and "Bookmarked" states
   - Both educational content and sponsored content (ads) can be bookmarked

2. **Accessing Bookmarks**:
   - Click the bookmark icon in the WiseUp header to navigate to your bookmarks page
   - The bookmarks page displays all saved items in a responsive grid layout
   - Items are sorted with the most recently bookmarked items appearing first

3. **Managing Bookmarks**:
   - On the bookmarks page, you can:
     - Click on a bookmark card to view the content
     - Click the remove button (X) to remove a bookmark
     - Load more bookmarks if there are more than the initial page size (pagination)

4. **Direct Navigation**:
   - When clicking on a bookmark card, you are taken directly to the WiseUp page with that specific item loaded
   - This allows for quick access to your saved content without having to search for it again

5. **Authentication**:
   - You must be logged in to use the bookmark functionality
   - If you try to bookmark content while not logged in, you'll be prompted to sign in

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the UI components
- [Firebase](https://firebase.google.com/) for authentication services