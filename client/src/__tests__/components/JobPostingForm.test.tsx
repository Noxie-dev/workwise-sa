import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import JobPostingForm from '../../components/JobPostingForm';

// Mock the services
vi.mock('../../services/jobService', () => ({
  fetchCategories: vi.fn().mockResolvedValue([
    { id: 'tech', name: 'Technology' },
    { id: 'finance', name: 'Finance' },
  ]),
  generateAIContent: vi.fn().mockResolvedValue({
    content: 'AI generated content',
  }),
  submitJobPost: vi.fn().mockResolvedValue({
    success: true,
    jobId: 'job123',
    message: 'Job posted successfully',
  }),
}));

// Mock the hooks
vi.mock('../../hooks/useJobFormState', () => {
  return {
    __esModule: true,
    default: vi.fn().mockImplementation((initialState) => {
      const [values, setValues] = React.useState(initialState);
      const [errors, setErrors] = React.useState({});
      const [touched, setTouched] = React.useState({});
      const [isSubmitting, setIsSubmitting] = React.useState(false);
      
      return {
        values,
        errors,
        touched,
        isSubmitting,
        setIsSubmitting,
        handleChange: (field, value) => {
          setValues((prev) => ({ ...prev, [field]: value }));
        },
        handleBlur: (field) => {
          setTouched((prev) => ({ ...prev, [field]: true }));
        },
        validateAll: () => true,
        reset: () => {
          setValues(initialState);
          setErrors({});
          setTouched({});
          setIsSubmitting(false);
        },
        setValues,
        validate: {
          validate: () => true,
        },
      };
    }),
  };
});

vi.mock('../../hooks/useFormAutosave', () => {
  return {
    __esModule: true,
    default: vi.fn().mockImplementation(() => ({
      loadSavedData: vi.fn().mockReturnValue(null),
      clearSavedData: vi.fn(),
    })),
  };
});

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Check: () => <div data-testid="check-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
  Save: () => <div data-testid="save-icon" />,
  Briefcase: () => <div data-testid="briefcase-icon" />,
  Building: () => <div data-testid="building-icon" />,
  Edit3: () => <div data-testid="edit-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  ArrowLeft: () => <div data-testid="arrow-left-icon" />,
  ArrowRight: () => <div data-testid="arrow-right-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  MapPin: () => <div data-testid="map-pin-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  Sparkles: () => <div data-testid="sparkles-icon" />,
  LinkIcon: () => <div data-testid="link-icon" />,
  ImageIcon: () => <div data-testid="image-icon" />,
  X: () => <div data-testid="x-icon" />,
  Phone: () => <div data-testid="phone-icon" />,
}));

// Mock the form step components
vi.mock('../../components/form-steps/JobDetailsStep', () => ({
  __esModule: true,
  default: ({ values, handleChange, handleBlur, errors, touched }) => (
    <div data-testid="job-details-step">
      <input
        data-testid="job-title-input"
        value={values.title || ''}
        onChange={(e) => handleChange('title', e.target.value)}
        onBlur={() => handleBlur('title')}
      />
      {touched.title && errors.title && <div data-testid="title-error">{errors.title}</div>}
    </div>
  ),
}));

vi.mock('../../components/form-steps/JobDescriptionStep', () => ({
  __esModule: true,
  default: ({ values, handleChange }) => (
    <div data-testid="job-description-step">
      <textarea
        data-testid="job-description-input"
        value={values.description || ''}
        onChange={(e) => handleChange('description', e.target.value)}
      />
    </div>
  ),
}));

vi.mock('../../components/form-steps/CompanyInfoStep', () => ({
  __esModule: true,
  default: ({ values, handleChange }) => (
    <div data-testid="company-info-step">
      <input
        data-testid="company-name-input"
        value={values.companyName || ''}
        onChange={(e) => handleChange('companyName', e.target.value)}
      />
    </div>
  ),
}));

vi.mock('../../components/form-steps/ReviewStep', () => ({
  __esModule: true,
  default: ({ values, onEditStep }) => (
    <div data-testid="review-step">
      <div data-testid="review-title">{values.title}</div>
      <div data-testid="review-company">{values.companyName}</div>
      <button data-testid="edit-details-btn" onClick={() => onEditStep(0)}>
        Edit Details
      </button>
    </div>
  ),
}));

describe('JobPostingForm', () => {
  let queryClient: QueryClient;
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    
    vi.clearAllMocks();
  });
  
  const renderWithQueryClient = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    );
  };
  
  it('renders the first step initially', () => {
    renderWithQueryClient(<JobPostingForm />);
    
    expect(screen.getByTestId('job-details-step')).toBeInTheDocument();
    expect(screen.queryByTestId('job-description-step')).not.toBeInTheDocument();
  });
  
  it('navigates to the next step when clicking next button', async () => {
    renderWithQueryClient(<JobPostingForm />);
    
    // Fill in required field in first step
    fireEvent.change(screen.getByTestId('job-title-input'), {
      target: { value: 'Software Developer' },
    });
    
    // Click next button
    fireEvent.click(screen.getByText('Next'));
    
    // Should show the second step
    await waitFor(() => {
      expect(screen.getByTestId('job-description-step')).toBeInTheDocument();
    });
  });
  
  it('navigates to the previous step when clicking back button', async () => {
    renderWithQueryClient(<JobPostingForm />);
    
    // Go to second step
    fireEvent.change(screen.getByTestId('job-title-input'), {
      target: { value: 'Software Developer' },
    });
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByTestId('job-description-step')).toBeInTheDocument();
    });
    
    // Go back to first step
    fireEvent.click(screen.getByText('Back'));
    
    await waitFor(() => {
      expect(screen.getByTestId('job-details-step')).toBeInTheDocument();
    });
  });
  
  // Add more tests for form submission, validation, etc.
});
