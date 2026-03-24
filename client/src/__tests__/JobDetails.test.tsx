import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import JobDetails from '@/pages/JobDetails';
import { tieredJobsService } from '@/services/tieredJobsService';
import { useAuth } from '@/hooks/useAuth';

const mockNavigate = vi.fn();
const mockToast = vi.fn();

vi.mock('@/services/tieredJobsService', () => ({
  tieredJobsService: {
    getJobDetails: vi.fn(),
    applyForJob: vi.fn(),
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  HelmetProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('wouter', async () => {
  const actual = await vi.importActual<typeof import('wouter')>('wouter');
  return {
    ...actual,
    useParams: () => ({ id: '1' }),
    useLocation: () => ['/jobs/1', mockNavigate],
    Link: ({ children, href, ...props }: any) => (
      <a href={href} {...props}>
        {children}
      </a>
    ),
  };
});

const mockJob = {
  id: 1,
  title: 'Cashier',
  location: 'Cape Town',
  jobType: 'Full-time',
  workMode: 'On-site',
  category: {
    id: 1,
    name: 'Retail',
  },
  company: {
    id: 1,
    name: 'Retail SA',
    location: 'Cape Town',
    logo: null,
  },
  shortDescription: 'Front-of-store cashier role.',
  tags: ['Retail', 'Full-time'],
  postedDate: new Date('2026-03-20T00:00:00.000Z'),
  isRemote: false,
  experienceLevel: 'entry' as const,
  featured: true,
  details: {
    id: 1,
    fullDescription: 'Serve customers, process payments, and keep the checkout area tidy.',
    requirements: ['Customer service experience', 'Basic numeracy'],
    responsibilities: ['Process payments', 'Support customers'],
    benefits: ['Training provided', 'Growth opportunities'],
    applicationInstructions: 'Apply via WorkWise SA',
    companyDetails: {
      about: 'Retail SA is a growing retail employer.',
      industry: 'Retail',
      website: 'https://example.com',
      size: '50-100',
    },
    salaryDetails: {
      currency: 'ZAR',
      negotiable: true,
      displayText: 'R5 000 per month',
    },
    createdAt: new Date('2026-03-20T00:00:00.000Z'),
    updatedAt: new Date('2026-03-20T00:00:00.000Z'),
  },
};

function renderJobDetails() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return render(
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <JobDetails />
      </QueryClientProvider>
    </HelmetProvider>,
  );
}

describe('JobDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: 'user-1' },
      loading: false,
      isAuthenticated: true,
    } as any);
  });

  it('shows the auth guard for anonymous users', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: false,
      isAuthenticated: false,
    } as any);

    renderJobDetails();

    expect(screen.getByText('Authentication Required')).toBeInTheDocument();
    expect(screen.getByText('Please sign in to view full job details')).toBeInTheDocument();
  });

  it('renders job details for authenticated users', async () => {
    vi.mocked(tieredJobsService.getJobDetails).mockResolvedValue(mockJob as any);

    renderJobDetails();

    await waitFor(() => {
      expect(screen.getByText('Cashier')).toBeInTheDocument();
    });

    expect(screen.getByText('Retail SA')).toBeInTheDocument();
    expect(screen.getByText('Job Description')).toBeInTheDocument();
    expect(screen.getByText('Requirements')).toBeInTheDocument();
    expect(screen.getByText('Benefits & Perks')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /apply for this job/i })).toBeInTheDocument();
  });

  it('shows the API error state when loading fails', async () => {
    vi.mocked(tieredJobsService.getJobDetails).mockRejectedValue(new Error('Please sign in to view full job details'));

    renderJobDetails();

    await waitFor(() => {
      expect(screen.getByText('Failed to Load Job')).toBeInTheDocument();
    });

    expect(screen.getByText('Please sign in to view full job details')).toBeInTheDocument();
  });

  it('submits an application and shows a success toast', async () => {
    vi.mocked(tieredJobsService.getJobDetails).mockResolvedValue(mockJob as any);
    vi.mocked(tieredJobsService.applyForJob).mockResolvedValue({
      applicationId: 99,
      appliedAt: new Date('2026-03-24T00:00:00.000Z'),
      message: 'Application submitted successfully',
    });

    renderJobDetails();

    await screen.findByText('Cashier');

    fireEvent.click(screen.getByRole('button', { name: /apply for this job/i }));

    const coverLetterInput = await screen.findByPlaceholderText(
      "Tell us why you're interested in this position...",
    );
    fireEvent.change(coverLetterInput, {
      target: { value: 'I have experience handling customers and payments.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /submit application/i }));

    await waitFor(() => {
      expect(tieredJobsService.applyForJob).toHaveBeenCalledWith({
        jobId: 1,
        coverLetter: 'I have experience handling customers and payments.',
      });
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Application Submitted!',
        description: 'Application submitted successfully',
      }),
    );
  });

  it('shows a destructive toast when application submission fails', async () => {
    vi.mocked(tieredJobsService.getJobDetails).mockResolvedValue(mockJob as any);
    vi.mocked(tieredJobsService.applyForJob).mockRejectedValue(new Error('Application failed'));

    renderJobDetails();

    await screen.findByText('Cashier');

    fireEvent.click(screen.getByRole('button', { name: /apply for this job/i }));
    fireEvent.click(await screen.findByRole('button', { name: /submit application/i }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'destructive',
          title: 'Application Failed',
          description: 'Application failed',
        }),
      );
    });
  });
});
