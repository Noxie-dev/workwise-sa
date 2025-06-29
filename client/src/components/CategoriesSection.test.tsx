import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CategoriesSection from './CategoriesSection';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type Category } from '@shared/schema';

// Mock dependencies
jest.mock('./CategoryCard', () => ({
  __esModule: true,
  default: ({ category }: { category: Category }) => (
    <div data-testid="category-card">
      <h3>{category.name}</h3>
      <p>{category.jobCount}+ Jobs</p>
    </div>
  )
}));

jest.mock('./ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  )
}));

jest.mock('wouter', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href} data-testid="link">
      {children}
    </a>
  )
}));

// Mock fetch for API calls
const mockCategories: Category[] = [
  {
    id: 1,
    name: 'IT & Technology',
    slug: 'it-technology',
    icon: 'computer',
    jobCount: 120
  },
  {
    id: 2,
    name: 'Sales & Marketing',
    slug: 'sales-marketing',
    icon: 'shoppingBag',
    jobCount: 85
  }
];

// Setup test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithClient = (ui: React.ReactElement) => {
  const testQueryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={testQueryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('CategoriesSection Component', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders loading state with skeletons', async () => {
    // Mock the fetch to delay response
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(resolve => {
      setTimeout(() => {
        resolve({
          ok: true,
          json: () => Promise.resolve(mockCategories)
        });
      }, 100);
    }));

    renderWithClient(<CategoriesSection />);

    // Check if loading state is rendered
    expect(screen.getAllByTestId('skeleton')).toHaveLength(5);
  });

  it('renders error state when API call fails', async () => {
    // Mock fetch to return an error
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Failed to fetch'));

    renderWithClient(<CategoriesSection />);

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText('Failed to load categories. Please try again later.')).toBeInTheDocument();
    });
  });

  it('renders no categories message when API returns empty array', async () => {
    // Mock fetch to return empty array
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([])
    });

    renderWithClient(<CategoriesSection />);

    // Wait for no categories message to appear
    await waitFor(() => {
      expect(screen.getByText('No categories found.')).toBeInTheDocument();
    });
  });

  it('renders categories correctly when API returns data', async () => {
    // Mock fetch to return categories
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockCategories)
    });

    renderWithClient(<CategoriesSection />);

    // Wait for categories to appear
    await waitFor(() => {
      // Check if each category is rendered
      expect(screen.getByText('IT & Technology')).toBeInTheDocument();
      expect(screen.getByText('Sales & Marketing')).toBeInTheDocument();
      
      // Check if category cards are rendered
      expect(screen.getAllByTestId('category-card')).toHaveLength(2);
    });
  });

  it('renders "View All" link correctly', async () => {
    // Mock fetch to return categories
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockCategories)
    });

    renderWithClient(<CategoriesSection />);

    // Check if "View All" link is rendered with correct href
    expect(screen.getByText('View All')).toBeInTheDocument();
    expect(screen.getByTestId('link')).toHaveAttribute('href', '/categories');
  });
});

