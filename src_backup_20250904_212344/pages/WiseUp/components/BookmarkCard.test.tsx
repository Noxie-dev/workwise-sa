import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import BookmarkCard from './BookmarkCard';
import { WiseUpItem } from '../types';

// Mock the react-router-dom Link component
jest.mock('react-router-dom', () => ({
  Link: ({ children, to, className }: { children: React.ReactNode, to: string, className?: string }) => (
    <a href={to} className={className} data-testid="mock-link">{children}</a>
  ),
}));

// Mock the UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div data-testid="card-content" className={className}>{children}</div>
  ),
  CardFooter: ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div data-testid="card-footer" className={className}>{children}</div>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ 
    children, 
    variant, 
    size, 
    className, 
    onClick 
  }: { 
    children: React.ReactNode, 
    variant?: string, 
    size?: string, 
    className?: string,
    onClick?: () => void
  }) => (
    <button
      data-testid="button"
      data-variant={variant}
      data-size={size}
      className={className}
      onClick={onClick}
    >
      {children}
    </button>
  ),
}));

jest.mock('lucide-react', () => ({
  Bookmark: ({ className }: { className?: string }) => (
    <span data-testid="bookmark-icon" className={className}>
      [Bookmark]
    </span>
  ),
  X: ({ className }: { className?: string }) => (
    <span data-testid="x-icon" className={className}>
      [X]
    </span>
  ),
}));

describe('BookmarkCard Component', () => {
  // Mock content item
  const mockContentItem = {
    id: '1',
    type: 'content',
    title: 'Test Content Title',
    creator: {
      name: 'Test Creator',
      role: 'Test Role',
      avatar: 'test-avatar.jpg'
    },
    video: 'test-video.mp4',
    description: 'Test description',
    resources: [],
    tags: ['test', 'content'],
    _bookmarkId: 'bookmark1'
  } as WiseUpItem & { _bookmarkId: string };

  // Mock ad item
  const mockAdItem = {
    id: '2',
    type: 'ad',
    title: 'Test Ad Title',
    advertiser: 'Test Advertiser',
    video: 'test-ad-video.mp4',
    description: 'Test ad description',
    cta: {
      primary: { text: 'Primary CTA', url: 'https://example.com/primary' },
      secondary: { text: 'Secondary CTA', url: 'https://example.com/secondary' }
    },
    notes: 'Test notes',
    _bookmarkId: 'bookmark2'
  } as WiseUpItem & { _bookmarkId: string };

  const mockOnRemoveBookmark = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders content item correctly', () => {
    render(
      <BookmarkCard 
        item={mockContentItem} 
        onRemoveBookmark={mockOnRemoveBookmark} 
      />
    );
    
    expect(screen.getByText('Test Content Title')).toBeInTheDocument();
    expect(screen.getByText('Test Creator')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument(); // Type badge
  });

  it('renders ad item correctly', () => {
    render(
      <BookmarkCard 
        item={mockAdItem} 
        onRemoveBookmark={mockOnRemoveBookmark} 
      />
    );
    
    expect(screen.getByText('Test Ad Title')).toBeInTheDocument();
    expect(screen.getByText('Ad by Test Advertiser')).toBeInTheDocument();
    expect(screen.getByText('Ad')).toBeInTheDocument(); // Type badge
  });

  it('calls onRemoveBookmark when remove button is clicked', () => {
    render(
      <BookmarkCard 
        item={mockContentItem} 
        onRemoveBookmark={mockOnRemoveBookmark} 
      />
    );
    
    const removeButton = screen.getByTestId('button');
    fireEvent.click(removeButton);
    
    expect(mockOnRemoveBookmark).toHaveBeenCalledWith('bookmark1');
  });

  it('links to the correct WiseUp item page', () => {
    render(
      <BookmarkCard 
        item={mockContentItem} 
        onRemoveBookmark={mockOnRemoveBookmark} 
      />
    );
    
    const link = screen.getByTestId('mock-link');
    expect(link).toHaveAttribute('href', '/wiseup?itemId=1');
  });

  it('prevents navigation when clicking the remove button', () => {
    const preventDefault = jest.fn();
    const stopPropagation = jest.fn();
    
    render(
      <BookmarkCard 
        item={mockContentItem} 
        onRemoveBookmark={mockOnRemoveBookmark} 
      />
    );
    
    const removeButton = screen.getByTestId('button');
    fireEvent.click(removeButton, { 
      preventDefault, 
      stopPropagation 
    });
    
    expect(preventDefault).toHaveBeenCalled();
    expect(stopPropagation).toHaveBeenCalled();
  });
});
