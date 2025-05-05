import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import JobCard from './JobCard';
import { JobWithCompany } from '../../../shared/schema';

// Mock the wouter Link component
jest.mock('wouter', () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href} data-testid="mock-link">
      {children}
    </a>
  ),
}));

describe('JobCard', () => {
  const mockJob: JobWithCompany = {
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
  };

  const mockOnFavoriteToggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders job details correctly', () => {
    render(<JobCard job={mockJob} />);

    // Check if job title is rendered
    expect(screen.getByText('Software Developer')).toBeInTheDocument();

    // Check if company name and location are rendered
    expect(screen.getByText('Tech Company - Cape Town')).toBeInTheDocument();

    // Check if job type badge is rendered
    expect(screen.getByText('Full-time')).toBeInTheDocument();

    // Check if work mode badge is rendered
    expect(screen.getByText('Remote')).toBeInTheDocument();

    // Check if salary is rendered
    expect(screen.getByText('R30,000 - R40,000')).toBeInTheDocument();

    // Check if view details link is rendered
    const detailsLink = screen.getByText('View details');
    expect(detailsLink).toBeInTheDocument();
    expect(detailsLink.closest('a')).toHaveAttribute('href', '/jobs/1');
  });

  it('toggles favorite status when favorite button is clicked', () => {
    render(<JobCard job={mockJob} onFavoriteToggle={mockOnFavoriteToggle} />);

    // Find the favorite button
    const favoriteButton = screen.getByRole('button', {
      name: /add to favorites/i,
    });

    // Click the favorite button
    fireEvent.click(favoriteButton);

    // Check if onFavoriteToggle was called with correct arguments
    expect(mockOnFavoriteToggle).toHaveBeenCalledWith(1, true);
  });

  it('applies correct CSS class for work mode badges', () => {
    // Test with Remote work mode
    const { rerender } = render(<JobCard job={mockJob} />);
    const remoteBadge = screen.getByText('Remote');
    expect(remoteBadge).toHaveClass('bg-green-100');
    expect(remoteBadge).toHaveClass('text-green-800');

    // Test with Hybrid work mode
    const hybridJob = { ...mockJob, workMode: 'Hybrid' };
    rerender(<JobCard job={hybridJob} />);
    const hybridBadge = screen.getByText('Hybrid');
    expect(hybridBadge).toHaveClass('bg-yellow-100');
    expect(hybridBadge).toHaveClass('text-yellow-800');

    // Test with On-site work mode
    const onsiteJob = { ...mockJob, workMode: 'On-site' };
    rerender(<JobCard job={onsiteJob} />);
    const onsiteBadge = screen.getByText('On-site');
    expect(onsiteBadge).toHaveClass('bg-purple-100');
    expect(onsiteBadge).toHaveClass('text-purple-800');
  });
});
