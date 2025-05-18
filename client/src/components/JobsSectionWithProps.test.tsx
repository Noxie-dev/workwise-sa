import React from 'react';
import { render, screen } from '@testing-library/react';
import JobsSectionWithProps from './JobsSectionWithProps';
import { JobWithCompany } from '@shared/schema';

// Mock the wouter Link component
jest.mock('wouter', () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href} data-testid="mock-link">
      {children}
    </a>
  ),
}));

// Mock the JobCard component
jest.mock('./JobCard', () => {
  return {
    __esModule: true,
    default: ({ job }: { job: JobWithCompany }) => (
      <div data-testid="job-card">
        <h3>{job.title}</h3>
        <p>{job.company.name}</p>
      </div>
    ),
  };
});

describe('JobsSectionWithProps', () => {
  const mockJobs: JobWithCompany[] = [
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
  ];

  const mockJobsObject = {
    job1: mockJobs[0],
    job2: mockJobs[1],
  };

  test('renders job cards when featuredJobs is an array', () => {
    render(<JobsSectionWithProps featuredJobs={mockJobs} />);
    
    expect(screen.getAllByTestId('job-card')).toHaveLength(2);
    expect(screen.getByText('Software Developer')).toBeInTheDocument();
    expect(screen.getByText('UX Designer')).toBeInTheDocument();
  });

  test('renders job cards when featuredJobs is an object', () => {
    render(<JobsSectionWithProps featuredJobs={mockJobsObject} />);
    
    expect(screen.getAllByTestId('job-card')).toHaveLength(2);
    expect(screen.getByText('Software Developer')).toBeInTheDocument();
    expect(screen.getByText('UX Designer')).toBeInTheDocument();
  });

  test('renders empty state when featuredJobs is null', () => {
    render(<JobsSectionWithProps featuredJobs={null} />);
    
    expect(screen.queryByTestId('job-card')).not.toBeInTheDocument();
    expect(screen.getByText('No featured jobs available at the moment.')).toBeInTheDocument();
  });

  test('renders empty state when featuredJobs is undefined', () => {
    render(<JobsSectionWithProps featuredJobs={undefined} />);
    
    expect(screen.queryByTestId('job-card')).not.toBeInTheDocument();
    expect(screen.getByText('No featured jobs available at the moment.')).toBeInTheDocument();
  });

  test('renders empty state when featuredJobs is an empty array', () => {
    render(<JobsSectionWithProps featuredJobs={[]} />);
    
    expect(screen.queryByTestId('job-card')).not.toBeInTheDocument();
    expect(screen.getByText('No featured jobs available at the moment.')).toBeInTheDocument();
  });

  test('renders empty state when featuredJobs is an empty object', () => {
    render(<JobsSectionWithProps featuredJobs={{}} />);
    
    expect(screen.queryByTestId('job-card')).not.toBeInTheDocument();
    expect(screen.getByText('No featured jobs available at the moment.')).toBeInTheDocument();
  });

  test('renders the "Browse All Jobs" button', () => {
    render(<JobsSectionWithProps featuredJobs={mockJobs} />);
    
    expect(screen.getByText('Browse All Jobs')).toBeInTheDocument();
    expect(screen.getByTestId('mock-link')).toHaveAttribute('href', '/jobs');
  });
});
