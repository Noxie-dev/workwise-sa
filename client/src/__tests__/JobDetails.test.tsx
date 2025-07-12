import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Router } from 'wouter';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import JobDetails from '../pages/JobDetails';
import { jobsService } from '../services/jobsService';
import { AuthProvider } from '../contexts/AuthContext';
import { JobWithCompany } from '@shared/schema';

// Mock the services
vi.mock('../services/jobsService');
vi.mock('../contexts/AuthContext');

// Mock wouter router
vi.mock('wouter', async () => {
  const actual = await vi.importActual('wouter');
  return {
    ...actual,
    useParams: () => ({ id: '1' }),
    useLocation: () => ['/jobs/1', vi.fn()],
  };
});

// Sample job data for testing
const mockJob: JobWithCompany = {
  id: 1,
  title: 'Software Developer',
  description: 'We are looking for a skilled software developer to join our team. You will be responsible for developing and maintaining web applications using modern technologies.',
  location: 'Cape Town, South Africa',
  salary: 'R35,000 - R50,000',
  jobType: 'Full-time',
  workMode: 'Hybrid',
  companyId: 1,
  categoryId: 1,
  isFeatured: true,
  createdAt: '2024-01-15T10:00:00.000Z',
  company: {
    id: 1,
    name: 'TechCorp Solutions',
    logo: 'https://example.com/logo.png',
    location: 'Cape Town, South Africa',
    slug: 'techcorp-solutions',
    openPositions: 5,
  }
};

describe('JobDetails', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Mock the auth context
    vi.mocked(AuthProvider).mockImplementation(({ children }) => (
      <div>{children}</div>
    ));
  });

  const renderJobDetails = () => {
    return render(
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Router>
              <JobDetails />
            </Router>
          </AuthProvider>
        </QueryClientProvider>
      </HelmetProvider>
    );
  };

  it('renders loading state initially', () => {
    vi.mocked(jobsService.getJobById).mockImplementation(() => 
      new Promise(() => {}) // Never resolves
    );

    renderJobDetails();

    expect(screen.getByText('Back to Jobs')).toBeInTheDocument();
    // Should show skeleton loading
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders job details when data is loaded', async () => {
    vi.mocked(jobsService.getJobById).mockResolvedValue(mockJob);

    renderJobDetails();

    await waitFor(() => {
      expect(screen.getByText('Software Developer')).toBeInTheDocument();
      expect(screen.getByText('TechCorp Solutions')).toBeInTheDocument();
      expect(screen.getByText('Cape Town, South Africa')).toBeInTheDocument();
      expect(screen.getByText('R35,000 - R50,000')).toBeInTheDocument();
      expect(screen.getByText('Full-time')).toBeInTheDocument();
      expect(screen.getByText('Hybrid')).toBeInTheDocument();
      expect(screen.getByText('Featured')).toBeInTheDocument();
    });
  });

  it('displays job description', async () => {
    vi.mocked(jobsService.getJobById).mockResolvedValue(mockJob);

    renderJobDetails();

    await waitFor(() => {
      expect(screen.getByText(/We are looking for a skilled software developer/)).toBeInTheDocument();
    });
  });

  it('shows company information', async () => {
    vi.mocked(jobsService.getJobById).mockResolvedValue(mockJob);

    renderJobDetails();

    await waitFor(() => {
      expect(screen.getByText('About TechCorp Solutions')).toBeInTheDocument();
      expect(screen.getByText('5 open positions at this company')).toBeInTheDocument();
    });
  });

  it('displays action buttons', async () => {
    vi.mocked(jobsService.getJobById).mockResolvedValue(mockJob);

    renderJobDetails();

    await waitFor(() => {
      expect(screen.getAllByText('Apply Now')[0]).toBeInTheDocument();
      expect(screen.getByText('Save Job')).toBeInTheDocument();
      expect(screen.getByText('Share Job')).toBeInTheDocument();
    });
  });

  it('shows error state when job is not found', async () => {
    vi.mocked(jobsService.getJobById).mockRejectedValue(new Error('Job not found'));

    renderJobDetails();

    await waitFor(() => {
      expect(screen.getByText(/Failed to load job details/)).toBeInTheDocument();
    });
  });

  it('displays job posting date', async () => {
    vi.mocked(jobsService.getJobById).mockResolvedValue(mockJob);

    renderJobDetails();

    await waitFor(() => {
      // Should show relative time (e.g., "months ago")
      expect(screen.getByText(/ago/)).toBeInTheDocument();
      // Should show formatted date
      expect(screen.getByText(/January/)).toBeInTheDocument();
    });
  });

  it('shows help and support section', async () => {
    vi.mocked(jobsService.getJobById).mockResolvedValue(mockJob);

    renderJobDetails();

    await waitFor(() => {
      expect(screen.getByText('Need Help?')).toBeInTheDocument();
      expect(screen.getByText('Contact Support')).toBeInTheDocument();
      expect(screen.getByText('Application Tips')).toBeInTheDocument();
      expect(screen.getByText('Report Issue')).toBeInTheDocument();
    });
  });
});
