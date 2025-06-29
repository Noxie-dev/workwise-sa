# WorkWise SA: Your Intelligent Career Partner

**WorkWise SA** is a cutting-edge, AI-powered job search and career development platform meticulously crafted for the South African market. It goes beyond a simple job board, offering a comprehensive suite of tools to empower job seekers, from building the perfect CV to landing their dream job and advancing their skills. Our intelligent algorithms connect the right talent with the right opportunities, making the job hunt smarter, not harder.

## Core Features

WorkWise SA is packed with features designed to support you at every stage of your career journey.

*   **Advanced User Authentication:** Secure and flexible sign-in options, including:
    *   Email & Password
    *   Passwordless Email Link
    *   Google Sign-In (OAuth 2.0)

*   **Intelligent Job Search:**
    *   Dynamic search and filtering based on keywords, location, and job type.
    *   AI-powered job recommendations that match your skills and experience.

*   **In-Depth Company Listings:**
    *   Browse company profiles, view available positions, and gain insights into potential employers.

*   **AI-Powered CV Builder:**
    *   Create a professional, polished CV from scratch with our step-by-step builder.
    *   Receive an AI-driven score on your CV'''s completeness and keyword optimization.
    *   Upload an existing CV for analysis and improvement suggestions.

*   **WiseUp Learning Platform:**
    *   Access a curated library of career resources, articles, and tips.
    *   Bookmark valuable content to create a personalized learning path.
    *   Content is organized and easily accessible, allowing you to learn at your own pace.

*   **Personalized User Profiles:**
    *   Manage your personal information, work experience, skills, and education.
    *   Your profile data is used to power our job recommendation engine.

## Key Algorithms and Logic

Our platform leverages several key algorithms to provide a personalized and effective experience.

*   **Job Recommendation Algorithm (Content-Based Filtering):**
    *   **Objective:** To suggest the most relevant jobs to users based on their profile and the job descriptions.
    *   **Process:**
        1.  **Keyword Extraction:** We use Natural Language Processing (NLP) techniques to extract key skills, technologies, and qualifications from both the user'''s profile (CV, skills section) and the job listings.
        2.  **Vector Representation:** The extracted keywords are converted into numerical vectors.
        3.  **Cosine Similarity:** The algorithm calculates the cosine similarity between the user'''s profile vector and the vectors of all available jobs.
        4.  **Ranking:** Jobs are ranked by their similarity score, and the top matches are presented to the user as recommendations.

*   **CV Scoring Algorithm:**
    *   **Objective:** To provide users with actionable feedback on their CV'''s quality and completeness.
    *   **Process:**
        1.  **Section Analysis:** The algorithm checks for the presence and completeness of critical CV sections (e.g., Contact Information, Work Experience, Education, Skills).
        2.  **Keyword Matching:** When applying for a specific job, the CV is scanned for keywords present in the job description.
        3.  **Scoring:** A score is calculated based on the percentage of completed sections and the density of relevant keywords. This score helps users understand where they can improve their CV for better visibility.

*   **WiseUp Content Management:**
    *   **Bookmark Sorting:** The bookmarking feature in the WiseUp platform uses a simple but effective chronological sorting algorithm. Bookmarked items are displayed in a "last-in, first-out" (LIFO) order, ensuring that the most recently saved content is always the easiest to access.

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

1.  Download and extract the project files:
    ```
    cd workwisesa
    ```

2.  Install dependencies:
    ```
    npm install
    ```

3.  Setup environment variables:
    -   Copy the `.env.example` file to create your own `.env` files:
    ```bash
    cp .env.example .env
    cp .env.example client/.env
    ```
    -   Fill in the actual values for each environment variable
    -   See [ENV_SETUP.md](ENV_SETUP.md) for detailed instructions and explanations of all environment variables

4.  Start the development server:
    ```
    npm run dev
    ```
    -   Client runs on: http://localhost:5173 (or next available port)
    -   Server runs on: http://localhost:5000

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

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the UI components
- [Firebase](https://firebase.google.com/) for authentication services
