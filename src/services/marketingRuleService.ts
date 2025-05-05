// src/services/marketingRuleService.ts
import { MarketingRule, MarketingRuleStats, MarketingRuleAnalyticsData, JobListingExample } from '@/types/marketing-rules';

// MOCK DATA - Replace with actual API calls using fetch, axios, or React Query mutations/queries
const MOCK_RULES: MarketingRule[] = [
  { id: '1', ruleName: 'Gauteng Jobs', targetLocation: 'Gauteng', targetJobType: 'All', ctaPreview: '"Apply on WorkwiseSA for exclusive access!"', messageTemplate: 'Apply on WorkwiseSA for exclusive access!', ctaLink: 'https://www.workwisesa.co.za/gauteng-jobs', status: 'Active', createdAt: '14 days ago' },
  { id: '2', ruleName: 'Security Jobs', targetLocation: 'All', targetJobType: 'Security', ctaPreview: '"Click to view security clearance requirements"', messageTemplate: 'Click to view security clearance requirements', ctaLink: 'https://www.workwisesa.co.za/security-jobs', status: 'Active', createdAt: '7 days ago' },
  { id: '3', ruleName: 'Retail Summer Campaign', targetLocation: 'Cape Town', targetJobType: 'Retail', ctaPreview: '"Summer retail positions - Apply now!"', messageTemplate: 'Summer retail positions - Apply now!', ctaLink: 'https://www.workwisesa.co.za/retail-jobs', status: 'Inactive', createdAt: '3 days ago' },
  { id: '4', ruleName: 'Entry-level Tech Jobs', targetLocation: 'All', targetJobType: 'IT/Technology', targetDemographics: 'Entry-level', demographicTags: ['Entry-level'], ctaPreview: '"No experience? No problem! Click to learn more"', messageTemplate: 'No experience? No problem! Click to learn more', ctaLink: 'https://www.workwisesa.co.za/tech-careers', status: 'Active', createdAt: '1 day ago' },
];

const MOCK_STATS: MarketingRuleStats = {
  activeRules: 3,
  inactiveRules: 1,
  jobsProcessed: 1247,
  ctaClickRate: 23.5,
};

const MOCK_ANALYTICS: MarketingRuleAnalyticsData = {
    totalViews: 4721,
    viewsChangePercent: 12.5,
    totalClicks: 1109,
    clicksChangePercent: 8.3,
    clickThroughRate: 23.5,
    ctrChangePercent: -2.1,
    performanceByRule: [
        { name: 'Gauteng Jobs', clicks: 400 },
        { name: 'Security Jobs', clicks: 350 },
        { name: 'Retail Summer', clicks: 150 }, // Inactive, maybe lower clicks
        { name: 'Entry-level Tech', clicks: 209 },
    ]
};

const MOCK_ORIGINAL_JOB: JobListingExample = {
    title: 'Junior Software Developer',
    company: 'TechInnovate Solutions',
    location: 'Johannesburg, Gauteng',
    jobType: 'IT/Technology',
    description: 'Entry-level position for a passionate developer. Knowledge of HTML, CSS, and JavaScript preferred. Opportunity to learn and grow in a supportive environment.',
    contactInfo: {
        email: 'recruitment@techinnovate.co.za',
        phone: '011-555-9876',
        applyInstructions: 'Send CV to jobs@techinnovate.co.za by August 15th',
    }
};
// --- Placeholder Service Functions ---

export const fetchMarketingRules = async (): Promise<MarketingRule[]> => {
  console.log('API CALL: fetchMarketingRules');
  // Replace with actual API call
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
  return MOCK_RULES;
};

export const fetchMarketingRuleStats = async (): Promise<MarketingRuleStats> => {
    console.log('API CALL: fetchMarketingRuleStats');
    await new Promise(resolve => setTimeout(resolve, 300));
    return MOCK_STATS;
};

export const fetchMarketingRuleAnalytics = async (period: string = 'Last 7 Days'): Promise<MarketingRuleAnalyticsData> => {
    console.log(`API CALL: fetchMarketingRuleAnalytics for ${period}`);
    await new Promise(resolve => setTimeout(resolve, 700));
    // In reality, period would affect the data returned
    return MOCK_ANALYTICS;
};

export const saveMarketingRule = async (rule: Omit<MarketingRule, 'id' | 'createdAt' | 'ctaPreview'> | MarketingRule): Promise<MarketingRule> => {
  console.log('API CALL: saveMarketingRule', rule);
  await new Promise(resolve => setTimeout(resolve, 600));
  // Simulate save/update
  if ('id' in rule) {
     // Update existing rule (mock logic)
     const index = MOCK_RULES.findIndex(r => r.id === rule.id);
     if (index > -1) {
         MOCK_RULES[index] = { ...MOCK_RULES[index], ...rule, ctaPreview: `"${rule.messageTemplate}"` };
         return MOCK_RULES[index];
     }
  }
  // Create new rule (mock logic)
  const newRule: MarketingRule = {
      ...rule,
      id: Date.now().toString(),
      createdAt: 'Just now',
      ctaPreview: `"${rule.messageTemplate}"`,
      status: rule.status || 'Active', // Ensure status is set
      targetLocation: rule.targetLocation || 'All Locations', // Ensure defaults
      targetJobType: rule.targetJobType || 'All',
  };
  MOCK_RULES.push(newRule);
  return newRule;
};

export const deleteMarketingRule = async (ruleId: string): Promise<void> => {
    console.log('API CALL: deleteMarketingRule', ruleId);
    await new Promise(resolve => setTimeout(resolve, 400));
    // Mock deletion
    const index = MOCK_RULES.findIndex(r => r.id === ruleId);
    if (index > -1) {
        MOCK_RULES.splice(index, 1);
    }
};

export const fetchOriginalJobExample = async (rule?: MarketingRule): Promise<JobListingExample> => {
    console.log('API CALL: fetchOriginalJobExample based on rule', rule?.ruleName);
     await new Promise(resolve => setTimeout(resolve, 200));
    // Return a relevant example or a default one
    return MOCK_ORIGINAL_JOB;
}
