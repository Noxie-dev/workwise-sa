import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UserMenu from './UserMenu';
import { useUserMenu } from '@/hooks/useUserMenu';

// Mock the useUserMenu hook
vi.mock('@/hooks/useUserMenu', () => ({
  useUserMenu: vi.fn(),
}));

describe('UserMenu', () => {
  const mockHandleLogout = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should render login and register buttons when user is not authenticated', () => {
    // Mock the hook to return unauthenticated state
    (useUserMenu as any).mockReturnValue({
      isAuthenticated: false,
      userDisplayName: 'User',
      userEmail: null,
      userPhotoURL: null,
      userInitials: 'U',
      isAdmin: false,
      handleLogout: mockHandleLogout,
    });
    
    render(<UserMenu />);
    
    // Check that login and register buttons are rendered
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
    
    // Check that user menu is not rendered
    expect(screen.queryByLabelText('User menu')).not.toBeInTheDocument();
  });
  
  it('should render user dropdown menu when user is authenticated', () => {
    // Mock the hook to return authenticated state
    (useUserMenu as any).mockReturnValue({
      isAuthenticated: true,
      userDisplayName: 'John Doe',
      userEmail: 'john@example.com',
      userPhotoURL: null,
      userInitials: 'JD',
      isAdmin: false,
      handleLogout: mockHandleLogout,
    });
    
    render(<UserMenu />);
    
    // Check that user menu button is rendered
    const userMenuButton = screen.getByLabelText('User menu');
    expect(userMenuButton).toBeInTheDocument();
    
    // Open the dropdown menu
    fireEvent.click(userMenuButton);
    
    // Check that user info is displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    
    // Check that menu items are displayed
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Applications')).toBeInTheDocument();
    expect(screen.getByText('Job Market Dashboard')).toBeInTheDocument();
    expect(screen.getByText('CV Builder')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Log out')).toBeInTheDocument();
  });
  
  it('should show marketing rules link for admin users', () => {
    // Mock the hook to return admin user state
    (useUserMenu as any).mockReturnValue({
      isAuthenticated: true,
      userDisplayName: 'Admin User',
      userEmail: 'admin@workwisesa.co.za',
      userPhotoURL: null,
      userInitials: 'AU',
      isAdmin: true,
      handleLogout: mockHandleLogout,
    });
    
    render(<UserMenu />);
    
    // Open the dropdown menu
    fireEvent.click(screen.getByLabelText('User menu'));
    
    // Check that marketing rules link is displayed
    expect(screen.getByText('Marketing Rules')).toBeInTheDocument();
  });
  
  it('should not show marketing rules link for non-admin users', () => {
    // Mock the hook to return non-admin user state
    (useUserMenu as any).mockReturnValue({
      isAuthenticated: true,
      userDisplayName: 'Regular User',
      userEmail: 'user@example.com',
      userPhotoURL: null,
      userInitials: 'RU',
      isAdmin: false,
      handleLogout: mockHandleLogout,
    });
    
    render(<UserMenu />);
    
    // Open the dropdown menu
    fireEvent.click(screen.getByLabelText('User menu'));
    
    // Check that marketing rules link is not displayed
    expect(screen.queryByText('Marketing Rules')).not.toBeInTheDocument();
  });
  
  it('should call handleLogout when logout button is clicked', () => {
    // Mock the hook to return authenticated state
    (useUserMenu as any).mockReturnValue({
      isAuthenticated: true,
      userDisplayName: 'John Doe',
      userEmail: 'john@example.com',
      userPhotoURL: null,
      userInitials: 'JD',
      isAdmin: false,
      handleLogout: mockHandleLogout,
    });
    
    render(<UserMenu />);
    
    // Open the dropdown menu
    fireEvent.click(screen.getByLabelText('User menu'));
    
    // Click the logout button
    fireEvent.click(screen.getByText('Log out'));
    
    // Check that handleLogout was called
    expect(mockHandleLogout).toHaveBeenCalledTimes(1);
  });
  
  it('should apply className prop correctly', () => {
    // Mock the hook to return unauthenticated state
    (useUserMenu as any).mockReturnValue({
      isAuthenticated: false,
      userDisplayName: 'User',
      userEmail: null,
      userPhotoURL: null,
      userInitials: 'U',
      isAdmin: false,
      handleLogout: mockHandleLogout,
    });
    
    const { container } = render(<UserMenu className="test-class" />);
    
    // Check that the class is applied
    expect(container.firstChild).toHaveClass('test-class');
  });
});
