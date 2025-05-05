import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithClient } from '@/utils/test-utils';
import Jobs from './Jobs';
import { jobsService } from '@/services/jobsService';

// Mock the jobsService
jest.mock('@/services/jobsService', () => ({
  jobsService: {
    searchJobs: jest.fn(),
    toggleFavorite: jest.fn(),
  },
}));

// Mock the wouter useLocation hook
jest.mock('wouter', () => ({
  useLocation: () => ['/jobs', jest.fn()],
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href} data-testid="mock-link">
      {children}
    </a>
  ),
}));

// Mock the JobSearch component
jest.mock('@/components/JobSearch', () => ({
  __esModule: true,
  default: ({ initialQuery }: { initialQuery: string }) => (
    <div data-testid="job-search">
      <span>Search Query: {initialQuery}</span>
    </div>
  ),
}));

// Mock the JobCard component
jest.mock('@/components/JobCard', () => ({
  __esModule: true,
  default: ({ job, onFavoriteToggle }: { job: any; onFavoriteToggle: any }) => (
    <div data-testid={`job-card-${job.id}`}>
      <h3>{job.title}</h3>
      <p>{job.company.name}</p>
      <button onClick={() => onFavoriteToggle(job.id, true)}>Toggle Favorite</button>
    </div>
  ),
}));

describe('Jobs Page', () => {
  const mockSearchResponse = {
    jobs: [
      {
        id: 1,
        title: 'Software Developer',
        description: 'A great job opportunity',
        location: 'Cape Town',
        salary: 'R30,000 - R40,000',
        jobType: 'Full-time',
        workMode: 'Remote',
        companyId: 1,
        categoryId: 1,
        isFeatured: true,
        createdAt: new Date(),
        company: {
          id: 1,
          name: 'Tech Company',
          logo: '/logo.png',
          location: 'Cape Town',
          slug: 'tech-company',
          openPositions: 5,
        },
      },
      {
        id: 2,
        title: 'UX Designer',
        description: 'Design user experiences',
        location: 'Johannesburg',
        salary: 'R25,000 - R35,000',
        jobType: 'Full-time',
        workMode: 'Hybrid',
        companyId: 2,
        categoryId: 2,
        isFeatured: false,
        createdAt: new Date(),
        company: {
          id: 2,
          name: 'Design Studio',
          logo: '/logo2.png',
          location: 'Johannesburg',
          slug: 'design-studio',
          openPositions: 3,
        },
      },
    ],
    total: 2,
    page: 1,
    limit: 20,
    totalPages: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the implementation of searchJobs
    (jobsService.searchJobs as jest.Mock).mockResolvedValue(mockSearchResponse);
  });

  it('renders the jobs page with search functionality', async () => {
    renderWithClient(<Jobs />);

    // Check if the page title is rendered
    expect(screen.getByText('Find Your Dream Job')).toBeInTheDocument();

    // Check if the JobSearch component is rendered
    expect(screen.getByTestId('job-search')).toBeInTheDocument();

    // Wait for the jobs to load
    await waitFor(() => {
      expect(screen.getByTestId('job-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('job-card-2')).toBeInTheDocument();
    });

    // Check if job titles are rendered
    expect(screen.getByText('Software Developer')).toBeInTheDocument();
    expect(screen.getByText('UX Designer')).toBeInTheDocument();

    // Check if company names are rendered
    expect(screen.getByText('Tech Company')).toBeInTheDocument();
    expect(screen.getByText('Design Studio')).toBeInTheDocument();
  });

  it('displays loading state while fetching jobs', () => {
    // Mock a delayed response
    (jobsService.searchJobs as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockSearchResponse), 1000))
    );

    renderWithClient(<Jobs />);

    // Check if skeletons are rendered during loading
    const skeletons = screen.getAllByTestId(/skeleton/i);
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('displays error message when job fetching fails', async () => {
    // Mock an error response
    (jobsService.searchJobs as jest.Mock).mockRejectedValue(new Error('Failed to fetch jobs'));

    renderWithClient(<Jobs />);

    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText('Failed to load jobs. Please try again later.')).toBeInTheDocument();
    });

    // Check if retry button is rendered
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('displays no jobs found message when search returns empty results', async () => {
    // Mock an empty response
    (jobsService.searchJobs as jest.Mock).mockResolvedValue({
      jobs: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });

    renderWithClient(<Jobs />);

    // Wait for the no jobs message to appear
    await waitFor(() => {
      expect(screen.getByText('No jobs found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search criteria')).toBeInTheDocument();
    });
  });
});
