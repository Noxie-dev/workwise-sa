import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import WiseUpHeader from './WiseUpHeader';

describe('WiseUpHeader Component', () => {
  it('renders without crashing', () => {
    render(<WiseUpHeader />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('displays the WiseUp title', () => {
    render(<WiseUpHeader />);
    expect(screen.getByText('WiseUp')).toBeInTheDocument();
  });

  it('displays the search input with correct placeholder', () => {
    render(<WiseUpHeader />);
    expect(screen.getByPlaceholderText('Search videos...')).toBeInTheDocument();
  });

  it('renders the search icon button', () => {
    render(<WiseUpHeader />);
    // The search icon is inside the input field
    const searchInput = screen.getByLabelText('Search videos');
    expect(searchInput).toBeInTheDocument();
  });

  it('renders the notification button', () => {
    render(<WiseUpHeader />);
    expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
  });

  it('renders the menu button', () => {
    render(<WiseUpHeader />);
    expect(screen.getByLabelText('Menu')).toBeInTheDocument();
  });

  it('has the logo image', () => {
    render(<WiseUpHeader />);
    const logoImage = screen.getByAltText('WorkWise SA Logo');
    expect(logoImage).toBeInTheDocument();
    expect(logoImage).toHaveAttribute('src', '/images/hero-logo.png');
  });
});
