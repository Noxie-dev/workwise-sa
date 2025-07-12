import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithClient } from '@/utils/test-utils';
import Header from '../Header';

// Mock the wouter hook
const mockLocation = '/';
const mockNavigate = jest.fn();

jest.mock('wouter', () => ({
  ...jest.requireActual('wouter'),
  useLocation: () => [mockLocation, mockNavigate],
  Link: ({ href, children, className, onClick, ...props }: any) => (
    <a
      href={href}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        if (onClick) onClick();
        mockNavigate(href);
      }}
      {...props}
    >
      {children}
    </a>
  ),
}));

// Mock the child components
jest.mock('../UserMenu', () => ({
  __esModule: true,
  default: ({ className }: { className?: string }) => (
    <div data-testid="user-menu" className={className}>
      UserMenu
    </div>
  ),
}));

jest.mock('../AdminButton', () => ({
  __esModule: true,
  default: ({ variant, className }: { variant?: string; className?: string }) => (
    <button data-testid="admin-button" className={className}>
      AdminButton
    </button>
  ),
}));

// Mock the utilities
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

describe('Header Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders logo correctly', () => {
    renderWithClient(<Header />);
    
    const logo = screen.getByAltText('WorkWise SA - Job Search Platform');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', '/images/logo.png');
  });

  it('renders all navigation items on desktop', () => {
    renderWithClient(<Header />);
    
    const navigationItems = [
      'Find Jobs',
      'Companies',
      'CV Builder',
      'Wise-Up',
      'Blog Wise',
      'Resources',
      'Contact',
    ];

    navigationItems.forEach(item => {
      expect(screen.getByText(item)).toBeInTheDocument();
    });
  });

  it('renders user menu and admin button', () => {
    renderWithClient(<Header />);
    
    expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    expect(screen.getByTestId('admin-button')).toBeInTheDocument();
  });

  it('shows mobile menu button on mobile', () => {
    renderWithClient(<Header />);
    
    const mobileMenuButton = screen.getByLabelText('Toggle navigation menu');
    expect(mobileMenuButton).toBeInTheDocument();
  });

  it('opens mobile menu when menu button is clicked', async () => {
    renderWithClient(<Header />);
    
    const mobileMenuButton = screen.getByLabelText('Toggle navigation menu');
    fireEvent.click(mobileMenuButton);

    await waitFor(() => {
      expect(screen.getByLabelText('Close navigation menu')).toBeInTheDocument();
    });
  });

  it('closes mobile menu when close button is clicked', async () => {
    renderWithClient(<Header />);
    
    // Open mobile menu
    const mobileMenuButton = screen.getByLabelText('Toggle navigation menu');
    fireEvent.click(mobileMenuButton);

    await waitFor(() => {
      const closeButton = screen.getByLabelText('Close navigation menu');
      fireEvent.click(closeButton);
    });

    await waitFor(() => {
      expect(screen.queryByLabelText('Close navigation menu')).not.toBeInTheDocument();
    });
  });

  it('closes mobile menu when navigation link is clicked', async () => {
    renderWithClient(<Header />);
    
    // Open mobile menu
    const mobileMenuButton = screen.getByLabelText('Toggle navigation menu');
    fireEvent.click(mobileMenuButton);

    await waitFor(() => {
      const jobsLink = screen.getAllByText('Find Jobs')[1]; // Second one is in mobile menu
      fireEvent.click(jobsLink);
    });

    await waitFor(() => {
      expect(screen.queryByLabelText('Close navigation menu')).not.toBeInTheDocument();
    });
  });

  it('navigates to correct route when navigation link is clicked', () => {
    renderWithClient(<Header />);
    
    const jobsLink = screen.getAllByText('Find Jobs')[0]; // First one is desktop
    fireEvent.click(jobsLink);

    expect(mockNavigate).toHaveBeenCalledWith('/jobs');
  });

  it('applies correct styling to active navigation link', () => {
    // Mock current location as /jobs
    jest.doMock('wouter', () => ({
      ...jest.requireActual('wouter'),
      useLocation: () => ['/jobs', mockNavigate],
    }));

    renderWithClient(<Header />);
    
    const jobsLinks = screen.getAllByText('Find Jobs');
    jobsLinks.forEach(link => {
      expect(link).toHaveClass('text-primary');
    });
  });

  it('renders with backdrop blur styling', () => {
    renderWithClient(<Header />);
    
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('bg-white/95', 'backdrop-blur');
  });

  it('has proper accessibility attributes', () => {
    renderWithClient(<Header />);
    
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();

    const logo = screen.getByAltText('WorkWise SA - Job Search Platform');
    expect(logo).toHaveAttribute('loading', 'lazy');

    const mobileMenuButton = screen.getByLabelText('Toggle navigation menu');
    expect(mobileMenuButton).toBeInTheDocument();
  });

  it('renders navigation items with correct hrefs', () => {
    renderWithClient(<Header />);
    
    const expectedLinks = [
      { text: 'Find Jobs', href: '/jobs' },
      { text: 'Companies', href: '/companies' },
      { text: 'CV Builder', href: '/cv-builder' },
      { text: 'Wise-Up', href: '/wise-up' },
      { text: 'Blog Wise', href: '/blog-wise' },
      { text: 'Resources', href: '/resources' },
      { text: 'Contact', href: '/contact' },
    ];

    expectedLinks.forEach(({ text, href }) => {
      const links = screen.getAllByText(text);
      links.forEach(link => {
        expect(link).toHaveAttribute('href', href);
      });
    });
  });

  it('logo links to home page', () => {
    renderWithClient(<Header />);
    
    const logoLink = screen.getByText('WorkWise SA Home');
    expect(logoLink.closest('a')).toHaveAttribute('href', '/');
  });

  it('renders sticky header with proper z-index', () => {
    renderWithClient(<Header />);
    
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('sticky', 'top-0', 'z-50');
  });
});
