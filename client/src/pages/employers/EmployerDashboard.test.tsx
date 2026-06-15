import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EmployerDashboard from './EmployerDashboard';
import { employerDashboardService } from '@/services/employerDashboardService';
import { useAuth } from '@/contexts/AuthContext';

// Mock the dependencies
vi.mock('@/services/employerDashboardService', () => ({
  employerDashboardService: {
    fetchEmployerDashboard: vi.fn(),
    fetchEmployerJobs: vi.fn(),
    fetchEmployerApplications: vi.fn(),
    updateEmployerJobStatus: vi.fn(),
    exportDashboardData: vi.fn(),
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

vi.mock('@/components/employer/ApplicationsChart', () => ({
  default: () => <div data-testid="applications-chart">Applications Chart</div>,
}));

vi.mock('@/components/employer/JobManagementChart', () => ({
  default: () => <div data-testid="job-management-chart">Job Management Chart</div>,
}));

vi.mock('@/services/analyticsService', () => ({
  default: {
    trackPageView: vi.fn(),
    trackTabChange: vi.fn(),
    trackFilterChange: vi.fn(),
    trackEvent: vi.fn(),
    trackExportData: vi.fn(),
  },
}));

describe('EmployerDashboard Component', () => {
  const renderDashboard = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <EmployerDashboard />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    // Reset all mocks
    vi.resetAllMocks();

    // Mock the auth context
    (useAuth as any).mockReturnValue({
      currentUser: { uid: 'test-employer-id', displayName: 'Test Employer' },
      role: 'employer',
    });

    // Mock the service responses
    (employerDashboardService.fetchEmployerDashboard as any).mockResolvedValue({
      stats: {
        totalJobs: 5,
        activeJobs: 3,
        totalApplications: 120,
        totalViews: 3200,
      },
      charts: {
        applications: [
          { date: '2025-07-01', applications: 30 },
          { date: '2025-07-02', applications: 45 },
        ],
        jobPerformance: [
          { jobTitle: 'Software Developer', views: 1500, applications: 45 },
          { jobTitle: 'Marketing Manager', views: 1000, applications: 30 },
        ],
      },
      recentActivity: [
        {
          title: 'New Application',
          description: 'John Doe applied for Software Developer',
          timestamp: '10 min ago',
        },
      ],
    });

    (employerDashboardService.fetchEmployerJobs as any).mockResolvedValue([
      {
        id: 'job1',
        title: 'Software Developer',
        location: 'Cape Town',
        type: 'Full-time',
        applications: 10,
        views: 500,
        postedDate: '2025-07-01',
        status: 'active',
      },
      {
        id: 'job2',
        title: 'Marketing Manager',
        location: 'Johannesburg',
        type: 'Part-time',
        applications: 5,
        views: 200,
        postedDate: '2025-07-05',
        status: 'paused',
      },
    ]);

    (employerDashboardService.fetchEmployerApplications as any).mockResolvedValue([]);
    (employerDashboardService.updateEmployerJobStatus as any).mockResolvedValue({
      success: true,
      jobId: 'job1',
      status: 'paused',
    });
  });

  it('renders the employer dashboard title', async () => {
    renderDashboard();

    // Check for the title
    expect(screen.getByText('Employer Dashboard')).toBeInTheDocument();
  });

  it('fetches and displays dashboard data', async () => {
    renderDashboard();

    // Wait for the data to load
    await waitFor(() => {
      expect(employerDashboardService.fetchEmployerDashboard).toHaveBeenCalledWith('30d', 'all');
    });

    // Check for stats cards
    await waitFor(() => {
      expect(screen.getByText('Total Jobs')).toBeInTheDocument();
      expect(screen.getByText('Active Jobs')).toBeInTheDocument();
      expect(screen.getByText('Total Applications')).toBeInTheDocument();
      expect(screen.getByText('Total Views')).toBeInTheDocument();
    });
  });

  it('fetches and displays jobs list', async () => {
    renderDashboard();

    // Wait for the data to load
    await waitFor(() => {
      expect(employerDashboardService.fetchEmployerJobs).toHaveBeenCalledWith('all');
    });

    // Check for jobs management tab
    await waitFor(() => {
      expect(screen.getByText('Manage Jobs')).toBeInTheDocument();
    });
  });

  it('displays dashboard tabs', async () => {
    renderDashboard();

    // Check for all tabs
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Manage Jobs')).toBeInTheDocument();
    expect(screen.getByText('Applications')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('shows authentication required message when user is not logged in', async () => {
    // Mock user as not logged in
    (useAuth as any).mockReturnValue({
      currentUser: null,
      role: null,
    });

    renderDashboard();

    // Check for authentication required message
    expect(screen.getByText('Authentication Required')).toBeInTheDocument();
    expect(screen.getByText('Please log in to access the employer dashboard.')).toBeInTheDocument();
  });

  it('displays Post New Job button', async () => {
    renderDashboard();

    // Check for Post New Job button
    expect(screen.getByText('Post New Job')).toBeInTheDocument();
  });

  it('displays Export Data button', async () => {
    renderDashboard();

    // Check for Export Data button
    expect(screen.getByText('Export Data')).toBeInTheDocument();
  });

  it('exports dashboard data when export is clicked', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Total Jobs')).toBeInTheDocument();
    });

    const exportButton = screen.getByText('Export Data');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(employerDashboardService.exportDashboardData).toHaveBeenCalled();
    });
  });

  it('shows a dashboard error state when the overview query fails', async () => {
    (employerDashboardService.fetchEmployerDashboard as any).mockRejectedValueOnce(
      new Error('Failed to load employer dashboard')
    );

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Failed to load employer dashboard')).toBeInTheDocument();
    });
  });

  it('filters applications to the selected job from the jobs list action', async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.click(screen.getByRole('tab', { name: 'Manage Jobs' }));

    await waitFor(() => {
      expect(screen.getByText('Software Developer')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Applications \(10\)/ }));

    await waitFor(() => {
      expect(employerDashboardService.fetchEmployerApplications).toHaveBeenLastCalledWith({
        jobId: 'job1',
        status: 'all',
        dateRange: '30d',
      });
    });
    expect(screen.getByText('Review applications for Software Developer')).toBeInTheDocument();
  });

  it('shows status mutation errors when job status updates fail', async () => {
    const user = userEvent.setup();
    (employerDashboardService.updateEmployerJobStatus as any).mockRejectedValueOnce(
      new Error('Cannot update this job')
    );

    renderDashboard();

    await user.click(screen.getByRole('tab', { name: 'Manage Jobs' }));

    await waitFor(() => {
      expect(screen.getByText('Software Developer')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Pause/ }));

    await waitFor(() => {
      expect(screen.getByText('Job status update failed')).toBeInTheDocument();
      expect(screen.getByText('Cannot update this job')).toBeInTheDocument();
    });
  });
});
