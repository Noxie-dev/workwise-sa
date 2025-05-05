import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContentDetails from './ContentDetails';
import { ContentItem } from '../types';

// Create simple mocks for UI components to avoid hook issues in tests
jest.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div data-testid="avatar" className={className}>{children}</div>
  ),
  AvatarImage: ({ src, alt }: { src: string, alt: string }) => (
    <img data-testid="avatar-image" src={src} alt={alt} />
  ),
  AvatarFallback: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="avatar-fallback">{children}</div>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, variant, size, className }: {
    children: React.ReactNode,
    variant?: string,
    size?: string,
    className?: string
  }) => (
    <button
      data-testid="button"
      data-variant={variant}
      data-size={size}
      className={className}
    >
      {children}
    </button>
  ),
}));

// Mock the ExternalLink icon
jest.mock('lucide-react', () => ({
  ExternalLink: ({ className }: { className?: string }) => (
    <span data-testid="external-link-icon" className={className}>
      [ExternalLink]
    </span>
  ),
}));

// Mock ContentItem data for testing
const mockContentItem: ContentItem = {
  id: '1',
  type: 'content',
  title: 'Essential Communication Skills for the Workplace',
  creator: {
    name: 'Career Coach Sarah',
    role: 'Communication Specialist',
    avatar: 'https://i.pravatar.cc/150?img=1'
  },
  video: 'https://example.com/video1.mp4',
  description: 'Learn the basics of effective communication that will help you succeed in any job.',
  resources: [
    {
      title: 'Communication Skills PDF Guide',
      url: 'https://example.com/communication-guide.pdf'
    },
    {
      title: 'Practice Exercises',
      url: 'https://example.com/exercises'
    }
  ],
  tags: ['Communication', 'Workplace', 'Soft Skills']
};

describe('ContentDetails Component', () => {
  it('renders without crashing when passed mock data', () => {
    render(<ContentDetails item={mockContentItem} />);
    expect(screen.getByText('Essential Communication Skills for the Workplace')).toBeInTheDocument();
  });

  it('displays creator name and role', () => {
    render(<ContentDetails item={mockContentItem} />);
    expect(screen.getByText('Career Coach Sarah')).toBeInTheDocument();
    expect(screen.getByText('Communication Specialist')).toBeInTheDocument();
  });

  it('displays content title and description', () => {
    render(<ContentDetails item={mockContentItem} />);
    expect(screen.getByText('Essential Communication Skills for the Workplace')).toBeInTheDocument();
    expect(screen.getByText('Learn the basics of effective communication that will help you succeed in any job.')).toBeInTheDocument();
  });

  it('renders all tags', () => {
    render(<ContentDetails item={mockContentItem} />);
    mockContentItem.tags.forEach(tag => {
      expect(screen.getByText(tag)).toBeInTheDocument();
    });
  });

  it('renders all resource links with correct attributes', () => {
    render(<ContentDetails item={mockContentItem} />);

    // Check for Resources heading
    expect(screen.getByText('Resources')).toBeInTheDocument();

    // Check each resource link
    mockContentItem.resources.forEach(resource => {
      const link = screen.getByText(resource.title);
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', resource.url);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  it('renders Save and Share buttons', () => {
    render(<ContentDetails item={mockContentItem} />);
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Share')).toBeInTheDocument();
  });
});
