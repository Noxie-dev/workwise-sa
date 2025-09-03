import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Header from './Header';

// Mock the wouter router
vi.mock('wouter', () => ({
  useLocation: () => ['/'],
  Link: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock the components
vi.mock('@/components/UserMenu', () => ({
  default: ({ className }: { className?: string }) => (
    <div data-testid="user-menu" className={className}>
      User Menu
    </div>
  ),
}));

vi.mock('@/components/AdminButton', () => ({
  default: ({ variant, size, className }: { variant?: string; size?: string; className?: string }) => (
    <button data-testid="admin-button" className={className}>
      Admin Button
    </button>
  ),
}));

// Mock the CSS import
vi.mock('@/styles/header-mobile.css', () => ({}));

describe('Header Component', () => {
  it('renders header with logo', () => {
    render(<Header />);
    const logo = screen.getByAltText('WorkWise SA - Job Search Platform');
    expect(logo).toBeInTheDocument();
  });

  it('renders mobile navigation trigger on small screens', () => {
    render(<Header />);
    const mobileMenuButton = screen.getByLabelText('Toggle navigation menu');
    expect(mobileMenuButton).toBeInTheDocument();
    expect(mobileMenuButton).toHaveClass('md:hidden');
  });

  it('renders desktop navigation on large screens', () => {
    render(<Header />);
    const desktopNav = screen.getByRole('navigation');
    expect(desktopNav).toBeInTheDocument();
  });

  it('applies mobile-specific CSS classes', () => {
    render(<Header />);
    
    // Check header has mobile optimization classes
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('header-mobile-optimized');
    expect(header).toHaveClass('header-landscape');
    
    // Check logo has mobile-specific classes
    const logo = screen.getByAltText('WorkWise SA - Job Search Platform');
    expect(logo).toHaveClass('header-logo-mobile');
    expect(logo).toHaveClass('header-logo-xs');
    expect(logo).toHaveClass('header-logo-landscape');
    expect(logo).toHaveClass('header-high-dpi');
  });

  it('applies responsive sizing classes to logo', () => {
    render(<Header />);
    const logo = screen.getByAltText('WorkWise SA - Job Search Platform');
    expect(logo).toHaveClass('h-16', 'sm:h-20', 'md:h-24');
  });

  it('renders navigation items correctly', () => {
    render(<Header />);
    
    // Check that all navigation items are present
    expect(screen.getByText('Find Jobs')).toBeInTheDocument();
    expect(screen.getByText('Companies')).toBeInTheDocument();
    expect(screen.getByText('CV Builder')).toBeInTheDocument();
    expect(screen.getByText('Wise-Up')).toBeInTheDocument();
    expect(screen.getByText('Blog Wise')).toBeInTheDocument();
    expect(screen.getByText('Resources')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
  });

  it('applies mobile navigation trigger classes', () => {
    render(<Header />);
    const mobileMenuButton = screen.getByLabelText('Toggle navigation menu');
    expect(mobileMenuButton).toHaveClass('mobile-nav-trigger');
    expect(mobileMenuButton).toHaveClass('h-10', 'w-10', 'rounded-lg');
  });

  it('renders user menu and admin button', () => {
    render(<Header />);
    expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    expect(screen.getByTestId('admin-button')).toBeInTheDocument();
  });

  it('applies responsive container classes', () => {
    render(<Header />);
    const container = screen.getByRole('banner').querySelector('.container');
    expect(container).toHaveClass('px-3', 'sm:px-4', 'lg:px-6', 'py-2', 'sm:py-3');
  });

  it('applies mobile optimization classes to header', () => {
    render(<Header />);
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('header-xs-optimized');
  });
});
