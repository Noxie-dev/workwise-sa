# React Query Enhancement for WorkWise SA

## Overview

This enhancement provides a **production-ready React Query API layer** for WorkWise SA, specifically optimized for job operations. It replaces the previous axios-based approach with a modern, fetch-based solution that integrates seamlessly with your Netlify functions.

## 🚀 What's New

### ✅ **Enhanced Query Client Configuration**
- **Better defaults** for job operations (30s stale time, 5min GC)
- **Smart retry logic** (2 retries for queries, 1 for mutations)
- **Optimized caching** for different data types

### ✅ **Modern API Layer**
- **Fetch-based** (no axios dependency)
- **Enhanced error handling** with user-friendly messages
- **Type-safe** request/response handling
- **Netlify functions integration** out of the box

### ✅ **Specialized Job Hooks**
- **`useJobPreviews`** - Search and filter jobs
- **`useJobDetails`** - Get full job information (authenticated)
- **`useSubmitApplication`** - Apply for jobs
- **`useUserApplications`** - View user's applications
- **`useFeaturedJobs`** - Get featured job listings
- **`useRecentJobs`** - Get recent job postings

### ✅ **Type Safety**
- **Comprehensive TypeScript types** for all job operations
- **API response types** that match your Netlify functions
- **Strict type checking** for better development experience

## 📁 File Structure

```
client/src/
├── lib/
│   ├── queryClient.tsx          # Enhanced query client configuration
│   └── api.ts                   # Modern fetch-based API layer
├── types/
│   └── jobs.ts                  # Comprehensive job type definitions
├── hooks/
│   └── useJobs.ts               # Specialized job operation hooks
└── components/Jobs/
    └── JobsPage.tsx             # Example implementation
```

## 🔧 Installation & Setup

### 1. **Query Client Provider** (Already configured in main.tsx)

Your app is already wrapped with the enhanced QueryClientProvider:

```tsx
// client/src/main.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
```

### 2. **Environment Variables**

Ensure your `.env` file has:

```bash
# For local development with Netlify functions
VITE_API_BASE=/.netlify/functions

# For production (if different)
# VITE_API_BASE=https://your-domain.com/.netlify/functions
```

## 📖 Usage Examples

### **Basic Job Search**

```tsx
import { useJobPreviews } from '@/hooks/useJobs';

function JobSearch() {
  const { data, isLoading, error } = useJobPreviews({
    query: 'React Developer',
    location: 'Cape Town',
    limit: 20
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.jobs.map(job => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
```

### **Job Details with Authentication**

```tsx
import { useJobDetails } from '@/hooks/useJobs';

function JobDetailsPage({ jobId }: { jobId: number }) {
  const { data: job, isLoading } = useJobDetails(jobId);

  if (isLoading) return <div>Loading job details...</div>;
  if (!job) return <div>Job not found</div>;

  return (
    <div>
      <h1>{job.title}</h1>
      <p>{job.company.name}</p>
      <div>{job.details.fullDescription}</div>
    </div>
  );
}
```

### **Job Application**

```tsx
import { useSubmitApplication } from '@/hooks/useJobs';

function ApplyButton({ jobId }: { jobId: number }) {
  const applyMutation = useSubmitApplication();

  const handleApply = () => {
    applyMutation.mutate({
      jobId,
      coverLetter: 'I am excited about this opportunity...',
      resumeUrl: 'https://example.com/resume.pdf'
    });
  };

  return (
    <button 
      onClick={handleApply}
      disabled={applyMutation.isPending}
    >
      {applyMutation.isPending ? 'Applying...' : 'Apply Now'}
    </button>
  );
}
```

### **Featured Jobs Sidebar**

```tsx
import { useFeaturedJobs } from '@/hooks/useJobs';

function FeaturedJobsSidebar() {
  const { data: featuredJobs } = useFeaturedJobs(6);

  return (
    <div>
      <h3>Featured Jobs</h3>
      {featuredJobs?.jobs.map(job => (
        <div key={job.id}>
          <h4>{job.title}</h4>
          <p>{job.company.name}</p>
        </div>
      ))}
    </div>
  );
}
```

## 🎯 Advanced Features

### **Smart Caching**

Each hook has optimized caching strategies:

- **Job Previews**: 30 seconds (jobs change frequently)
- **Job Details**: 5 minutes (details are more stable)
- **User Applications**: 2 minutes (applications can change)
- **Featured Jobs**: 5 minutes (curated content)

### **Automatic Query Invalidation**

When you submit an application, related queries are automatically invalidated:

```tsx
const applyMutation = useSubmitApplication();

// This automatically refreshes:
// - Job previews
// - Job details for the specific job
// - User's application list
```

### **Error Handling**

Enhanced error messages for common HTTP status codes:

- **401**: "Authentication required. Please sign in to continue."
- **403**: "Access denied. You don't have permission to perform this action."
- **404**: "Resource not found. The requested item may have been removed."
- **429**: "Too many requests. Please try again later."
- **500**: "Server error. Please try again later or contact support."

### **Search & Filtering**

Comprehensive search and filtering capabilities:

```tsx
const { data } = useJobPreviews({
  query: 'React Developer',
  categoryId: 1,
  location: 'Cape Town',
  jobType: 'Full-time',
  workMode: 'Remote',
  experienceLevel: 'mid',
  featured: true,
  page: 1,
  limit: 20
});
```

## 🔄 Migration from Old System

### **Before (Axios-based)**

```tsx
// Old way
import api from '@/lib/api';

const response = await api.get('/jobs');
const jobs = response.data;
```

### **After (React Query + Fetch)**

```tsx
// New way
import { useJobPreviews } from '@/hooks/useJobs';

const { data: jobs, isLoading, error } = useJobPreviews();
```

### **Benefits of Migration**

1. **Automatic caching** and background updates
2. **Loading and error states** handled automatically
3. **Optimistic updates** for better UX
4. **Automatic retries** on network failures
5. **Query invalidation** when data changes
6. **Better performance** with smart caching

## 🧪 Testing

### **Mocking in Tests**

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { useJobPreviews } from '@/hooks/useJobs';

// Mock the API
jest.mock('@/lib/api', () => ({
  get: jest.fn()
}));

function TestComponent() {
  const { data } = useJobPreviews();
  return <div>{data?.jobs.length || 0} jobs</div>;
}

test('renders job count', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });

  render(
    <QueryClientProvider client={queryClient}>
      <TestComponent />
    </QueryClientProvider>
  );

  expect(screen.getByText('0 jobs')).toBeInTheDocument();
});
```

## 🚨 Troubleshooting

### **Common Issues**

1. **CORS Errors**: Ensure your Netlify functions have proper CORS headers
2. **Authentication Errors**: Check that Firebase tokens are being sent correctly
3. **Type Errors**: Ensure all types are properly imported and used

### **Debug Mode**

Enable React Query DevTools in development:

```tsx
// Already configured in main.tsx
{process.env.NODE_ENV === 'development' && (
  <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
)}
```

## 📚 API Reference

### **useJobPreviews(params?)**
- **Purpose**: Fetch job previews with search and filtering
- **Cache Time**: 30 seconds
- **Parameters**: `JobSearchParams` object
- **Returns**: `{ data, isLoading, error, isFetching }`

### **useJobDetails(id)**
- **Purpose**: Fetch full job details (authenticated users only)
- **Cache Time**: 5 minutes
- **Parameters**: `jobId: number`
- **Returns**: `{ data, isLoading, error }`

### **useSubmitApplication()**
- **Purpose**: Submit job applications
- **Retry**: 1 time
- **Returns**: `{ mutate, isPending, error }`

### **useUserApplications()**
- **Purpose**: Fetch user's job applications
- **Cache Time**: 2 minutes
- **Returns**: `{ data, isLoading, error }`

## 🔮 Future Enhancements

- **Real-time updates** with WebSocket integration
- **Offline support** with React Query's offline capabilities
- **Advanced caching** with custom cache keys
- **Performance monitoring** with React Query's built-in metrics

## 📞 Support

For questions or issues with this implementation:

1. Check the React Query documentation: https://tanstack.com/query
2. Review the TypeScript types in `src/types/jobs.ts`
3. Examine the example implementation in `src/components/Jobs/JobsPage.tsx`
4. Check your browser's Network tab for API call details

---

**This enhancement makes WorkWise SA's job board faster, more reliable, and easier to maintain! 🚀**

