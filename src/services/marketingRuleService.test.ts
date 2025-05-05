// src/services/marketingRuleService.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  fetchMarketingRules,
  fetchMarketingRuleStats,
  fetchMarketingRuleAnalytics,
  saveMarketingRule,
  deleteMarketingRule,
  fetchOriginalJobExample
} from './marketingRuleService';

describe('Marketing Rule Service', () => {
  // Mock console.log to avoid cluttering test output
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetchMarketingRules returns an array of marketing rules', async () => {
    const rules = await fetchMarketingRules();
    expect(Array.isArray(rules)).toBe(true);
    expect(rules.length).toBeGreaterThan(0);
    expect(rules[0]).toHaveProperty('id');
    expect(rules[0]).toHaveProperty('ruleName');
    expect(rules[0]).toHaveProperty('targetLocation');
    expect(rules[0]).toHaveProperty('targetJobType');
    expect(rules[0]).toHaveProperty('status');
  });

  it('fetchMarketingRuleStats returns stats object', async () => {
    const stats = await fetchMarketingRuleStats();
    expect(stats).toHaveProperty('activeRules');
    expect(stats).toHaveProperty('inactiveRules');
    expect(stats).toHaveProperty('jobsProcessed');
    expect(stats).toHaveProperty('ctaClickRate');
  });

  it('fetchMarketingRuleAnalytics returns analytics data', async () => {
    const analytics = await fetchMarketingRuleAnalytics();
    expect(analytics).toHaveProperty('totalViews');
    expect(analytics).toHaveProperty('totalClicks');
    expect(analytics).toHaveProperty('clickThroughRate');
    expect(analytics).toHaveProperty('performanceByRule');
    expect(Array.isArray(analytics.performanceByRule)).toBe(true);
  });

  it('saveMarketingRule creates a new rule when no ID is provided', async () => {
    const newRule = {
      ruleName: 'Test Rule',
      targetLocation: 'Test Location',
      targetJobType: 'Test Job Type',
      messageTemplate: 'Test message template',
      ctaLink: 'https://www.workwisesa.co.za/test',
      status: 'Active' as const,
    };

    const savedRule = await saveMarketingRule(newRule);
    expect(savedRule).toHaveProperty('id');
    expect(savedRule.ruleName).toBe(newRule.ruleName);
    expect(savedRule.ctaPreview).toBe(`"${newRule.messageTemplate}"`);
  });

  it('saveMarketingRule updates an existing rule when ID is provided', async () => {
    // First get all rules
    const rules = await fetchMarketingRules();
    const existingRule = rules[0];

    // Update the first rule
    const updatedData = {
      ...existingRule,
      ruleName: 'Updated Rule Name',
      messageTemplate: 'Updated message template',
    };

    const updatedRule = await saveMarketingRule(updatedData);
    expect(updatedRule.id).toBe(existingRule.id);
    expect(updatedRule.ruleName).toBe('Updated Rule Name');
    expect(updatedRule.ctaPreview).toBe(`"Updated message template"`);
  });

  it('deleteMarketingRule removes a rule', async () => {
    // First get all rules
    const rules = await fetchMarketingRules();
    const initialCount = rules.length;
    const ruleToDelete = rules[0];

    // Delete the first rule
    await deleteMarketingRule(ruleToDelete.id);

    // Verify it was deleted
    const updatedRules = await fetchMarketingRules();
    expect(updatedRules.length).toBe(initialCount - 1);
    expect(updatedRules.find(r => r.id === ruleToDelete.id)).toBeUndefined();
  });

  it('fetchOriginalJobExample returns a job example', async () => {
    const jobExample = await fetchOriginalJobExample();
    expect(jobExample).toHaveProperty('title');
    expect(jobExample).toHaveProperty('company');
    expect(jobExample).toHaveProperty('location');
    expect(jobExample).toHaveProperty('jobType');
    expect(jobExample).toHaveProperty('description');
  });
});
