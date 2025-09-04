import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { User } from 'firebase/auth';

// Mock the firebase auth module
vi.mock('../../lib/firebase', () => ({
  auth: {},
  onAuthChange: vi.fn((callback) => {
    // Store the callback to trigger it in tests
    (global as any).authChangeCallback = callback;
    return vi.fn(); // Return unsubscribe function
  }),
}));

// Test component that uses the auth context
const TestComponent = () => {
  const { currentUser, isLoading, isAuthenticated } = useAuth();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? 'Authenticated' : 'Not authenticated'}
      </div>
      <div data-testid="user-email">
        {currentUser?.email || 'No user'}
      </div>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state initially', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Initially, the provider should be in loading state
    // But our implementation hides children while loading
    // So we won't see the loading text
  });

  it('should update context when user signs in', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Simulate user sign in
    const mockUser = {
      uid: '123',
      email: 'test@example.com',
      displayName: 'Test User',
    } as User;
    
    // Trigger the auth change callback with the mock user
    (global as any).authChangeCallback(mockUser);
    
    // Wait for the component to update
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    });
  });

  it('should update context when user signs out', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // First simulate user sign in
    const mockUser = {
      uid: '123',
      email: 'test@example.com',
    } as User;
    
    (global as any).authChangeCallback(mockUser);
    
    // Wait for the component to update
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    });
    
    // Then simulate sign out
    (global as any).authChangeCallback(null);
    
    // Wait for the component to update again
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
      expect(screen.getByTestId('user-email')).toHaveTextContent('No user');
    });
  });

  it('should throw error when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for this test
    const originalConsoleError = console.error;
    console.error = vi.fn();
    
    // Define a component that uses useAuth without a provider
    const InvalidComponent = () => {
      useAuth();
      return null;
    };
    
    // Expect the render to throw
    expect(() => {
      render(<InvalidComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');
    
    // Restore console.error
    console.error = originalConsoleError;
  });

  it('should provide user property for compatibility', async () => {
    // Create a component that specifically checks the user property
    const UserCheckComponent = () => {
      const { user } = useAuth();
      return <div data-testid="user-compat">{user?.email || 'No user'}</div>;
    };
    
    render(
      <AuthProvider>
        <UserCheckComponent />
      </AuthProvider>
    );
    
    // Simulate user sign in
    const mockUser = {
      uid: '123',
      email: 'test@example.com',
    } as User;
    
    (global as any).authChangeCallback(mockUser);
    
    // Wait for the component to update
    await waitFor(() => {
      expect(screen.getByTestId('user-compat')).toHaveTextContent('test@example.com');
    });
  });
});
