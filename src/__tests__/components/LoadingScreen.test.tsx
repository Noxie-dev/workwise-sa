import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LoadingScreen } from '../../components/ui/loading-screen';

describe('LoadingScreen Component', () => {
  it('renders with default props', () => {
    render(<LoadingScreen />);
    
    // Check for the loading spinner
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    
    // Check for the default message
    const message = screen.getByText('Loading...');
    expect(message).toBeInTheDocument();
    
    // Check that it's a full page loading screen by default
    const container = spinner.parentElement?.parentElement;
    expect(container).toHaveClass('fixed inset-0');
  });

  it('renders with custom message', () => {
    render(<LoadingScreen message="Please wait..." />);
    
    const message = screen.getByText('Please wait...');
    expect(message).toBeInTheDocument();
  });

  it('renders as inline loading when fullPage is false', () => {
    render(<LoadingScreen fullPage={false} />);
    
    // The container should not have fixed positioning
    const spinner = screen.getByRole('status');
    const container = spinner.parentElement?.parentElement;
    expect(container).not.toHaveClass('fixed inset-0');
    expect(container).toHaveClass('flex items-center justify-center');
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<LoadingScreen size="sm" />);
    
    // Small size
    let spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('h-4 w-4');
    
    // Default size
    rerender(<LoadingScreen size="default" />);
    spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('h-6 w-6');
    
    // Large size
    rerender(<LoadingScreen size="lg" />);
    spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('h-8 w-8');
  });

  it('applies backdrop blur when specified', () => {
    const { rerender } = render(<LoadingScreen backdropBlur="sm" />);
    
    // Small blur
    let container = screen.getByRole('status').parentElement?.parentElement;
    expect(container).toHaveClass('backdrop-blur-sm');
    
    // Medium blur
    rerender(<LoadingScreen backdropBlur="md" />);
    container = screen.getByRole('status').parentElement?.parentElement;
    expect(container).toHaveClass('backdrop-blur-md');
    
    // Large blur
    rerender(<LoadingScreen backdropBlur="lg" />);
    container = screen.getByRole('status').parentElement?.parentElement;
    expect(container).toHaveClass('backdrop-blur-lg');
  });

  it('applies custom className to the container', () => {
    render(<LoadingScreen className="custom-loading-class" />);
    
    const spinner = screen.getByRole('status');
    const container = spinner.parentElement?.parentElement;
    expect(container).toHaveClass('custom-loading-class');
  });

  it('applies custom className to the spinner', () => {
    render(<LoadingScreen spinnerClassName="custom-spinner-class" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('custom-spinner-class');
  });

  it('applies custom className to the message', () => {
    render(<LoadingScreen messageClassName="custom-message-class" />);
    
    const message = screen.getByText('Loading...');
    expect(message).toHaveClass('custom-message-class');
  });
});
