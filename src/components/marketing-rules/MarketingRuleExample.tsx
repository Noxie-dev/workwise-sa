// src/components/marketing-rules/MarketingRuleExample.tsx
import React, { useEffect, useState } from 'react';
import { 
  fetchMarketingRules, 
  fetchMarketingRuleStats, 
  fetchMarketingRuleAnalytics,
  saveMarketingRule,
  deleteMarketingRule,
  fetchOriginalJobExample
} from '@/services/marketingRuleService';
import { MarketingRule, MarketingRuleStats, MarketingRuleAnalyticsData, JobListingExample } from '@/types/marketing-rules';

const MarketingRuleExample: React.FC = () => {
  const [rules, setRules] = useState<MarketingRule[]>([]);
  const [stats, setStats] = useState<MarketingRuleStats | null>(null);
  const [analytics, setAnalytics] = useState<MarketingRuleAnalyticsData | null>(null);
  const [jobExample, setJobExample] = useState<JobListingExample | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [rulesData, statsData, analyticsData, jobExampleData] = await Promise.all([
          fetchMarketingRules(),
          fetchMarketingRuleStats(),
          fetchMarketingRuleAnalytics(),
          fetchOriginalJobExample()
        ]);
        
        setRules(rulesData);
        setStats(statsData);
        setAnalytics(analyticsData);
        setJobExample(jobExampleData);
        setError(null);
      } catch (err) {
        setError('Failed to load marketing rule data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCreateRule = async () => {
    try {
      const newRule = {
        ruleName: 'New Test Rule',
        targetLocation: 'Durban',
        targetJobType: 'Hospitality',
        messageTemplate: 'Check out these exclusive hospitality jobs in Durban!',
        ctaLink: 'https://www.workwisesa.co.za/durban-hospitality',
        status: 'Active' as const
      };

      const savedRule = await saveMarketingRule(newRule);
      setRules(prevRules => [...prevRules, savedRule]);
    } catch (err) {
      setError('Failed to create rule');
      console.error(err);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await deleteMarketingRule(ruleId);
      setRules(prevRules => prevRules.filter(rule => rule.id !== ruleId));
    } catch (err) {
      setError('Failed to delete rule');
      console.error(err);
    }
  };

  if (loading) {
    return <div>Loading marketing rule data...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="marketing-rule-example">
      <h1>Marketing Rules Example</h1>
      
      <section>
        <h2>Marketing Rules</h2>
        <button onClick={handleCreateRule}>Create New Rule</button>
        <ul>
          {rules.map(rule => (
            <li key={rule.id}>
              <h3>{rule.ruleName}</h3>
              <p>Target: {rule.targetLocation} - {rule.targetJobType}</p>
              <p>Message: {rule.messageTemplate}</p>
              <p>Status: {rule.status}</p>
              <button onClick={() => handleDeleteRule(rule.id)}>Delete</button>
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

export default MarketingRuleExample;
