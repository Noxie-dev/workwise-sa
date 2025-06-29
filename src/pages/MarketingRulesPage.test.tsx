// src/pages/MarketingRulesPage.test.tsx
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MarketingRulesPage from './MarketingRulesPage';
import { fetchMarketingRules, saveMarketingRule, deleteMarketingRule } from '@/services/marketingRuleService';

// Mock the services
jest.mock('@/services/marketingRuleService', () => ({
  fetchMarketingRules: jest.fn(),
  fetchMarketingRuleStats: jest.fn(),
  fetchMarketingRuleAnalytics: jest.fn(),
  fetchOriginalJobExample: jest.fn(),
  saveMarketingRule: jest.fn(),
  deleteMarketingRule: jest.fn(),
}));

// Mock the toast
jest.mock('@/components/ui/use-toast', () => ({
  toast: jest.fn(),
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock sub-components
jest.mock('@/components/marketing-rules/JobDistributionWorkflow', () => ({
  JobDistributionWorkflow: () => <div data-testid="job-distribution-workflow">Job Distribution Workflow</div>,
}));

jest.mock('@/components/marketing-rules/MarketingRulesList', () => ({
  MarketingRulesList: ({ rules, onEdit, onDelete }) => (
    <div data-testid="marketing-rules-list">
      {rules.map((rule) => (
        <div key={rule.id} data-testid={`rule-${rule.id}`}>
          <span>{rule.ruleName}</span>
          <button onClick={() => onEdit(rule)}>Edit</button>
          <button onClick={() => onDelete(rule.id)}>Delete</button>
        </div>
      ))}
    </div>
  ),
}));

jest.mock('@/components/marketing-rules/EditMarketingRuleForm', () => ({
  EditMarketingRuleForm: ({ initialData, onSave, onCancel }) => (
    <div data-testid="edit-marketing-rule-form">
      <span>Editing: {initialData?.ruleName || 'New Rule'}</span>
      <button onClick={() => onSave({ ruleName: 'Test Rule', targetLocation: 'Test Location', targetJobType: 'Test Type', messageTemplate: 'Test Message', ctaLink: 'https://example.com', status: 'Active' })}>Save</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

jest.mock('@/components/marketing-rules/MarketingRulePreview', () => ({
  MarketingRulePreview: ({ ruleBeingEdited }) => (
    <div data-testid="marketing-rule-preview">
      {ruleBeingEdited ? `Preview for ${ruleBeingEdited.ruleName}` : 'No rule selected'}
    </div>
  ),
}));

jest.mock('@/components/marketing-rules/MarketingRulePerformanceAnalytics', () => ({
  MarketingRulePerformanceAnalytics: ({ data }) => (
    <div data-testid="marketing-rule-performance-analytics">
      Analytics data: {data.totalViews} views
    </div>
  ),
}));

// Mock window.confirm
window.confirm = jest.fn();

describe('MarketingRulesPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Reset mocks
    jest.clearAllMocks();

    // Mock service responses
    (fetchMarketingRules as jest.Mock).mockResolvedValue([
      { id: '1', ruleName: 'Test Rule 1', targetLocation: 'Location 1', targetJobType: 'Type 1', messageTemplate: 'Message 1', ctaLink: 'https://example.com/1', ctaPreview: 'Preview 1', status: 'Active', createdAt: 'today' },
      { id: '2', ruleName: 'Test Rule 2', targetLocation: 'Location 2', targetJobType: 'Type 2', messageTemplate: 'Message 2', ctaLink: 'https://example.com/2', ctaPreview: 'Preview 2', status: 'Inactive', createdAt: 'yesterday' },
    ]);

    (fetchMarketingRuleStats as jest.Mock).mockResolvedValue({
      activeRules: 1,
      inactiveRules: 1,
      jobsProcessed: 100,
      ctaClickRate: 25.5,
    });

    (fetchMarketingRuleAnalytics as jest.Mock).mockResolvedValue({
      totalViews: 1000,
      viewsChangePercent: 10,
      totalClicks: 250,
      clicksChangePercent: 15,
      clickThroughRate: 25,
      ctrChangePercent: 5,
      performanceByRule: [
        { name: 'Test Rule 1', clicks: 150 },
        { name: 'Test Rule 2', clicks: 100 },
      ],
    });

    (fetchOriginalJobExample as jest.Mock).mockResolvedValue({
      title: 'Test Job',
      company: 'Test Company',
      location: 'Test Location',
      jobType: 'Test Type',
      description: 'Test Description',
    });

    (saveMarketingRule as jest.Mock).mockImplementation((rule) => 
      Promise.resolve({ ...rule, id: rule.id || '3', createdAt: 'now', ctaPreview: `"${rule.messageTemplate}"` })
    );

    (deleteMarketingRule as jest.Mock).mockResolvedValue(undefined);

    (window.confirm as jest.Mock).mockReturnValue(true);
  });

  it('renders the marketing rules page with all components', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MarketingRulesPage />
      </QueryClientProvider>
    );

    // Check page title
    expect(screen.getByText('Marketing Rules Manager')).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId('job-distribution-workflow')).toBeInTheDocument();
      expect(screen.getByTestId('marketing-rules-list')).toBeInTheDocument();
      expect(screen.getByTestId('marketing-rule-performance-analytics')).toBeInTheDocument();
    });

    // Check if rules are rendered
    expect(screen.getByText('Test Rule 1')).toBeInTheDocument();
    expect(screen.getByText('Test Rule 2')).toBeInTheDocument();
  });

  it('allows editing a rule', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MarketingRulesPage />
      </QueryClientProvider>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId('marketing-rules-list')).toBeInTheDocument();
    });

    // Click edit button on the first rule
    fireEvent.click(screen.getAllByText('Edit')[0]);

    // Check if edit form is shown
    await waitFor(() => {
      expect(screen.getByTestId('edit-marketing-rule-form')).toBeInTheDocument();
      expect(screen.getByText('Editing: Test Rule 1')).toBeInTheDocument();
    });

    // Save the edited rule
    fireEvent.click(screen.getByText('Save'));

    // Check if saveMarketingRule was called
    await waitFor(() => {
      expect(saveMarketingRule).toHaveBeenCalled();
    });
  });

  it('allows creating a new rule', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MarketingRulesPage />
      </QueryClientProvider>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId('marketing-rules-list')).toBeInTheDocument();
    });

    // Click create new rule button
    fireEvent.click(screen.getByText('Create New Rule'));

    // Check if edit form is shown
    await waitFor(() => {
      expect(screen.getByTestId('edit-marketing-rule-form')).toBeInTheDocument();
      expect(screen.getByText('Editing: New Rule')).toBeInTheDocument();
    });

    // Save the new rule
    fireEvent.click(screen.getByText('Save'));

    // Check if saveMarketingRule was called
    await waitFor(() => {
      expect(saveMarketingRule).toHaveBeenCalled();
    });
  });

  it('allows deleting a rule', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MarketingRulesPage />
      </QueryClientProvider>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId('marketing-rules-list')).toBeInTheDocument();
    });

    // Click delete button on the first rule
    fireEvent.click(screen.getAllByText('Delete')[0]);

    // Check if confirmation was shown
    expect(window.confirm).toHaveBeenCalled();

    // Check if deleteMarketingRule was called
    await waitFor(() => {
      expect(deleteMarketingRule).toHaveBeenCalledWith('1');
    });
  });
});
