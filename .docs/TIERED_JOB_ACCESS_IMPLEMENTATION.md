# Tiered Job Access Implementation Guide

## Overview
This system allows anonymous users to browse basic job information but requires authentication for full job details and applications.

## Data Structure

### 1. Jobs Collection (Public Preview)
**Collection**: `jobs`
**Access**: Public read, admin write
**Contains**: Basic job information for browsing

```typescript
interface JobPreview {
  id: string;
  title: string;
  company: string;
  location: string;
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship';
  category: string;
  salaryRange?: string; // Optional, can be hidden for anonymous users
  postedDate: Date;
  isRemote: boolean;
  experienceLevel: 'entry' | 'mid' | 'senior';
  shortDescription: string; // Truncated description (100-150 chars)
  tags: string[];
  featured: boolean;
  // NO sensitive information like full description, requirements, etc.
}
```

### 2. Job Details Collection (Authenticated Only)
**Collection**: `job_details`
**Access**: Authenticated users only
**Contains**: Full job specifications

```typescript
interface JobDetails {
  id: string; // Same as job ID
  fullDescription: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  applicationInstructions: string;
  contactEmail?: string;
  applicationDeadline?: Date;
  companyDetails: {
    about: string;
    website?: string;
    size?: string;
    industry: string;
  };
  salaryDetails?: {
    min?: number;
    max?: number;
    currency: string;
    negotiable: boolean;
  };
}
```

### 3. Job Applications Collection
**Collection**: `job_applications`
**Access**: User's own applications + admin
**Contains**: Application data

```typescript
interface JobApplication {
  id: string;
  jobId: string;
  userId: string;
  appliedAt: Date;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired';
  coverLetter?: string;
  resumeUrl?: string;
  customAnswers?: Record<string, string>; // For custom application questions
}
```

## Frontend Implementation

### 1. Job Search/Browse Component (Anonymous + Authenticated)

```typescript
// components/JobSearch.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface JobSearchProps {
  showAuthPrompt?: boolean;
}

export const JobSearch: React.FC<JobSearchProps> = ({ showAuthPrompt = true }) => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobPreviews();
  }, []);

  const fetchJobPreviews = async () => {
    try {
      // This fetches from the public 'jobs' collection
      const response = await fetch('/api/jobs');
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJobClick = (jobId: string) => {
    if (!user && showAuthPrompt) {
      // Show authentication prompt
      showAuthModal(jobId);
    } else {
      // Navigate to full job details
      navigate(`/jobs/${jobId}`);
    }
  };

  return (
    <div className="job-search">
      {jobs.map(job => (
        <JobPreviewCard 
          key={job.id} 
          job={job} 
          onClick={() => handleJobClick(job.id)}
          showAuthPrompt={!user && showAuthPrompt}
        />
      ))}
    </div>
  );
};
```

### 2. Job Preview Card Component

```typescript
// components/JobPreviewCard.tsx
interface JobPreviewCardProps {
  job: JobPreview;
  onClick: () => void;
  showAuthPrompt: boolean;
}

export const JobPreviewCard: React.FC<JobPreviewCardProps> = ({ 
  job, 
  onClick, 
  showAuthPrompt 
}) => {
  return (
    <div className="job-card" onClick={onClick}>
      <div className="job-header">
        <h3>{job.title}</h3>
        <span className="company">{job.company}</span>
      </div>
      
      <div className="job-meta">
        <span>{job.location}</span>
        <span>{job.jobType}</span>
        <span>{job.experienceLevel}</span>
      </div>
      
      <p className="short-description">{job.shortDescription}</p>
      
      <div className="job-tags">
        {job.tags.slice(0, 3).map(tag => (
          <span key={tag} className="tag">{tag}</span>
        ))}
      </div>
      
      {showAuthPrompt && (
        <div className="auth-prompt">
          <p>Sign up to view full details and apply</p>
          <button className="btn-primary">View Full Job</button>
        </div>
      )}
      
      {!showAuthPrompt && (
        <button className="btn-secondary">View Details</button>
      )}
    </div>
  );
};
```

### 3. Full Job Details Page (Authenticated Only)

```typescript
// pages/JobDetails.tsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AuthGuard } from '@/components/AuthGuard';

export const JobDetailsPage: React.FC = () => {
  const { jobId } = useParams();
  const { user } = useAuth();
  const [job, setJob] = useState<JobPreview | null>(null);
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (jobId) {
      fetchJobData(jobId);
    }
  }, [jobId]);

  const fetchJobData = async (id: string) => {
    try {
      // Fetch basic job info (public)
      const jobResponse = await fetch(`/api/jobs/${id}`);
      const jobData = await jobResponse.json();
      setJob(jobData);

      // Fetch detailed info (requires auth)
      if (user) {
        const detailsResponse = await fetch(`/api/job-details/${id}`, {
          headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`
          }
        });
        const detailsData = await detailsResponse.json();
        setJobDetails(detailsData);
      }
    } catch (error) {
      console.error('Error fetching job data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="job-details-page">
        {job && (
          <>
            <JobHeader job={job} />
            {jobDetails && (
              <>
                <JobDescription details={jobDetails} />
                <JobRequirements details={jobDetails} />
                <CompanyInfo details={jobDetails} />
                <ApplicationSection jobId={job.id} />
              </>
            )}
          </>
        )}
      </div>
    </AuthGuard>
  );
};
```

### 4. Authentication Guard Component

```typescript
// components/AuthGuard.tsx
import { useAuth } from '@/hooks/useAuth';
import { AuthPrompt } from './AuthPrompt';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  fallback 
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return fallback || <AuthPrompt />;
  }

  return <>{children}</>;
};
```

## Backend API Implementation

### 1. Jobs API (Public)

```typescript
// api/jobs.ts
export async function GET(request: Request) {
  try {
    // Return only preview data - no sensitive information
    const jobs = await db.collection('jobs')
      .where('active', '==', true)
      .orderBy('postedDate', 'desc')
      .limit(50)
      .get();

    const jobPreviews = jobs.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return Response.json(jobPreviews);
  } catch (error) {
    return Response.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}
```

### 2. Job Details API (Authenticated)

```typescript
// api/job-details/[id].ts
import { verifyAuthToken } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Verify authentication
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = await verifyAuthToken(token);
    if (!user) {
      return Response.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Fetch full job details
    const jobDetails = await db.collection('job_details')
      .doc(params.id)
      .get();

    if (!jobDetails.exists) {
      return Response.json({ error: 'Job not found' }, { status: 404 });
    }

    return Response.json({
      id: jobDetails.id,
      ...jobDetails.data()
    });
  } catch (error) {
    return Response.json({ error: 'Failed to fetch job details' }, { status: 500 });
  }
}
```

## User Experience Flow

### Anonymous User Journey:
1. **Browse Jobs**: See job titles, companies, locations, basic info
2. **Click Job**: Prompted to sign up/login to view full details
3. **Auth Prompt**: "Sign up to see full job description and apply"
4. **Sign Up**: Complete registration
5. **Full Access**: View complete job details and apply

### Authenticated User Journey:
1. **Browse Jobs**: See same preview cards
2. **Click Job**: Direct access to full job details
3. **View Details**: Complete job description, requirements, benefits
4. **Apply**: Submit application with resume and cover letter

## Benefits of This Approach

✅ **Lead Generation**: Encourages user registration
✅ **SEO Friendly**: Job previews are publicly accessible
✅ **User Experience**: Smooth transition from browsing to applying
✅ **Data Protection**: Sensitive job info protected behind auth
✅ **Scalable**: Easy to adjust what's public vs. private
✅ **Analytics**: Track conversion from anonymous to registered users

## Implementation Steps

1. **Update Database Schema**: Create separate collections for jobs and job_details
2. **Update Firestore Rules**: Already done ✅
3. **Create API Endpoints**: Public jobs API + authenticated job-details API
4. **Update Frontend Components**: Implement tiered access UI
5. **Add Authentication Guards**: Protect sensitive routes
6. **Test User Flows**: Verify anonymous and authenticated experiences
7. **Analytics**: Track conversion rates from preview to signup

This implementation gives you the perfect balance of public accessibility for SEO and lead generation while protecting detailed job information and applications behind authentication.