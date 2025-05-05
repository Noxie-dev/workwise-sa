// src/components/marketing-rules/MarketingRuleDemo.tsx
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

const MarketingRuleDemo: React.FC = () => {
  const queryClient = useQueryClient();

  // Fetch marketing rules
  const { 
    data: rules = [], 
    isLoading: isLoadingRules,
    error: rulesError
  } = useQuery({
    queryKey: ['marketingRules'],
    queryFn: fetchMarketingRules
  });

  // Fetch marketing rule stats
  const { 
    data: stats, 
    isLoading: isLoadingStats 
  } = useQuery({
    queryKey: ['marketingRuleStats'],
    queryFn: fetchMarketingRuleStats
  });

  // Fetch marketing rule analytics
  const { 
    data: analytics, 
    isLoading: isLoadingAnalytics 
  } = useQuery({
    queryKey: ['marketingRuleAnalytics'],
    queryFn: () => fetchMarketingRuleAnalytics('Last 7 Days')
  });

  // Fetch job example
  const { 
    data: jobExample, 
    isLoading: isLoadingJobExample 
  } = useQuery({
    queryKey: ['jobExample'],
    queryFn: () => fetchOriginalJobExample()
  });

  // Create rule mutation
  const createRuleMutation = useMutation({
    mutationFn: saveMarketingRule,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['marketingRules'] });
      queryClient.invalidateQueries({ queryKey: ['marketingRuleStats'] });
    }
  });

  // Delete rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: deleteMarketingRule,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['marketingRules'] });
      queryClient.invalidateQueries({ queryKey: ['marketingRuleStats'] });
    }
  });

  // Handle create rule
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

  // Handle delete rule
  const handleDeleteRule = (ruleId: string) => {
    deleteRuleMutation.mutate(ruleId);
  };

  // Check if loading
  const isLoading = isLoadingRules || isLoadingStats || isLoadingAnalytics || isLoadingJobExample;
  
  if (isLoading) {
    return <div>Loading marketing rule data...</div>;
  }

  if (rulesError) {
    return <div className="error">Error loading marketing rules</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Marketing Rules Demo</h1>
      
      {/* Marketing Rules */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Marketing Rules</h2>
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={handleCreateRule}
            disabled={createRuleMutation.isPending}
          >
            {createRuleMutation.isPending ? 'Creating...' : 'Create New Rule'}
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b text-left">Rule Name</th>
                <th className="py-2 px-4 border-b text-left">Target Location</th>
                <th className="py-2 px-4 border-b text-left">Target Job Type</th>
                <th className="py-2 px-4 border-b text-left">Message</th>
                <th className="py-2 px-4 border-b text-left">Status</th>
                <th className="py-2 px-4 border-b text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule: MarketingRule) => (
                <tr key={rule.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{rule.ruleName}</td>
                  <td className="py-2 px-4 border-b">{rule.targetLocation}</td>
                  <td className="py-2 px-4 border-b">{rule.targetJobType}</td>
                  <td className="py-2 px-4 border-b max-w-xs truncate">{rule.messageTemplate}</td>
                  <td className="py-2 px-4 border-b">
                    <span className={`px-2 py-1 rounded text-xs ${
                      rule.status === 'Active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {rule.status}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b">
                    <button 
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                      onClick={() => handleDeleteRule(rule.id)}
                      disabled={deleteRuleMutation.isPending && deleteRuleMutation.variables === rule.id}
                    >
                      {deleteRuleMutation.isPending && deleteRuleMutation.variables === rule.id 
                        ? 'Deleting...' 
                        : 'Delete'
                      }
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Stats and Analytics */}
      {stats && analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Stats */}
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">Marketing Rule Stats</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded">
                <p className="text-sm text-blue-600">Active Rules</p>
                <p className="text-2xl font-bold">{stats.activeRules}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm text-gray-600">Inactive Rules</p>
                <p className="text-2xl font-bold">{stats.inactiveRules}</p>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <p className="text-sm text-green-600">Jobs Processed</p>
                <p className="text-2xl font-bold">{stats.jobsProcessed.toLocaleString()}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded">
                <p className="text-sm text-purple-600">CTA Click Rate</p>
                <p className="text-2xl font-bold">{stats.ctaClickRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
          
          {/* Analytics */}
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">Marketing Rule Analytics</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Views</p>
                  <p className="text-xl font-bold">{analytics.totalViews.toLocaleString()}</p>
                </div>
                <div className={`flex items-center ${analytics.viewsChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analytics.viewsChangePercent >= 0 ? '↑' : '↓'} {Math.abs(analytics.viewsChangePercent).toFixed(1)}%
                </div>
              </div>
              
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Clicks</p>
                  <p className="text-xl font-bold">{analytics.totalClicks.toLocaleString()}</p>
                </div>
                <div className={`flex items-center ${analytics.clicksChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analytics.clicksChangePercent >= 0 ? '↑' : '↓'} {Math.abs(analytics.clicksChangePercent).toFixed(1)}%
                </div>
              </div>
              
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-600">Click-Through Rate</p>
                  <p className="text-xl font-bold">{analytics.clickThroughRate.toFixed(1)}%</p>
                </div>
                <div className={`flex items-center ${analytics.ctrChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analytics.ctrChangePercent >= 0 ? '↑' : '↓'} {Math.abs(analytics.ctrChangePercent).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Job Example */}
      {jobExample && (
        <div className="bg-white p-6 rounded shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Job Listing Example</h2>
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="text-lg font-bold">{jobExample.title}</h3>
            <p className="text-sm text-gray-600 mb-2">{jobExample.company} • {jobExample.location}</p>
            <p className="mb-4">{jobExample.description}</p>
            
            {jobExample.contactInfo && (
              <div className="bg-gray-50 p-4 rounded text-sm">
                <h4 className="font-semibold mb-2">Contact Information</h4>
                {jobExample.contactInfo.email && <p><span className="font-medium">Email:</span> {jobExample.contactInfo.email}</p>}
                {jobExample.contactInfo.phone && <p><span className="font-medium">Phone:</span> {jobExample.contactInfo.phone}</p>}
                {jobExample.contactInfo.applyInstructions && (
                  <p><span className="font-medium">Apply Instructions:</span> {jobExample.contactInfo.applyInstructions}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketingRuleDemo;
