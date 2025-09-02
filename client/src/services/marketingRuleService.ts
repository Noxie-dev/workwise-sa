import axios from 'axios';
import { z } from 'zod';
import { MarketingRule, MarketingRuleStats, MarketingRuleAnalyticsData } from '@/types/marketing-rules';

// Define the schema for marketing rules validation
export const MarketingRuleSchema = z.object({
  id: z.string().optional(),
  ruleName: z.string().min(3, {
      error: "Rule name must be at least 3 characters"
}),
  status: z.enum(["Active", "Inactive"]),
  targetLocation: z.string(),
  targetJobType: z.string(),
  targetDemographics: z.string().optional(),
  demographicTags: z.array(z.string()).optional(),
  ctaPreview: z.string().optional(),
  messageTemplate: z.string().min(5, {
      error: "Message template must be at least 5 characters"
}),
  ctaLink: z.url({
        error: "Must be a valid URL"
  }),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// Define the analytics data schema for API responses
export const RuleAnalyticsSchema = z.object({
  ruleId: z.string(),
  views: z.number(),
  clicks: z.number(),
  clickThroughRate: z.number(),
  trend: z.number(), // percentage change from previous period
});

export type RuleAnalytics = z.infer<typeof RuleAnalyticsSchema>;

// Mock data for development - replace with actual API calls
const MOCK_RULES: MarketingRule[] = [
  {
    id: "1",
    ruleName: "Gauteng Jobs",
    status: "Active",
    targetLocation: "Gauteng",
    targetJobType: "All",
    ctaPreview: "Apply on WorkwiseSA for exclusive access!",
    messageTemplate: "Apply on WorkwiseSA for exclusive access!",
    ctaLink: "https://www.workwisesa.co.za/jobs/gauteng",
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
  },
  {
    id: "2",
    ruleName: "Security Jobs",
    status: "Active",
    targetLocation: "All",
    targetJobType: "Security",
    ctaPreview: "Click to view security clearance requirements",
    messageTemplate: "Click to view security clearance requirements",
    ctaLink: "https://www.workwisesa.co.za/jobs/security",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
  },
  {
    id: "3",
    ruleName: "Retail Summer Campaign",
    status: "Active",
    targetLocation: "Cape Town",
    targetJobType: "Retail",
    ctaPreview: "Summer retail positions - Apply now!",
    messageTemplate: "Summer retail positions - Apply now!",
    ctaLink: "https://www.workwisesa.co.za/jobs/retail-summer",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
  },
  {
    id: "4",
    ruleName: "Entry-level Tech Jobs",
    status: "Inactive",
    targetLocation: "All",
    targetJobType: "IT/Technology",
    targetDemographics: "Entry-level, No experience, Graduate, Junior",
    demographicTags: ["Entry-level", "No experience", "Graduate", "Junior"],
    ctaPreview: "No experience? No problem! Click to learn more",
    messageTemplate: "No experience? No problem! Click to learn more",
    ctaLink: "https://www.workwisesa.co.za/tech-careers",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  },
];

// Mock analytics data
const MOCK_ANALYTICS: RuleAnalytics[] = [
  { ruleId: "1", views: 1500, clicks: 320, clickThroughRate: 21.3, trend: 5.2 },
  { ruleId: "2", views: 1200, clicks: 280, clickThroughRate: 23.3, trend: 2.1 },
  { ruleId: "3", views: 950, clicks: 245, clickThroughRate: 25.8, trend: 8.7 },
  { ruleId: "4", views: 1071, clicks: 264, clickThroughRate: 24.6, trend: -1.3 },
];

// Mock analytics data for dashboard
const MOCK_ANALYTICS_DATA: MarketingRuleAnalyticsData = {
  totalViews: 4721,
  viewsChangePercent: 12.5,
  totalClicks: 1109,
  clicksChangePercent: 8.3,
  clickThroughRate: 23.5,
  ctrChangePercent: -2.1,
  performanceByRule: [
    { name: "Gauteng Jobs", clicks: 320 },
    { name: "Security Jobs", clicks: 280 },
    { name: "Retail Summer Campaign", clicks: 245 },
    { name: "Entry-level Tech Jobs", clicks: 264 },
  ]
};

// Marketing Rule Service
const marketingRuleService = {
  // Get all marketing rules
  async getRules(): Promise<MarketingRule[]> {
    // In production, replace with actual API call
    // return axios.get('/api/marketing-rules').then(res => res.data);

    // For development, return mock data
    return Promise.resolve(MOCK_RULES);
  },

  // Get a single rule by ID
  async getRule(id: string): Promise<MarketingRule | undefined> {
    // In production, replace with actual API call
    // return axios.get(`/api/marketing-rules/${id}`).then(res => res.data);

    // For development, return mock data
    return Promise.resolve(MOCK_RULES.find(rule => rule.id === id));
  },

  // Create a new rule
  async createRule(rule: Omit<MarketingRule, 'id' | 'createdAt'>): Promise<MarketingRule> {
    // In production, replace with actual API call
    // return axios.post('/api/marketing-rules', rule).then(res => res.data);

    // For development, simulate creating a rule
    const newRule: MarketingRule = {
      ...rule,
      id: Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
      // Set ctaPreview to messageTemplate if not provided
      ctaPreview: rule.ctaPreview || rule.messageTemplate,
    };

    MOCK_RULES.push(newRule);
    return Promise.resolve(newRule);
  },

  // Update an existing rule
  async updateRule(id: string, rule: Partial<MarketingRule>): Promise<MarketingRule> {
    // In production, replace with actual API call
    // return axios.put(`/api/marketing-rules/${id}`, rule).then(res => res.data);

    // For development, simulate updating a rule
    const index = MOCK_RULES.findIndex(r => r.id === id);
    if (index === -1) {
      throw new Error(`Rule with ID ${id} not found`);
    }

    // Update ctaPreview if messageTemplate is changed
    const ctaPreview = rule.messageTemplate || MOCK_RULES[index].messageTemplate;

    const updatedRule = {
      ...MOCK_RULES[index],
      ...rule,
      ctaPreview: rule.ctaPreview || ctaPreview,
      updatedAt: new Date().toISOString(),
    };

    MOCK_RULES[index] = updatedRule;
    return Promise.resolve(updatedRule);
  },

  // Delete a rule
  async deleteRule(id: string): Promise<void> {
    // In production, replace with actual API call
    // return axios.delete(`/api/marketing-rules/${id}`).then(() => {});

    // For development, simulate deleting a rule
    const index = MOCK_RULES.findIndex(r => r.id === id);
    if (index === -1) {
      throw new Error(`Rule with ID ${id} not found`);
    }

    MOCK_RULES.splice(index, 1);
    return Promise.resolve();
  },

  // Toggle rule status (active/inactive)
  async toggleRuleStatus(id: string): Promise<MarketingRule> {
    // In production, replace with actual API call
    // return axios.patch(`/api/marketing-rules/${id}/toggle-status`).then(res => res.data);

    // For development, simulate toggling status
    const index = MOCK_RULES.findIndex(r => r.id === id);
    if (index === -1) {
      throw new Error(`Rule with ID ${id} not found`);
    }

    const updatedRule = {
      ...MOCK_RULES[index],
      status: MOCK_RULES[index].status === 'Active' ? 'Inactive' : 'Active',
      updatedAt: new Date().toISOString(),
    };

    MOCK_RULES[index] = updatedRule;
    return Promise.resolve(updatedRule);
  },

  // Get analytics for all rules
  async getRulesAnalytics(): Promise<RuleAnalytics[]> {
    // In production, replace with actual API call
    // return axios.get('/api/marketing-rules/analytics').then(res => res.data);

    // For development, return mock data
    return Promise.resolve(MOCK_ANALYTICS);
  },

  // Get analytics for a specific rule
  async getRuleAnalytics(id: string): Promise<RuleAnalytics | undefined> {
    // In production, replace with actual API call
    // return axios.get(`/api/marketing-rules/${id}/analytics`).then(res => res.data);

    // For development, return mock data
    return Promise.resolve(MOCK_ANALYTICS.find(analytics => analytics.ruleId === id));
  },

  // Get overall marketing rules stats
  async getOverallStats(): Promise<MarketingRuleStats> {
    // In production, replace with actual API call
    // return axios.get('/api/marketing-rules/stats').then(res => res.data);

    // For development, calculate from mock data
    const activeRules = MOCK_RULES.filter(rule => rule.status === 'Active').length;
    const inactiveRules = MOCK_RULES.length - activeRules;
    const jobsProcessed = 1247; // Mock value

    // Calculate average click rate
    const totalClicks = MOCK_ANALYTICS.reduce((sum, item) => sum + item.clicks, 0);
    const totalViews = MOCK_ANALYTICS.reduce((sum, item) => sum + item.views, 0);
    const ctaClickRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

    return Promise.resolve({
      activeRules,
      inactiveRules,
      jobsProcessed,
      ctaClickRate,
    });
  },

  // Get marketing rules analytics data
  async getMarketingAnalytics(): Promise<MarketingRuleAnalyticsData> {
    // In production, replace with actual API call
    // return axios.get('/api/marketing-rules/analytics-dashboard').then(res => res.data);

    // For development, return mock data
    return Promise.resolve(MOCK_ANALYTICS_DATA);
  },
};

export default marketingRuleService;
