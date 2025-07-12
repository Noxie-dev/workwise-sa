import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithClient } from '@/utils/test-utils';
import CompanyCard from '../CompanyCard';
import { Company } from '../../../../shared/schema';

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

// Mock company data
const mockCompany: Company = {
  id: 1,
  name: 'Tech Solutions Inc',
  logo: '/images/tech-solutions.png',
  location: 'Cape Town',
  slug: 'tech-solutions',
  openPositions: 5,
};

const mockCompanyWithNoPositions: Company = {
  ...mockCompany,
  openPositions: 0,
};

const mockCompanyWithManyPositions: Company = {
  ...mockCompany,
  openPositions: 25,
};

describe('CompanyCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders company information correctly', () => {
    renderWithClient(<CompanyCard company={mockCompany} />);

    expect(screen.getByText('Tech Solutions Inc')).toBeInTheDocument();
    expect(screen.getByText('5 open positions')).toBeInTheDocument();
  });

  it('renders company name initial correctly', () => {
    renderWithClient(<CompanyCard company={mockCompany} />);

    const companyInitial = screen.getByText('T'); // First letter of "Tech Solutions Inc"
    expect(companyInitial).toBeInTheDocument();
    expect(companyInitial).toHaveClass('text-2xl', 'font-bold', 'text-primary');
  });

  it('handles company with no open positions', () => {
    renderWithClient(<CompanyCard company={mockCompanyWithNoPositions} />);

    expect(screen.getByText('0 open positions')).toBeInTheDocument();
  });

  it('handles company with many open positions', () => {
    renderWithClient(<CompanyCard company={mockCompanyWithManyPositions} />);

    expect(screen.getByText('25 open positions')).toBeInTheDocument();
  });

  it('navigates to company profile when clicked', () => {
    renderWithClient(<CompanyCard company={mockCompany} />);

    const companyCard = screen.getByText('Tech Solutions Inc').closest('a');
    expect(companyCard).toHaveAttribute('href', '/companies/tech-solutions');

    fireEvent.click(companyCard!);
    expect(mockNavigate).toHaveBeenCalledWith('/companies/tech-solutions');
  });

  it('renders with proper card structure and styling', () => {
    renderWithClient(<CompanyCard company={mockCompany} />);

    const cardElement = screen.getByText('Tech Solutions Inc').closest('a');
    expect(cardElement).toBeInTheDocument();

    // Check that the card has proper structure
    const companyNameElement = screen.getByText('Tech Solutions Inc');
    expect(companyNameElement).toHaveClass('font-medium', 'text-sm');

    const positionsElement = screen.getByText('5 open positions');
    expect(positionsElement).toHaveClass('text-xs', 'text-muted');
  });

  it('renders company initial with proper styling', () => {
    renderWithClient(<CompanyCard company={mockCompany} />);

    const initialContainer = screen.getByText('T').closest('div');
    expect(initialContainer).toHaveClass(
      'w-20',
      'h-20',
      'rounded-full',
      'overflow-hidden',
      'bg-light',
      'p-1',
      'border',
      'border-border',
      'mb-3',
      'flex',
      'items-center',
      'justify-center'
    );
  });

  it('handles company names with special characters', () => {
    const companyWithSpecialChars: Company = {
      ...mockCompany,
      name: '@Tech Solutions & Co.',
    };

    renderWithClient(<CompanyCard company={companyWithSpecialChars} />);

    expect(screen.getByText('@Tech Solutions & Co.')).toBeInTheDocument();
    expect(screen.getByText('@')).toBeInTheDocument(); // First character
  });

  it('handles empty company name gracefully', () => {
    const companyWithEmptyName: Company = {
      ...mockCompany,
      name: '',
    };

    renderWithClient(<CompanyCard company={companyWithEmptyName} />);

    // Should not crash and should render empty string
    expect(screen.getByText('')).toBeInTheDocument();
  });

  it('renders with correct width and layout', () => {
    renderWithClient(<CompanyCard company={mockCompany} />);

    const cardElement = screen.getByText('Tech Solutions Inc').closest('a');
    expect(cardElement?.firstChild).toHaveClass('w-40', 'flex', 'flex-col', 'items-center', 'text-center', 'cursor-pointer');
  });

  it('has proper accessibility attributes', () => {
    renderWithClient(<CompanyCard company={mockCompany} />);

    const linkElement = screen.getByText('Tech Solutions Inc').closest('a');
    expect(linkElement).toHaveAttribute('href', '/companies/tech-solutions');
    expect(linkElement).toHaveClass('cursor-pointer');
  });

  it('renders company logo placeholder with proper dimensions', () => {
    renderWithClient(<CompanyCard company={mockCompany} />);

    const logoContainer = screen.getByText('T').closest('div');
    expect(logoContainer).toHaveClass('w-20', 'h-20', 'rounded-full');
  });

  it('handles single open position correctly', () => {
    const companyWithOnePosition: Company = {
      ...mockCompany,
      openPositions: 1,
    };

    renderWithClient(<CompanyCard company={companyWithOnePosition} />);

    expect(screen.getByText('1 open positions')).toBeInTheDocument();
  });

  it('renders CardContent with proper structure', () => {
    renderWithClient(<CompanyCard company={mockCompany} />);

    const cardContent = screen.getByText('Tech Solutions Inc').closest('.p-0');
    expect(cardContent).toHaveClass('p-0', 'flex', 'flex-col', 'items-center');
  });

  it('company name appears as clickable link', () => {
    renderWithClient(<CompanyCard company={mockCompany} />);

    const companyNameLink = screen.getByText('Tech Solutions Inc');
    expect(companyNameLink.closest('a')).toHaveAttribute('href', '/companies/tech-solutions');
  });

  it('positions count appears with correct styling', () => {
    renderWithClient(<CompanyCard company={mockCompany} />);

    const positionsText = screen.getByText('5 open positions');
    expect(positionsText).toHaveClass('text-xs', 'text-muted');
  });

  it('handles company with very long name', () => {
    const companyWithLongName: Company = {
      ...mockCompany,
      name: 'Very Long Company Name That Should Be Handled Properly',
    };

    renderWithClient(<CompanyCard company={companyWithLongName} />);

    expect(screen.getByText('Very Long Company Name That Should Be Handled Properly')).toBeInTheDocument();
    expect(screen.getByText('V')).toBeInTheDocument(); // First character
  });

  it('maintains proper spacing between elements', () => {
    renderWithClient(<CompanyCard company={mockCompany} />);

    const logoContainer = screen.getByText('T').closest('div');
    expect(logoContainer).toHaveClass('mb-3'); // Margin bottom for spacing
  });

  it('renders as a complete interactive card', () => {
    renderWithClient(<CompanyCard company={mockCompany} />);

    const cardLink = screen.getByText('Tech Solutions Inc').closest('a');
    expect(cardLink).toBeInTheDocument();
    
    // Verify the entire card is clickable
    fireEvent.click(cardLink!);
    expect(mockNavigate).toHaveBeenCalledWith('/companies/tech-solutions');
  });
});
