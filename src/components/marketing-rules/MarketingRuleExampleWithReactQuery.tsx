// src/components/marketing-rules/MarketingRuleExampleWithReactQuery.tsx
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchMarketingRules, 
  fetchMarketingRuleStats, 
  fetchMarketingRuleAnalytics,
  saveMarketingRule,
  deleteMarketingRule,
  fetchOriginalJobExample
} from '@/services/marketingRuleService';
import { MarketingRule } from '@/types/marketing-rules';

const MarketingRuleExampleWithReactQuery: React.FC = () => {
  const queryClient = useQueryClient();

  // Queries
  const { 
    data: rules = [], 
    isLoading: isLoadingRules,
    error: rulesError
  } = useQuery({
    queryKey: ['marketingRules'],
    queryFn: fetchMarketingRules
  });

  const { 
    data: stats, 
    isLoading: isLoadingStats 
  } = useQuery({
    queryKey: ['marketingRuleStats'],
    queryFn: fetchMarketingRuleStats
  });

  const { 
    data: analytics, 
    isLoading: isLoadingAnalytics 
  } = useQuery({
    queryKey: ['marketingRuleAnalytics'],
    queryFn: () => fetchMarketingRuleAnalytics('Last 7 Days')
  });

  const { 
    data: jobExample, 
    isLoading: isLoadingJobExample 
  } = useQuery({
    queryKey: ['jobExample'],
    queryFn: () => fetchOriginalJobExample()
  });

  // Mutations
  const createRuleMutation = useMutation({
    mutationFn: saveMarketingRule,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['marketingRules'] });
      queryClient.invalidateQueries({ queryKey: ['marketingRuleStats'] });
    }
  });

  const deleteRuleMutation = useMutation({
    mutationFn: deleteMarketingRule,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['marketingRules'] });
      queryClient.invalidateQueries({ queryKey: ['marketingRuleStats'] });
    }
  });

  const handleCreateRule = () => {
    const newRule = {
      ruleName: 'New Test Rule',
      targetLocation: 'Durban',
      targetJobType: 'Hospitality',
      messageTemplate: 'Check out these exclusive hospitality jobs in Durban!',
      ctaLink: 'https://www.workwisesa.co.za/durban-hospitality',
      status: 'Active' as const
    };

    createRuleMutation.mutate(newRule);
  };

  const handleDeleteRule = (ruleId: string) => {
    deleteRuleMutation.mutate(ruleId);
  };

  const isLoading = isLoadingRules || isLoadingStats || isLoadingAnalytics || isLoadingJobExample;
  
  if (isLoading) {
    return <div>Loading marketing rule data...</div>;
  }

  if (rulesError) {
    return <div className="error">Error loading marketing rules</div>;
  }

  return (
    <div className="marketing-rule-example">
      <h1>Marketing Rules Example (with React Query)</h1>
      
      <section>
        <h2>Marketing Rules</h2>
        <button 
          onClick={handleCreateRule}
          disabled={createRuleMutation.isPending}
        >
          {createRuleMutation.isPending ? 'Creating...' : 'Create New Rule'}
        </button>
        <ul>
          {rules.map((rule: MarketingRule) => (
            <li key={rule.id}>
              <h3>{rule.ruleName}</h3>
              <p>Target: {rule.targetLocation} - {rule.targetJobType}</p>
              <p>Message: {rule.messageTemplate}</p>
              <p>Status: {rule.status}</p>
              <button 
                onClick={() => handleDeleteRule(rule.id)}
                disabled={deleteRuleMutation.isPending}
              >
                {deleteRuleMutation.isPending && deleteRuleMutation.variables === rule.id 
                  ? 'Deleting...' 
                  : 'Delete'
                }
              </button>
            </li>
          ))}
        </ul>
      </section>

      {stats && (
        <section>
          <h2>Marketing Rule Stats</h2>
          <p>Active Rules: {stats.activeRules}</p>
          <p>Inactive Rules: {stats.inactiveRules}</p>
          <p>Jobs Processed: {stats.jobsProcessed}</p>
          <p>CTA Click Rate: {stats.ctaClickRate.toFixed(1)}%</p>
        </section>
      )}

      {analytics && (
        <section>
          <h2>Marketing Rule Analytics</h2>
          <p>Total Views: {analytics.totalViews.toLocaleString()}</p>
          <p>Total Clicks: {analytics.totalClicks.toLocaleString()}</p>
          <p>Click-Through Rate: {analytics.clickThroughRate.toFixed(1)}%</p>
          
          <h3>Performance by Rule</h3>
          <ul>
            {analytics.performanceByRule.map((item, index) => (
              <li key={index}>
                {item.name}: {item.clicks.toLocaleString()} clicks
              </li>
            ))}
          </ul>
        </section>
      )}

      {jobExample && (
        <section>
          <h2>Job Listing Example</h2>
          <h3>{jobExample.title}</h3>
          <p><strong>Company:</strong> {jobExample.company}</p>
          <p><strong>Location:</strong> {jobExample.location}</p>
          <p><strong>Job Type:</strong> {jobExample.jobType}</p>
          <p>{jobExample.description}</p>
          
          {jobExample.contactInfo && (
            <div>
              <h4>Contact Information</h4>
              {jobExample.contactInfo.email && <p><strong>Email:</strong> {jobExample.contactInfo.email}</p>}
              {jobExample.contactInfo.phone && <p><strong>Phone:</strong> {jobExample.contactInfo.phone}</p>}
              {jobExample.contactInfo.applyInstructions && (
                <p><strong>Apply Instructions:</strong> {jobExample.contactInfo.applyInstructions}</p>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default MarketingRuleExampleWithReactQuery;
