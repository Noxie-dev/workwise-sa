import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from './Dashboard';
import { dashboardService } from '@/services/dashboardService';
import { profileService } from '@/services/profileService';
import { useAuth } from '@/contexts/AuthContext';

// Mock the dependencies
vi.mock('@/services/dashboardService', () => ({
  dashboardService: {
    fetchJobDistribution: vi.fn(),
    fetchJobRecommendations: vi.fn(),
    fetchSkillsAnalysis: vi.fn(),
  },
}));

vi.mock('@/services/profileService', () => ({
  profileService: {
    getProfile: vi.fn(),
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('wouter', () => ({
  useLocation: () => [null, vi.fn()],
}));

vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('Dashboard Component', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.resetAllMocks();

    // Mock the auth context
    (useAuth as any).mockReturnValue({
      currentUser: { uid: 'test-user-id', displayName: 'Test User' },
    });

    // Mock the service responses
    (dashboardService.fetchJobDistribution as any).mockResolvedValue({
      categories: [
        { category: 'IT', count: 250 },
        { category: 'Retail', count: 180 },
      ],
      locations: [
        { name: 'Johannesburg', value: 300 },
        { name: 'Cape Town', value: 220 },
      ],
      trends: [
        { date: '2025-01', applications: 450 },
        { date: '2025-02', applications: 480 },
      ],
    });

    (dashboardService.fetchJobRecommendations as any).mockResolvedValue([
      {
        id: 'job123',
        title: 'Software Developer',
        company: 'Tech Co',
        match: 85,
        location: 'Cape Town',
        type: 'Full-time',
        postedDate: '2025-04-15',
        description: 'Entry-level software developer position.',
        skills: ['JavaScript', 'React', 'Node.js'],
      },
    ]);

    (dashboardService.fetchSkillsAnalysis as any).mockResolvedValue({
      marketDemand: [
        { skill: 'JavaScript', demand: 85, growth: 12 },
        { skill: 'Python', demand: 78, growth: 18 },
      ],
      userSkills: [
        { skill: 'JavaScript', level: 'Intermediate' },
        { skill: 'HTML/CSS', level: 'Advanced' },
      ],
      recommendations: [
        { skill: 'React', reason: 'High demand in your preferred job categories' },
        { skill: 'Python', reason: 'Fastest growing skill in the market' },
      ],
    });

    (profileService.getProfile as any).mockResolvedValue({
      personal: {
        fullName: 'Test User',
        phoneNumber: '1234567890',
        location: 'Cape Town',
      },
      skills: {
        skills: ['JavaScript', 'HTML/CSS', 'Communication'],
      },
    });
  });

  it('renders the dashboard title', async () => {
    render(<Dashboard />);

    // Check for the title
    expect(screen.getByText('Job Market Dashboard')).toBeInTheDocument();
  });

  it('fetches and displays job distribution data', async () => {
    render(<Dashboard />);

    // Wait for the data to load
    await waitFor(() => {
      expect(dashboardService.fetchJobDistribution).toHaveBeenCalled();
    });

    // Check for category data
    await waitFor(() => {
      expect(screen.getByText('Jobs by Category')).toBeInTheDocument();
    });
  });

  it('fetches and displays job recommendations', async () => {
    render(<Dashboard />);

    // Wait for the data to load
    await waitFor(() => {
      expect(dashboardService.fetchJobRecommendations).toHaveBeenCalled();
    });

    // Check for recommendations tab
    await waitFor(() => {
      expect(screen.getByText('Recommendations')).toBeInTheDocument();
    });
  });

  it('fetches and displays skills analysis data', async () => {
    render(<Dashboard />);

    // Wait for the data to load
    await waitFor(() => {
      expect(dashboardService.fetchSkillsAnalysis).toHaveBeenCalled();
    });

    // Check for skills tab
    await waitFor(() => {
      expect(screen.getByText('Skills Analysis')).toBeInTheDocument();
    });
  });

  it('fetches user profile data', async () => {
    render(<Dashboard />);

    // Wait for the profile data to load
    await waitFor(() => {
      expect(profileService.getProfile).toHaveBeenCalledWith('test-user-id');
    });
  });

  it('shows authentication required message when user is not logged in', async () => {
    // Mock user as not logged in
    (useAuth as any).mockReturnValue({
      currentUser: null,
    });

    render(<Dashboard />);

    // Check for authentication required message
    expect(screen.getByText('Authentication Required')).toBeInTheDocument();
    expect(screen.getByText('Please log in to view the job distribution dashboard.')).toBeInTheDocument();
  });
});
