import { renderHook } from '@testing-library/react';
import { useFAQWheel } from './useFAQWheel';

// Mock the faqService
jest.mock('@/services/faqService', () => ({
  faqService: {
    getFAQs: jest.fn().mockResolvedValue([
      { id: '1', question: 'Question 1', answer: 'Answer 1', category: 'job-seekers' },
      { id: '2', question: 'Question 2', answer: 'Answer 2', category: 'employers' },
      { id: '3', question: 'Question 3', answer: 'Answer 3', category: 'general' }
    ])
  },
  FAQItem: {}
}));

// Mock React Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn().mockReturnValue({
    data: [
      { id: '1', question: 'Question 1', answer: 'Answer 1', category: 'job-seekers' },
      { id: '2', question: 'Question 2', answer: 'Answer 2', category: 'employers' },
      { id: '3', question: 'Question 3', answer: 'Answer 3', category: 'general' }
    ],
    isLoading: false,
    error: null
  })
}));

// Mock useIsMobile
jest.mock('./use-mobile', () => ({
  useIsMobile: jest.fn().mockReturnValue(false)
}));

describe('useFAQWheel', () => {
  // Mock requestAnimationFrame
  beforeEach(() => {
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
      callback(0);
      return 0;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return the expected properties', () => {
    const { result } = renderHook(() => useFAQWheel());

    // Check that all expected properties are returned
    expect(result.current).toHaveProperty('rotation');
    expect(result.current).toHaveProperty('selectedQuestion');
    expect(result.current).toHaveProperty('isModalOpen');
    expect(result.current).toHaveProperty('isAutoRotating');
    expect(result.current).toHaveProperty('focusedIndex');
    expect(result.current).toHaveProperty('isAnimating');
    expect(result.current).toHaveProperty('faqItems');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('setFocusedIndex');
    expect(result.current).toHaveProperty('handleRotate');
    expect(result.current).toHaveProperty('handleQuestionClick');
    expect(result.current).toHaveProperty('closeModal');
    expect(result.current).toHaveProperty('toggleAutoRotation');
    expect(result.current).toHaveProperty('getItemPosition');
    expect(result.current).toHaveProperty('handleTouchStart');
    expect(result.current).toHaveProperty('handleTouchEnd');
    expect(result.current).toHaveProperty('isMobile');
  });
});
