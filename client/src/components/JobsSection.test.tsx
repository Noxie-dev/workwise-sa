import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import JobsSection from './JobsSection';
import { useJobFavorites } from '../hooks/useJobFavorites';

// Mock the useJobFavorites hook
jest.mock('../hooks/useJobFavorites', () => ({
  useJobFavorites: jest.fn(),
}));

// Mock the wouter Link component
jest.mock('wouter', () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href} data-testid="mock-link">
      {children}
    </a>
  ),
}));

// Mock the JobCard component
jest.mock('./JobCard', () => ({
  __esModule: true,
  default: ({ job, initialFavoriteState, onFavoriteToggle }: any) => (
    <div data-testid={`job-card-${job.id}`}>
      <h3>{job.title}</h3>
      <p>{job.company.name}</p>
      <button 
        onClick={() => onFavoriteToggle(job.id, !initialFavoriteState)}
        data-testid={`favorite-button-${job.id}`}
      >
        {initialFavoriteState ? 'Remove from favorites' : 'Add to favorites'}
      </button>
    </div>
  ),
}));

// Create a new QueryClient for each test
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0,
    },
  },
});

// Mock successful API response
const mockSuccessResponse = {
  success: true,
  data: [
    {
      id: 1,
      title: 'Software Developer',
      company: 'TechSA',
      companyLogo: '/logo1.png',
      location: 'Cape Town',
      salary: 'R35,000 - R45,000',
      type: 'Full-time',
      category: 'Information Technology',
      description: 'We are looking for a software developer...',
      requirements: ['JavaScript', 'React', 'Node.js'],
      postedDate: '2023-01-15',
      isFeatured: true,
    },
    {
      id: 2,
      title: 'UX Designer',
      company: 'Design Studio',
      companyLogo: '/logo2.png',
      location: 'Johannesburg',
      salary: 'R25,000 - R35,000',
      type: 'Full-time',
      category: 'Design',
      description: 'Design user experiences...',
      requirements: ['Figma', 'UI/UX', 'Prototyping'],
      postedDate: '2023-01-10',
      isFeatured: true,
    },
  ],
};

// Mock error API response
const mockErrorResponse = {
  success: false,
  error: 'Failed to fetch jobs',
};

describe('JobsSection', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock the useJobFavorites hook
    (useJobFavorites as jest.Mock).mockReturnValue({
      favorites: [1], // Job ID 1 is favorited
      toggleFavorite: jest.fn(),
    });
    
    // Mock fetch
    global.fetch = jest.fn();
  });

  it('renders loading skeletons initially', () => {
    // Mock fetch to return a pending promise
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
    
    const queryClient = createTestQueryClient();
    
    render(
      <QueryClientProvider client={queryClient}>
        <JobsSection />
      </QueryClientProvider>
    );
    
    // Check if skeletons are rendered
    expect(screen.getAllByTestId('job-skeleton')).toHaveLength(6);
  });

  it('renders jobs when data is loaded successfully', async () => {
    // Mock fetch to return successful response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessResponse,
    });
    
    const queryClient = createTestQueryClient();
    
    render(
      <QueryClientProvider client={queryClient}>
        <JobsSection />
      </QueryClientProvider>
    );
    
    // Wait for jobs to be rendered
    await waitFor(() => {
      expect(screen.getByText('Software Developer')).toBeInTheDocument();
      expect(screen.getByText('UX Designer')).toBeInTheDocument();
    });
    
    // Check if the correct number of job cards are rendered
    expect(screen.getAllByTestId(/job-card-/)).toHaveLength(2);
    
    // Check if the "Browse All Jobs" link is rendered
    expect(screen.getByText('Browse All Jobs')).toBeInTheDocument();
  });

  it('renders error message when API call fails', async () => {
    // Mock fetch to return error response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockErrorResponse,
    });
    
    const queryClient = createTestQueryClient();
    
    render(
      <QueryClientProvider client={queryClient}>
        <JobsSection />
      </QueryClientProvider>
    );
    
    // Wait for error message to be rendered
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch jobs')).toBeInTheDocument();
    });
  });

  it('renders empty state when no jobs are found', async () => {
    // Mock fetch to return empty data
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    });
    
    const queryClient = createTestQueryClient();
    
    render(
      <QueryClientProvider client={queryClient}>
        <JobsSection />
      </QueryClientProvider>
    );
    
    // Wait for empty state message to be rendered
    await waitFor(() => {
      expect(screen.getByText('No jobs found matching your criteria.')).toBeInTheDocument();
    });
  });

  it('applies filters correctly', async () => {
    // Mock fetch to return successful response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessResponse,
    });
    
    const queryClient = createTestQueryClient();
    
    render(
      <QueryClientProvider client={queryClient}>
        <JobsSection 
          filter={{ 
            category: 'IT', 
            location: 'Cape Town', 
            featured: true 
          }} 
        />
      </QueryClientProvider>
    );
    
    // Wait for fetch to be called
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/jobs/featured?category=IT&location=Cape%20Town&featured=true');
    });
  });

  it('respects maxDisplay prop', async () => {
    // Mock fetch to return successful response with more jobs than maxDisplay
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [
          ...mockSuccessResponse.data,
          {
            id: 3,
            title: 'Product Manager',
            company: 'ProductCo',
            companyLogo: '/logo3.png',
            location: 'Durban',
            salary: 'R40,000 - R50,000',
            type: 'Full-time',
            category: 'Management',
            description: 'Lead product development...',
            requirements: ['Product Management', 'Agile', 'Roadmapping'],
            postedDate: '2023-01-05',
            isFeatured: true,
          },
        ],
      }),
    });
    
    const queryClient = createTestQueryClient();
    
    render(
      <QueryClientProvider client={queryClient}>
        <JobsSection maxDisplay={2} />
      </QueryClientProvider>
    );
    
    // Wait for jobs to be rendered
    await waitFor(() => {
      expect(screen.getAllByTestId(/job-card-/)).toHaveLength(2);
      expect(screen.queryByText('Product Manager')).not.toBeInTheDocument();
    });
  });
});
