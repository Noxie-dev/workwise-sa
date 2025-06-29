import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import WiseUpBookmarksPage from './WiseUpBookmarksPage';
import { wiseupService } from '@/services/wiseupService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

// Mock the dependencies
jest.mock('@/services/wiseupService', () => ({
  wiseupService: {
    getBookmarkedItems: jest.fn(),
    removeBookmarkById: jest.fn(),
  },
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/components/ui/use-toast', () => ({
  useToast: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  Link: ({ children, to }: { children: React.ReactNode, to: string }) => (
    <a href={to} data-testid="mock-link">{children}</a>
  ),
}));

// Mock BookmarkGrid component
jest.mock('./components/BookmarkGrid', () => ({
  __esModule: true,
  default: jest.fn(({ items, onRemoveBookmark, isLoading }) => (
    <div data-testid="bookmark-grid">
      <div data-testid="loading-state">{isLoading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="items-count">Items: {items.length}</div>
      {items.map((item: any) => (
        <div key={item.id} data-testid={`item-${item.id}`}>
          <span>{item.title}</span>
          <button 
            data-testid={`remove-btn-${item._bookmarkId}`}
            onClick={() => onRemoveBookmark(item._bookmarkId)}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  )),
}));

describe('WiseUpBookmarksPage Component', () => {
  const mockToast = { toast: jest.fn() };
  const mockUser = { uid: 'test-user-id' };
  const mockBookmarkedItems = [
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
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ currentUser: mockUser });
    (useToast as jest.Mock).mockReturnValue(mockToast);
    (wiseupService.getBookmarkedItems as jest.Mock).mockResolvedValue({
      items: mockBookmarkedItems,
      lastDoc: null
    });
  });

  it('renders loading state initially', () => {
    render(<WiseUpBookmarksPage />);
    expect(screen.getByTestId('loading-state')).toHaveTextContent('Loading');
  });

  it('fetches and displays bookmarked items', async () => {
    render(<WiseUpBookmarksPage />);
    
    await waitFor(() => {
      expect(wiseupService.getBookmarkedItems).toHaveBeenCalledWith(
        'test-user-id', 12, null
      );
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading');
      expect(screen.getByTestId('items-count')).toHaveTextContent('Items: 2');
      expect(screen.getByText('Test Content')).toBeInTheDocument();
      expect(screen.getByText('Test Ad')).toBeInTheDocument();
    });
  });

  it('handles removing a bookmark', async () => {
    render(<WiseUpBookmarksPage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('items-count')).toHaveTextContent('Items: 2');
    });
    
    // Click the remove button for the first bookmark
    fireEvent.click(screen.getByTestId('remove-btn-bookmark1'));
    
    await waitFor(() => {
      expect(wiseupService.removeBookmarkById).toHaveBeenCalledWith('bookmark1');
      expect(mockToast.toast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Bookmark Removed'
      }));
    });
  });

  it('shows error message when fetching fails', async () => {
    (wiseupService.getBookmarkedItems as jest.Mock).mockRejectedValue(new Error('Fetch error'));
    
    render(<WiseUpBookmarksPage />);
    
    await waitFor(() => {
      expect(mockToast.toast).toHaveBeenCalledWith(expect.objectContaining({
        variant: 'destructive',
        title: 'Error Loading Bookmarks'
      }));
      expect(screen.getByText(/Failed to load bookmarks/)).toBeInTheDocument();
    });
  });

  it('shows error when user is not logged in', async () => {
    (useAuth as jest.Mock).mockReturnValue({ currentUser: null });
    
    render(<WiseUpBookmarksPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/You must be logged in to view bookmarks/)).toBeInTheDocument();
    });
  });
});
