# Employer Dashboard

A comprehensive dashboard for employers to manage their job postings and track applications on WorkWise SA.

## Features

### Overview Tab
- **Statistics Cards**: Display key metrics including:
  - Total Jobs Posted
  - Active Jobs
  - Total Applications Received
  - Total Job Views
- **Charts**: Visual representation of data including:
  - Applications over time (Line Chart)
  - Job performance by views and applications (Bar Chart)
- **Recent Activity**: Timeline of recent applications and job interactions

### Manage Jobs Tab
- **Job Listings**: View all posted jobs with status indicators
- **Job Actions**: Quick actions for each job:
  - View job details
  - Edit job posting
  - View applications
  - View analytics
- **Status Filtering**: Filter jobs by status (Active, Paused, Closed, Draft)
- **Empty State**: Helpful message when no jobs are posted with quick action to post first job

### Applications Tab
- **Coming Soon**: Application management features in development
- Placeholder for future functionality to review and manage job applications

### Analytics Tab
- **Coming Soon**: Advanced analytics features in development
- Placeholder for detailed insights into job posting performance

## Technical Features

### Data Management
- **Real-time Data**: Uses React Query for efficient data fetching and caching
- **Mock Data Fallback**: Graceful fallback to mock data when API is unavailable
- **Loading States**: Skeleton loading components for better UX
- **Error Handling**: Comprehensive error handling with user-friendly messages

### User Experience
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Tabbed Interface**: Organized content in easy-to-navigate tabs
- **Filter Controls**: Date range and status filters for customized views
- **Export Functionality**: Export dashboard data as CSV

### Analytics Integration
- **User Tracking**: Comprehensive analytics tracking for user interactions
- **Page Views**: Track dashboard visits
- **Tab Changes**: Monitor user navigation patterns
- **Filter Usage**: Track how users interact with filters
- **Job Actions**: Monitor job management activities

## Components

### Main Components
- `EmployerDashboard.tsx` - Main dashboard component
- `JobManagementChart.tsx` - Bar chart for job performance visualization
- `ApplicationsChart.tsx` - Line chart for applications over time

### Services
- `employerDashboardService.ts` - API service for dashboard data
- Integration with existing `analyticsService.ts` for user tracking

## Usage

The Employer Dashboard is accessible at `/employers/dashboard` and requires user authentication.

### Navigation
Employers can navigate to the dashboard from:
- Header navigation (when logged in as employer)
- Direct URL access
- Post Job completion flow
- Employer-specific landing pages

### Data Flow
1. User authentication check
2. Fetch dashboard statistics and recent activity
3. Fetch employer's job listings
4. Display data with loading states
5. Enable filtering and export functionality

## Future Enhancements

### Planned Features
- **Application Management**: Full application review and management system
- **Advanced Analytics**: Detailed performance insights and reporting
- **Candidate Communication**: In-dashboard messaging system
- **Job Performance Optimization**: AI-powered suggestions for improving job posts
- **Bulk Job Management**: Multi-select operations for job management
- **Notification System**: Real-time alerts for new applications and job status changes

### Technical Improvements
- **Real-time Updates**: WebSocket integration for live data updates
- **Advanced Filtering**: More granular filtering options
- **Data Visualization**: Additional chart types and interactive visualizations
- **Mobile App**: Dedicated mobile application for on-the-go job management

## Testing

The component includes comprehensive tests covering:
- Component rendering
- Data fetching and display
- User authentication handling
- Tab navigation
- Error states
- Loading states

Run tests with:
```bash
npm test EmployerDashboard.test.tsx
```

## Dependencies

- React Query for data management
- Recharts for data visualization
- React Router (Wouter) for navigation
- React Helmet for SEO
- Tailwind CSS for styling
- Lucide React for icons
