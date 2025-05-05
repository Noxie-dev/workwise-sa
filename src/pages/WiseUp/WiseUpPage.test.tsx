import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import WiseUpPage from './WiseUpPage';
import { wiseupService } from '@/services/wiseupService';
import { ContentItem, AdItem } from './types';
import { sampleContentItems, sampleAdItems } from './data/sampleItems';
import userEvent from '@testing-library/user-event';

// Mock dependencies
jest.mock('@/services/wiseupService', () => ({
  wiseupService: {
    getContent: jest.fn(),
    getAds: jest.fn(),
    interleaveContentAndAds: jest.fn(),
    trackAdImpression: jest.fn(),
  },
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    currentUser: {
      uid: 'test-user-123',
      interests: ['Technology', 'Career Development']
    },
    isLoading: false,
  })),
}));

jest.mock('@/components/ui/use-toast', () => ({
  useToast: jest.fn(() => ({
    toast: jest.fn(),
  })),
}));

jest.mock('@/components/WiseUpHeader', () => ({
  __esModule: true,
  default: jest.fn(() => <header data-testid="wiseup-header">WiseUp Header</header>),
}));

jest.mock('./WiseUpLayout', () => ({
  __esModule: true,
  default: jest.fn(({
    currentItem,
    isPlaying,
    isMuted,
    onTogglePlay,
    onToggleMute,
    onNext,
    onPrevious,
    onEnded,
    isNextDisabled,
    isPreviousDisabled,
  }) => (
    <div data-testid="wiseup-layout">
      <div data-testid="current-item">{currentItem?.title || 'No item'}</div>
      <div data-testid="playback-state">{isPlaying ? 'Playing' : 'Paused'}</div>
      <div data-testid="mute-state">{isMuted ? 'Muted' : 'Unmuted'}</div>
      <button data-testid="toggle-play" onClick={onTogglePlay}>Toggle Play</button>
      <button data-testid="toggle-mute" onClick={onToggleMute}>Toggle Mute</button>
      <button data-testid="next-button" onClick={onNext} disabled={isNextDisabled}>Next</button>
      <button data-testid="prev-button" onClick={onPrevious} disabled={isPreviousDisabled}>Previous</button>
      <button data-testid="video-ended" onClick={onEnded}>End Video</button>
    </div>
  )),
}));

jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: jest.fn(({ className, ...props }) => (
    <div data-testid="skeleton" className={className} {...props} />
  )),
}));

jest.mock('react-helmet', () => ({
  Helmet: ({ children }) => <div data-testid="helmet">{children}</div>,
}));

jest.mock('@/components/ui/input', () => ({
  Input: jest.fn(({ placeholder, value, onChange, className, ...props }) => (
    <input
      data-testid="search-input"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={className}
      {...props}
    />
  )),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: jest.fn(({ children, variant, className, onClick }) => (
    <span
      data-testid="tag-badge"
      data-variant={variant}
      className={className}
      onClick={onClick}
    >
      {children}
    </span>
  )),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Sample data for testing
const mockContentItems: ContentItem[] = sampleContentItems.slice(0, 3);
const mockAdItems: AdItem[] = sampleAdItems.slice(0, 2);
const mockCombinedItems = [
  mockContentItems[0],
  mockContentItems[1],
  mockAdItems[0],
  mockContentItems[2],
  mockAdItems[1],
];

describe('WiseUpPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();

    // Default mock implementations
    (wiseupService.getContent as jest.Mock).mockResolvedValue(mockContentItems);
    (wiseupService.getAds as jest.Mock).mockResolvedValue(mockAdItems);
    (wiseupService.interleaveContentAndAds as jest.Mock).mockReturnValue(mockCombinedItems);
  });

  it('renders loading state initially', async () => {
    // Delay the resolution of getContent to ensure we see loading state
    (wiseupService.getContent as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockContentItems), 100))
    );

    render(<WiseUpPage />);

    // Check for loading skeleton
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();

    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByTestId('wiseup-layout')).toBeInTheDocument();
    });
  });

  it('renders content after successful data fetch', async () => {
    render(<WiseUpPage />);

    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByTestId('wiseup-layout')).toBeInTheDocument();
    });

    // Verify service calls
    expect(wiseupService.getContent).toHaveBeenCalled();
    expect(wiseupService.getAds).toHaveBeenCalled();
    expect(wiseupService.interleaveContentAndAds).toHaveBeenCalledWith(
      mockContentItems,
      mockAdItems
    );

    // Check that first item is displayed
    expect(screen.getByTestId('current-item')).toHaveTextContent(mockCombinedItems[0].title);
  });

  it('shows error state when data fetch fails', async () => {
    // Mock API failure
    const errorMessage = 'Failed to fetch data';
    (wiseupService.getContent as jest.Mock).mockRejectedValue(new Error(errorMessage));

    render(<WiseUpPage />);

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText(/Error Loading Content/i)).toBeInTheDocument();
    });
  });

  it('navigates to next and previous items', async () => {
    render(<WiseUpPage />);

    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByTestId('wiseup-layout')).toBeInTheDocument();
    });

    // Initial state - first item
    expect(screen.getByTestId('current-item')).toHaveTextContent(mockCombinedItems[0].title);

    // Navigate to next item
    fireEvent.click(screen.getByTestId('next-button'));
    expect(screen.getByTestId('current-item')).toHaveTextContent(mockCombinedItems[1].title);

    // Navigate to next item again
    fireEvent.click(screen.getByTestId('next-button'));
    expect(screen.getByTestId('current-item')).toHaveTextContent(mockCombinedItems[2].title);

    // Navigate back
    fireEvent.click(screen.getByTestId('prev-button'));
    expect(screen.getByTestId('current-item')).toHaveTextContent(mockCombinedItems[1].title);
  });

  it('toggles play/pause state', async () => {
    render(<WiseUpPage />);

    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByTestId('wiseup-layout')).toBeInTheDocument();
    });

    // Initial state should be playing
    expect(screen.getByTestId('playback-state')).toHaveTextContent('Playing');

    // Toggle play/pause
    fireEvent.click(screen.getByTestId('toggle-play'));
    expect(screen.getByTestId('playback-state')).toHaveTextContent('Paused');

    // Toggle again
    fireEvent.click(screen.getByTestId('toggle-play'));
    expect(screen.getByTestId('playback-state')).toHaveTextContent('Playing');
  });

  it('toggles mute state', async () => {
    render(<WiseUpPage />);

    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByTestId('wiseup-layout')).toBeInTheDocument();
    });

    // Initial state should be unmuted
    expect(screen.getByTestId('mute-state')).toHaveTextContent('Unmuted');

    // Toggle mute
    fireEvent.click(screen.getByTestId('toggle-mute'));
    expect(screen.getByTestId('mute-state')).toHaveTextContent('Muted');

    // Toggle again
    fireEvent.click(screen.getByTestId('toggle-mute'));
    expect(screen.getByTestId('mute-state')).toHaveTextContent('Unmuted');
  });

  it('tracks ad impressions when viewing an ad', async () => {
    render(<WiseUpPage />);

    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByTestId('wiseup-layout')).toBeInTheDocument();
    });

    // Navigate to the ad (index 2)
    fireEvent.click(screen.getByTestId('next-button'));
    fireEvent.click(screen.getByTestId('next-button'));

    // Check that the ad impression was tracked
    expect(wiseupService.trackAdImpression).toHaveBeenCalledWith(
      mockCombinedItems[2].id,
      'test-user-123'
    );
  });

  it('auto-advances to next item when video ends', async () => {
    render(<WiseUpPage />);

    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByTestId('wiseup-layout')).toBeInTheDocument();
    });

    // Initial state - first item
    expect(screen.getByTestId('current-item')).toHaveTextContent(mockCombinedItems[0].title);

    // Simulate video ended
    fireEvent.click(screen.getByTestId('video-ended'));

    // Should advance to next item
    expect(screen.getByTestId('current-item')).toHaveTextContent(mockCombinedItems[1].title);
  });

  it('responds to keyboard navigation', async () => {
    render(<WiseUpPage />);

    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByTestId('wiseup-layout')).toBeInTheDocument();
    });

    // Initial state - first item
    expect(screen.getByTestId('current-item')).toHaveTextContent(mockCombinedItems[0].title);

    // Navigate with arrow keys
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(screen.getByTestId('current-item')).toHaveTextContent(mockCombinedItems[1].title);

    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(screen.getByTestId('current-item')).toHaveTextContent(mockCombinedItems[0].title);

    // Toggle play with space
    expect(screen.getByTestId('playback-state')).toHaveTextContent('Playing');
    fireEvent.keyDown(document, { key: ' ' });
    expect(screen.getByTestId('playback-state')).toHaveTextContent('Paused');

    // Toggle mute with 'm' key
    expect(screen.getByTestId('mute-state')).toHaveTextContent('Unmuted');
    fireEvent.keyDown(document, { key: 'm' });
    expect(screen.getByTestId('mute-state')).toHaveTextContent('Muted');
  });

  it('filters content by search query', async () => {
    render(<WiseUpPage />);

    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByTestId('wiseup-layout')).toBeInTheDocument();
    });

    // Get the search input
    const searchInput = screen.getByTestId('search-input');

    // Enter a search query that matches the first item
    await act(async () => {
      await userEvent.type(searchInput, mockCombinedItems[0].title);
    });

    // Should still show the first item
    expect(screen.getByTestId('current-item')).toHaveTextContent(mockCombinedItems[0].title);

    // Clear the search and enter a query that matches the second item
    await act(async () => {
      await userEvent.clear(searchInput);
      await userEvent.type(searchInput, mockCombinedItems[1].title);
    });

    // Should now show the second item as the first result
    expect(screen.getByTestId('current-item')).toHaveTextContent(mockCombinedItems[1].title);
  });

  it('filters content by type', async () => {
    render(<WiseUpPage />);

    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByTestId('wiseup-layout')).toBeInTheDocument();
    });

    // Find the content filter button and click it
    const contentButton = screen.getByText('Content');
    fireEvent.click(contentButton);

    // Should show only content items (not ads)
    expect(screen.getByTestId('current-item')).toHaveTextContent(mockContentItems[0].title);

    // Navigate to next item should show the next content item
    fireEvent.click(screen.getByTestId('next-button'));
    expect(screen.getByTestId('current-item')).toHaveTextContent(mockContentItems[1].title);

    // Find the ad filter button and click it
    const adButton = screen.getByText('Sponsored');
    fireEvent.click(adButton);

    // Should show only ad items
    expect(screen.getByTestId('current-item')).toHaveTextContent(mockAdItems[0].title);
  });

  it('loads and saves user preferences', async () => {
    // Set up mock localStorage with preferences
    localStorageMock.setItem('wiseup-preferences', JSON.stringify({
      autoplay: false,
      muted: true,
      showRelated: false
    }));

    render(<WiseUpPage />);

    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByTestId('wiseup-layout')).toBeInTheDocument();
    });

    // Should respect the loaded preferences
    expect(screen.getByTestId('playback-state')).toHaveTextContent('Paused');
    expect(screen.getByTestId('mute-state')).toHaveTextContent('Muted');

    // Toggle preferences
    const autoplayButton = screen.getByText('Autoplay: Off');
    fireEvent.click(autoplayButton);

    // Should update localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'wiseup-preferences',
      expect.stringContaining('"autoplay":true')
    );
  });
});
