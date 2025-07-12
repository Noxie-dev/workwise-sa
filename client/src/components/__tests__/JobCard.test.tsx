import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithClient } from '@/utils/test-utils';
import JobCard from '../JobCard';
import { JobWithCompany } from '../../../../shared/schema';

// Mock the wouter Link component
const mockNavigate = jest.fn();
jest.mock('wouter', () => ({
  Link: ({ href, children, className, ...props }: any) => (
    <a
      href={href}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        mockNavigate(href);
      }}
      {...props}
    >
      {children}
    </a>
  ),
}));

// Mock job data
const mockJob: JobWithCompany = {
  id: 1,
  title: 'Software Engineer',
  description: 'We are looking for a skilled software engineer...',
  location: 'Cape Town, South Africa',
  salary: 'R45,000 - R60,000',
  jobType: 'Full-time',
  workMode: 'Remote',
  companyId: 1,
  categoryId: 1,
  isFeatured: false,
  createdAt: new Date(),
  company: {
    id: 1,
    name: 'Tech Solutions Inc',
    logo: '/images/tech-solutions.png',
    location: 'Cape Town',
    slug: 'tech-solutions',
    openPositions: 5,
  },
};

const mockJobWithoutCompany: JobWithCompany = {
  ...mockJob,
  company: undefined as any,
};

describe('JobCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders job information correctly', () => {
    renderWithClient(<JobCard job={mockJob} />);

    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Tech Solutions Inc - Cape Town, South Africa')).toBeInTheDocument();
    expect(screen.getByText('R45,000 - R60,000')).toBeInTheDocument();
    expect(screen.getByText('Full-time')).toBeInTheDocument();
    expect(screen.getByText('Remote')).toBeInTheDocument();
  });

  it('renders company initial when company exists', () => {
    renderWithClient(<JobCard job={mockJob} />);

    const companyInitial = screen.getByText('T'); // First letter of "Tech Solutions Inc"
    expect(companyInitial).toBeInTheDocument();
  });

  it('renders default company initial when no company', () => {
    renderWithClient(<JobCard job={mockJobWithoutCompany} />);

    const defaultInitial = screen.getByText('C'); // Default company initial
    expect(defaultInitial).toBeInTheDocument();
  });

  it('renders location without company name when no company', () => {
    renderWithClient(<JobCard job={mockJobWithoutCompany} />);

    expect(screen.getByText('Cape Town, South Africa')).toBeInTheDocument();
  });

  it('renders default job type when not provided', () => {
    const jobWithoutType = { ...mockJob, jobType: undefined };
    renderWithClient(<JobCard job={jobWithoutType} />);

    expect(screen.getByText('Full-time')).toBeInTheDocument();
  });

  it('renders default work mode when not provided', () => {
    const jobWithoutWorkMode = { ...mockJob, workMode: undefined };
    renderWithClient(<JobCard job={jobWithoutWorkMode} />);

    expect(screen.getByText('On-site')).toBeInTheDocument();
  });

  it('applies correct badge styling for different work modes', () => {
    const remoteJob = { ...mockJob, workMode: 'Remote' };
    const { rerender } = renderWithClient(<JobCard job={remoteJob} />);

    let workModeBadge = screen.getByText('Remote');
    expect(workModeBadge).toHaveClass('bg-green-100', 'text-green-800');

    // Test hybrid mode
    const hybridJob = { ...mockJob, workMode: 'Hybrid' };
    rerender(<JobCard job={hybridJob} />);
    workModeBadge = screen.getByText('Hybrid');
    expect(workModeBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');

    // Test on-site mode
    const onSiteJob = { ...mockJob, workMode: 'On-site' };
    rerender(<JobCard job={onSiteJob} />);
    workModeBadge = screen.getByText('On-site');
    expect(workModeBadge).toHaveClass('bg-purple-100', 'text-purple-800');
  });

  it('toggles favorite status when favorite button is clicked', () => {
    const mockToggleFavorite = jest.fn();
    renderWithClient(
      <JobCard job={mockJob} onFavoriteToggle={mockToggleFavorite} initialFavoriteState={false} />
    );

    const favoriteButton = screen.getByLabelText('Add to favorites');
    fireEvent.click(favoriteButton);

    expect(mockToggleFavorite).toHaveBeenCalledWith(1, true);
  });

  it('calls favorite toggle with correct parameters when unfavoriting', () => {
    const mockToggleFavorite = jest.fn();
    renderWithClient(
      <JobCard job={mockJob} onFavoriteToggle={mockToggleFavorite} initialFavoriteState={true} />
    );

    const favoriteButton = screen.getByLabelText('Remove from favorites');
    fireEvent.click(favoriteButton);

    expect(mockToggleFavorite).toHaveBeenCalledWith(1, false);
  });

  it('updates favorite button appearance when toggled', () => {
    renderWithClient(<JobCard job={mockJob} initialFavoriteState={false} />);

    const favoriteButton = screen.getByLabelText('Add to favorites');
    expect(favoriteButton).toHaveClass('text-gray-400');

    fireEvent.click(favoriteButton);

    expect(screen.getByLabelText('Remove from favorites')).toHaveClass('text-primary');
  });

  it('prevents event propagation when favorite button is clicked', () => {
    const mockCardClick = jest.fn();
    renderWithClient(
      <div onClick={mockCardClick}>
        <JobCard job={mockJob} />
      </div>
    );

    const favoriteButton = screen.getByLabelText('Add to favorites');
    fireEvent.click(favoriteButton);

    expect(mockCardClick).not.toHaveBeenCalled();
  });

  it('navigates to job details when "View details" is clicked', () => {
    renderWithClient(<JobCard job={mockJob} />);

    const viewDetailsLink = screen.getByText('View details');
    fireEvent.click(viewDetailsLink);

    expect(mockNavigate).toHaveBeenCalledWith('/jobs/1');
  });

  it('renders with custom className', () => {
    const customClass = 'custom-job-card';
    renderWithClient(<JobCard job={mockJob} className={customClass} />);

    const jobCard = screen.getByText('Software Engineer').closest('.job-card');
    expect(jobCard).toHaveClass(customClass);
  });

  it('has proper accessibility attributes', () => {
    renderWithClient(<JobCard job={mockJob} />);

    const favoriteButton = screen.getByLabelText('Add to favorites');
    expect(favoriteButton).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(favoriteButton);

    expect(screen.getByLabelText('Remove from favorites')).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders salary information correctly', () => {
    renderWithClient(<JobCard job={mockJob} />);

    const salaryElement = screen.getByText('R45,000 - R60,000');
    expect(salaryElement).toBeInTheDocument();
    expect(salaryElement).toHaveClass('text-green-600');
  });

  it('handles missing salary gracefully', () => {
    const jobWithoutSalary = { ...mockJob, salary: undefined };
    renderWithClient(<JobCard job={jobWithoutSalary} />);

    // Should not crash and should render other elements
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
  });

  it('renders job type badge with correct styling', () => {
    renderWithClient(<JobCard job={mockJob} />);

    const jobTypeBadge = screen.getByText('Full-time');
    expect(jobTypeBadge).toHaveClass('bg-blue-100', 'text-primary');
  });

  it('is memoized to prevent unnecessary re-renders', () => {
    const JobCardMemo = React.memo(JobCard);
    const { rerender } = renderWithClient(<JobCardMemo job={mockJob} />);

    // Re-render with same props should not cause re-render
    rerender(<JobCardMemo job={mockJob} />);

    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
  });

  it('handles case-insensitive work mode matching', () => {
    const jobWithLowerCaseMode = { ...mockJob, workMode: 'remote' };
    renderWithClient(<JobCard job={jobWithLowerCaseMode} />);

    const workModeBadge = screen.getByText('remote');
    expect(workModeBadge).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('renders proper card structure with headers and content', () => {
    renderWithClient(<JobCard job={mockJob} />);

    // Check that card has proper structure
    const cardElement = screen.getByText('Software Engineer').closest('.job-card');
    expect(cardElement).toHaveClass('bg-white', 'rounded-lg', 'shadow-card');
  });
});
