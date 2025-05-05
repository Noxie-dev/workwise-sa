import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CommentSection from './CommentSection';
import { commentsService, Comment } from '@/services/commentsService';
import { formatDistanceToNow } from 'date-fns';

// Mock React Query
jest.mock('@tanstack/react-query', () => {
  const originalModule = jest.requireActual('@tanstack/react-query');
  return {
    ...originalModule,
    useQuery: jest.fn(() => ({
      data: { pages: [{ comments: [] }] },
      isLoading: false,
      isError: false,
      error: null,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    })),
    useMutation: jest.fn(() => ({
      mutate: jest.fn(),
      isPending: false,
    })),
    useQueryClient: jest.fn(() => ({
      invalidateQueries: jest.fn(),
      cancelQueries: jest.fn(),
    })),
  };
});

// Mock dependencies
jest.mock('@/services/commentsService', () => ({
  commentsService: {
    getComments: jest.fn(),
    addComment: jest.fn(),
    deleteComment: jest.fn(),
  },
  Comment: {}
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  }),
}));

jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '5 minutes ago'),
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, type, className }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      type={type}
      className={className}
      data-testid="button"
    >
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: ({ value, onChange, placeholder, rows, maxLength, disabled }: any) => (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      maxLength={maxLength}
      disabled={disabled}
      data-testid="textarea"
    />
  ),
}));

jest.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className }: any) => (
    <div data-testid="avatar" className={className}>{children}</div>
  ),
  AvatarImage: ({ src, alt }: any) => (
    <img data-testid="avatar-image" src={src} alt={alt} />
  ),
  AvatarFallback: ({ children }: any) => (
    <div data-testid="avatar-fallback">{children}</div>
  ),
}));

jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: any) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

jest.mock('lucide-react', () => ({
  X: ({ className }: any) => (
    <span data-testid="x-icon" className={className}>X</span>
  ),
}));

// Mock comments data
const mockComments: Comment[] = [
  {
    id: 'comment1',
    userId: 'user123',
    userName: 'Test User',
    userAvatar: 'https://example.com/avatar.jpg',
    text: 'This is a test comment',
    createdAt: new Date('2023-01-01T12:00:00Z'),
  },
  {
    id: 'comment2',
    userId: 'user456',
    userName: 'Another User',
    userAvatar: 'https://example.com/avatar2.jpg',
    text: 'This is another test comment',
    createdAt: new Date('2023-01-02T12:00:00Z'),
  },
];

// Mock user
const mockUser = {
  uid: 'user123',
  displayName: 'Test User',
  photoURL: 'https://example.com/avatar.jpg',
  email: 'test@example.com',
};

describe('CommentSection Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (commentsService.getComments as jest.Mock).mockResolvedValue({
      comments: mockComments,
      lastDoc: null
    });
    (commentsService.addComment as jest.Mock).mockImplementation((contentId, user, text) => {
      return Promise.resolve({
        id: 'new-comment-id',
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userAvatar: user.photoURL || '/placeholder-avatar.png',
        text,
        createdAt: new Date(),
      });
    });
  });

  it('renders loading state initially', () => {
    // Mock loading state
    const useQueryMock = require('@tanstack/react-query').useQuery;
    useQueryMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    });

    render(<CommentSection contentId="content123" currentUser={mockUser} />);
    expect(screen.getAllByTestId('skeleton')).toHaveLength(2);
  });

  it('fetches and displays comments', async () => {
    // Mock successful query with comments
    const useQueryMock = require('@tanstack/react-query').useQuery;
    useQueryMock.mockReturnValue({
      data: { pages: [{ comments: mockComments }] },
      isLoading: false,
      isError: false,
      error: null,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    });

    render(<CommentSection contentId="content123" currentUser={mockUser} />);

    // Check if comments are displayed
    expect(screen.getByText('This is a test comment')).toBeInTheDocument();
    expect(screen.getByText('This is another test comment')).toBeInTheDocument();
  });

  it('allows adding a new comment', async () => {
    // Mock successful query with comments
    const useQueryMock = require('@tanstack/react-query').useQuery;
    useQueryMock.mockReturnValue({
      data: { pages: [{ comments: mockComments }] },
      isLoading: false,
      isError: false,
      error: null,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    });

    // Mock mutation
    const useMutationMock = require('@tanstack/react-query').useMutation;
    const mutateMock = jest.fn();
    useMutationMock.mockReturnValue({
      mutate: mutateMock,
      isPending: false,
    });

    render(<CommentSection contentId="content123" currentUser={mockUser} />);

    // Type a new comment
    const textarea = screen.getByTestId('textarea');
    fireEvent.change(textarea, { target: { value: 'My new comment' } });

    // Submit the form
    const form = screen.getByRole('button', { name: /Post Comment/i });
    fireEvent.click(form);

    // Check if the mutation was called
    expect(mutateMock).toHaveBeenCalledWith({ text: 'My new comment' });
  });

  it('shows delete button only for user\'s own comments', async () => {
    // Mock successful query with comments
    const useQueryMock = require('@tanstack/react-query').useQuery;
    useQueryMock.mockReturnValue({
      data: { pages: [{ comments: mockComments }] },
      isLoading: false,
      isError: false,
      error: null,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    });

    render(<CommentSection contentId="content123" currentUser={mockUser} />);

    // There should be exactly one delete button (for the first comment which belongs to the current user)
    const deleteButtons = screen.getAllByTestId('x-icon');
    expect(deleteButtons).toHaveLength(1);
  });

  it('handles comment deletion', async () => {
    // Mock window.confirm to always return true
    const originalConfirm = window.confirm;
    window.confirm = jest.fn(() => true);

    // Mock successful query with comments
    const useQueryMock = require('@tanstack/react-query').useQuery;
    useQueryMock.mockReturnValue({
      data: { pages: [{ comments: mockComments }] },
      isLoading: false,
      isError: false,
      error: null,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    });

    // Mock mutation
    const useMutationMock = require('@tanstack/react-query').useMutation;
    const mutateMock = jest.fn();
    useMutationMock.mockReturnValue({
      mutate: mutateMock,
      isPending: false,
    });

    render(<CommentSection contentId="content123" currentUser={mockUser} />);

    // Find and click the delete button
    const deleteButton = screen.getByTestId('x-icon');
    fireEvent.click(deleteButton);

    // Check if the mutation was called
    expect(mutateMock).toHaveBeenCalledWith('comment1');

    // Restore original confirm
    window.confirm = originalConfirm;
  });

  it('shows empty state when no comments are available', async () => {
    // Mock empty comments
    const useQueryMock = require('@tanstack/react-query').useQuery;
    useQueryMock.mockReturnValue({
      data: { pages: [{ comments: [] }] },
      isLoading: false,
      isError: false,
      error: null,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    });

    render(<CommentSection contentId="content123" currentUser={mockUser} />);

    expect(screen.getByText('No comments yet. Be the first!')).toBeInTheDocument();
  });

  it('disables the post button when textarea is empty', () => {
    // Mock successful query with comments
    const useQueryMock = require('@tanstack/react-query').useQuery;
    useQueryMock.mockReturnValue({
      data: { pages: [{ comments: mockComments }] },
      isLoading: false,
      isError: false,
      error: null,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    });

    render(<CommentSection contentId="content123" currentUser={mockUser} />);

    const postButton = screen.getByRole('button', { name: /Post Comment/i });
    expect(postButton).toBeDisabled();

    // Type something in the textarea
    const textarea = screen.getByTestId('textarea');
    fireEvent.change(textarea, { target: { value: 'New comment' } });

    // Button should be enabled
    expect(postButton).not.toBeDisabled();

    // Clear the textarea
    fireEvent.change(textarea, { target: { value: '' } });

    // Button should be disabled again
    expect(postButton).toBeDisabled();
  });
});
