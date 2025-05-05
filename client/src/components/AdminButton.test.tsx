import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminButton from './AdminButton';
import { useAdminAuth } from '../hooks/useAdminAuth';

// Mock the useAdminAuth hook
jest.mock('../hooks/useAdminAuth', () => ({
  useAdminAuth: jest.fn(),
}));

describe('AdminButton', () => {
  // Test case: Button should not render when user is not an admin
  test('does not render when user is not an admin', () => {
    // Mock the hook to return isAdmin as false
    (useAdminAuth as jest.Mock).mockReturnValue({
      isAdmin: false,
      hasPermission: jest.fn(),
    });

    render(<AdminButton />);
    
    // The button should not be in the document
    const button = screen.queryByRole('button', { name: /admin menu/i });
    expect(button).not.toBeInTheDocument();
  });

  // Test case: Button renders with default props when user is an admin
  test('renders with default props when user is an admin', () => {
    // Mock the hook to return isAdmin as true
    (useAdminAuth as jest.Mock).mockReturnValue({
      isAdmin: true,
      hasPermission: jest.fn(() => true),
    });

    render(<AdminButton />);
    
    // The button should be in the document
    const button = screen.getByRole('button', { name: /admin menu/i });
    expect(button).toBeInTheDocument();
    
    // Check that the button has the default text
    expect(button).toHaveTextContent('Admin');
  });

  // Test case: Button renders with custom props
  test('renders with custom props', () => {
    // Mock the hook to return isAdmin as true
    (useAdminAuth as jest.Mock).mockReturnValue({
      isAdmin: true,
      hasPermission: jest.fn(() => true),
    });

    render(
      <AdminButton 
        variant="secondary" 
        className="test-class" 
        buttonText="Custom Admin" 
        showIcon={false}
      />
    );
    
    // The button should be in the document with custom text
    const button = screen.getByRole('button', { name: /admin menu/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Custom Admin');
    expect(button).toHaveClass('test-class');
    
    // The icon should not be rendered
    const icon = button.querySelector('svg');
    expect(icon).not.toBeInTheDocument();
  });

  // Test case: Button renders only permitted menu items
  test('renders only permitted menu items', () => {
    // Mock hasPermission to only allow certain permissions
    const mockHasPermission = jest.fn((permission) => {
      return ['dashboard:view', 'marketing:view'].includes(permission);
    });
    
    (useAdminAuth as jest.Mock).mockReturnValue({
      isAdmin: true,
      hasPermission: mockHasPermission,
    });

    render(<AdminButton />);
    
    // Open the dropdown menu
    const button = screen.getByRole('button', { name: /admin menu/i });
    button.click();
    
    // Check that only permitted items are rendered
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Marketing Rules')).toBeInTheDocument();
    
    // These should not be rendered due to permission check
    expect(screen.queryByText('Analytics')).not.toBeInTheDocument();
    expect(screen.queryByText('User Management')).not.toBeInTheDocument();
    expect(screen.queryByText('Admin Settings')).not.toBeInTheDocument();
  });

  // Test case: Button renders custom menu items
  test('renders custom menu items', () => {
    (useAdminAuth as jest.Mock).mockReturnValue({
      isAdmin: true,
      hasPermission: jest.fn(() => true),
    });

    const customMenuItems = [
      {
        href: "/custom-page",
        label: "Custom Page",
      },
      {
        href: "/another-page",
        label: "Another Page",
      }
    ];

    render(<AdminButton customMenuItems={customMenuItems} />);
    
    // Open the dropdown menu
    const button = screen.getByRole('button', { name: /admin menu/i });
    button.click();
    
    // Check that custom items are rendered
    expect(screen.getByText('Custom Page')).toBeInTheDocument();
    expect(screen.getByText('Another Page')).toBeInTheDocument();
    
    // Default items should not be rendered
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Marketing Rules')).not.toBeInTheDocument();
  });
});
