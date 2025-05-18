import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FAQWheelPreview from './FAQWheelPreview';

// Mock the useFAQWheel hook
jest.mock('../hooks/useFAQWheel', () => ({
  useFAQWheel: () => ({
    rotation: 0,
    selectedQuestion: null,
    isModalOpen: false,
    isAutoRotating: false,
    focusedIndex: -1,
    isAnimating: false,
    faqItems: [
      { id: '1', question: 'How do I create a profile?', answer: 'Answer 1', category: 'job-seekers' },
      { id: '2', question: 'What jobs are available?', answer: 'Answer 2', category: 'employers' },
      { id: '3', question: 'Do I need qualifications?', answer: 'Answer 3', category: 'general' }
    ],
    isLoading: false,
    error: null,
    setFocusedIndex: jest.fn(),
    handleRotate: jest.fn(),
    handleQuestionClick: jest.fn(),
    closeModal: jest.fn(),
    toggleAutoRotation: jest.fn(),
    getItemPosition: jest.fn().mockImplementation((index) => ({
      x: '50%',
      y: '50%',
      rotation: index * 30
    })),
    handleTouchStart: jest.fn(),
    handleTouchEnd: jest.fn(),
    isMobile: false
  }),
  ItemPosition: {}
}));

// Mock the lazy loaded component to avoid test issues
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    lazy: () => {
      const MockComponent = (props: any) => {
        return originalReact.createElement('div', {
          'data-testid': 'lazy-loaded-modal',
          ...props
        });
      };
      return MockComponent;
    }
  };
});

describe('FAQWheelPreview Component', () => {
  beforeEach(() => {
    // Mock the requestAnimationFrame
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 0;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the FAQ wheel with items', () => {
    render(<FAQWheelPreview />);

    // Check for the FAQ title
    expect(screen.getByText('Workwise SA FAQ')).toBeInTheDocument();

    // Check for FAQ items
    expect(screen.getByText('How do I create a profile?')).toBeInTheDocument();
    expect(screen.getByText('What jobs are available?')).toBeInTheDocument();
    expect(screen.getByText('Do I need qualifications?')).toBeInTheDocument();
  });

  it('renders rotation controls', () => {
    render(<FAQWheelPreview />);

    // Check for rotation controls
    expect(screen.getByLabelText('Rotate Left')).toBeInTheDocument();
    expect(screen.getByLabelText('Rotate Right')).toBeInTheDocument();
    expect(screen.getByLabelText('Start Auto-Rotation')).toBeInTheDocument();
  });
});
