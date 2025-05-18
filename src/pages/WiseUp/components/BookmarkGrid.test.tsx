import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import BookmarkGrid from './BookmarkGrid';
import { WiseUpItem } from '../types';

// Mock the BookmarkCard component
jest.mock('./BookmarkCard', () => ({
  __esModule: true,
  default: jest.fn(({ item, onRemoveBookmark }) => (
    <div data-testid={`bookmark-card-${item.id}`}>
      <span>{item.title}</span>
      <button 
        data-testid={`remove-btn-${item._bookmarkId}`}
        onClick={() => onRemoveBookmark(item._bookmarkId)}
      >
        Remove
      </button>
    </div>
  )),
}));

// Mock the Skeleton component
jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

describe('BookmarkGrid Component', () => {
  const mockItems = [
    { 
      id: '1', 
      type: 'content', 
      title: 'Test Content', 
      _bookmarkId: 'bookmark1',
      creator: { name: 'Test Creator', role: 'Test Role', avatar: '' },
      video: '',
      description: '',
      resources: [],
      tags: []
    },
    { 
      id: '2', 
      type: 'ad', 
      title: 'Test Ad', 
      _bookmarkId: 'bookmark2',
      advertiser: 'Test Advertiser',
      video: '',
      description: '',
      cta: { primary: { text: '', url: '' }, secondary: { text: '', url: '' } },
      notes: ''
    }
  ] as (WiseUpItem & { _bookmarkId: string })[];

  const mockOnRemoveBookmark = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading skeletons when isLoading is true', () => {
    render(
      <BookmarkGrid 
        items={[]} 
        onRemoveBookmark={mockOnRemoveBookmark} 
        isLoading={true} 
      />
    );
    
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders empty state when no items and not loading', () => {
    render(
      <BookmarkGrid 
        items={[]} 
        onRemoveBookmark={mockOnRemoveBookmark} 
        isLoading={false} 
      />
    );
    
    expect(screen.getByText(/No bookmarks yet/i)).toBeInTheDocument();
    expect(screen.getByText(/You haven't bookmarked any WiseUp content/i)).toBeInTheDocument();
  });

  it('renders bookmark cards for each item', () => {
    render(
      <BookmarkGrid 
        items={mockItems} 
        onRemoveBookmark={mockOnRemoveBookmark} 
        isLoading={false} 
      />
    );
    
    expect(screen.getByTestId('bookmark-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('bookmark-card-2')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(screen.getByText('Test Ad')).toBeInTheDocument();
  });

  it('uses the correct grid layout classes', () => {
    const { container } = render(
      <BookmarkGrid 
        items={mockItems} 
        onRemoveBookmark={mockOnRemoveBookmark} 
        isLoading={false} 
      />
    );
    
    const gridElement = container.firstChild as HTMLElement;
    expect(gridElement).toHaveClass('grid');
    expect(gridElement).toHaveClass('grid-cols-1');
    expect(gridElement).toHaveClass('sm:grid-cols-2');
    expect(gridElement).toHaveClass('lg:grid-cols-3');
    expect(gridElement).toHaveClass('xl:grid-cols-4');
    expect(gridElement).toHaveClass('gap-4');
  });
});
