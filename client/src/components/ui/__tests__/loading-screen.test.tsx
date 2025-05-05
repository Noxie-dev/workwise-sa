import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoadingScreen } from '../loading-screen';

describe('LoadingScreen', () => {
  it('renders with default props', () => {
    render(<LoadingScreen />);
    
    // Check if loading message is displayed
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Check if the spinner is rendered
    const loadingElement = screen.getByTestId('loading-screen');
    expect(loadingElement).toBeInTheDocument();
    expect(loadingElement).toHaveAttribute('role', 'alert');
    expect(loadingElement).toHaveAttribute('aria-live', 'assertive');
    expect(loadingElement).toHaveAttribute('aria-busy', 'true');
  });

  it('renders with custom message', () => {
    const customMessage = 'Please wait...';
    render(<LoadingScreen message={customMessage} />);
    
    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it('renders with custom spinner', () => {
    const customSpinner = <div data-testid="custom-spinner">Custom Spinner</div>;
    render(<LoadingScreen customSpinner={customSpinner} />);
    
    expect(screen.getByTestId('custom-spinner')).toBeInTheDocument();
    expect(screen.queryByRole('img', { hidden: true })).not.toBeInTheDocument(); // Default spinner should not be present
  });

  it('renders as inline component when fullPage is false', () => {
    render(<LoadingScreen fullPage={false} />);
    
    const loadingElement = screen.getByTestId('loading-screen');
    expect(loadingElement).not.toHaveClass('fixed');
    expect(loadingElement).toHaveClass('flex');
  });

  it('applies custom className', () => {
    const customClass = 'test-custom-class';
    render(<LoadingScreen className={customClass} />);
    
    const loadingElement = screen.getByTestId('loading-screen');
    expect(loadingElement).toHaveClass(customClass);
  });
});
