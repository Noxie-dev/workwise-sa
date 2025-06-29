// src/types/marketing-rules.ts

export interface MarketingRule {
  id: string;
  ruleName: string;
  targetLocation: string; // Could be 'All Locations' or specific
  targetJobType: string; // Could be 'All' or specific category like 'IT/Technology'
  targetDemographics?: string; // e.g., 'Entry-level', 'Graduate', 'Junior'
  ctaPreview: string; // Derived from messageTemplate
  messageTemplate: string;
  ctaLink: string;
  status: 'Active' | 'Inactive';
  createdAt: string; // Or Date object
  // Optional fields for editing form/state
  demographicTags?: string[]; // e.g., ['Entry-level', 'Graduate', 'Junior'] if multi-select
}

export interface MarketingRuleStats {
  activeRules: number;
  inactiveRules: number;
  jobsProcessed: number;
  ctaClickRate: number; // As a percentage, e.g., 23.5
}

export interface MarketingRuleAnalyticsData {
  totalViews: number;
  viewsChangePercent: number;
  totalClicks: number;
  clicksChangePercent: number;
  clickThroughRate: number;
  ctrChangePercent: number;
  performanceByRule: { name: string; clicks: number }[]; // For the chart
}

// Example Job Listing structure for Preview
export interface JobListingExample {
    title: string;
    company: string;
    location: string;
    jobType: string;
    description: string;
    contactInfo?: {
        email?: string;
        phone?: string;
        applyInstructions?: string;
    };
}
