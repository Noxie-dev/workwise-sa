import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LeftPanel from './LeftPanel';
import { ContentItem, AdItem } from '../types';

// Mock the ContentDetails and AdDetails components
jest.mock('./ContentDetails', () => ({
  __esModule: true,
  default: ({ item }: { item: ContentItem }) => (
    <div data-testid="content-details">
      <span>Content: {item.title}</span>
    </div>
  ),
}));

jest.mock('./AdDetails', () => ({
  __esModule: true,
  default: ({ item }: { item: AdItem }) => (
    <div data-testid="ad-details">
      <span>Ad: {item.title}</span>
    </div>
  ),
}));

// Mock data for testing
const mockContentItem: ContentItem = {
  id: '1',
  type: 'content',
  title: 'Test Content Title',
  creator: {
    name: 'Test Creator',
    role: 'Test Role',
    avatar: 'test-avatar.jpg'
  },
  video: 'test-video.mp4',
  description: 'Test description',
  resources: [],
  tags: ['test', 'content']
};

const mockAdItem: AdItem = {
  id: 'ad1',
  type: 'ad',
  advertiser: 'Test Advertiser',
  title: 'Test Ad Title',
  video: 'test-ad-video.mp4',
  description: 'Test ad description',
  cta: {
    primary: {
      text: 'Primary CTA',
      url: 'https://example.com/primary'
    },
    secondary: {
      text: 'Secondary CTA',
      url: 'https://example.com/secondary'
    }
  },
  notes: 'Test notes'
};

describe('LeftPanel Component', () => {
  it('renders loading state when currentItem is null', () => {
    render(<LeftPanel currentItem={null} />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByTestId('content-details')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ad-details')).not.toBeInTheDocument();
  });

  it('renders ContentDetails when passed a ContentItem', () => {
    render(<LeftPanel currentItem={mockContentItem} />);
    
    expect(screen.getByTestId('content-details')).toBeInTheDocument();
    expect(screen.getByText(`Content: ${mockContentItem.title}`)).toBeInTheDocument();
    expect(screen.queryByTestId('ad-details')).not.toBeInTheDocument();
  });

  it('renders AdDetails when passed an AdItem', () => {
    render(<LeftPanel currentItem={mockAdItem} />);
    
    expect(screen.getByTestId('ad-details')).toBeInTheDocument();
    expect(screen.getByText(`Ad: ${mockAdItem.title}`)).toBeInTheDocument();
    expect(screen.queryByTestId('content-details')).not.toBeInTheDocument();
  });

  it('sets the correct aria-label based on item type', () => {
    // Test with content item
    const { rerender } = render(<LeftPanel currentItem={mockContentItem} />);
    expect(screen.getByRole('complementary')).toHaveAttribute('aria-label', 'Content Details');
    
    // Test with ad item
    rerender(<LeftPanel currentItem={mockAdItem} />);
    expect(screen.getByRole('complementary')).toHaveAttribute('aria-label', 'Advertisement Details');
    
    // Test with null
    rerender(<LeftPanel currentItem={null} />);
    expect(screen.getByRole('complementary')).toHaveAttribute('aria-label', 'Content loading');
  });
});
