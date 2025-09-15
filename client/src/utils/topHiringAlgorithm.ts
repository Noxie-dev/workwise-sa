// Algorithm for determining top hiring companies based on multiple factors

export interface CompanyHiringMetrics {
  id: number;
  name: string;
  openPositions: number;
  rating: number;
  growthRate: number;
  employeeCount: string;
  isHiringNow: boolean;
  recentHires?: number; // Number of hires in last 30 days
  jobPostingFrequency?: number; // New job postings per week
  applicationResponseRate?: number; // Percentage of applications responded to
  hiringVelocity?: number; // Average days from application to hire
  industryDemand?: number; // Industry-specific demand score (1-10)
  locationActivity?: number; // Hiring activity in specific locations
  urgentPositions?: number; // Number of positions marked as urgent
  lastHiringActivity?: Date; // Last time company posted a job or made a hire
}

export interface TopHiringCompanyResult extends CompanyHiringMetrics {
  hiringScore: number;
  rank: number;
  scoreBreakdown: {
    positionScore: number;
    activityScore: number;
    qualityScore: number;
    velocityScore: number;
    demandScore: number;
  };
}

// Weights for different factors (should sum to 100)
const SCORING_WEIGHTS = {
  OPEN_POSITIONS: 25,      // Number of open positions
  HIRING_ACTIVITY: 20,     // Recent hiring activity and frequency
  COMPANY_QUALITY: 15,     // Rating and reputation
  HIRING_VELOCITY: 15,     // How quickly they hire
  INDUSTRY_DEMAND: 10,     // Industry-specific demand
  GROWTH_RATE: 10,         // Company growth rate
  URGENCY: 5               // Urgent positions
};

/**
 * Calculate hiring score for a company based on multiple factors
 */
export const calculateHiringScore = (company: CompanyHiringMetrics): TopHiringCompanyResult => {
  // Factor 1: Open Positions Score (25% weight)
  const positionScore = Math.min(company.openPositions / 100, 1) * SCORING_WEIGHTS.OPEN_POSITIONS;
  
  // Factor 2: Hiring Activity Score (20% weight)
  let activityScore = 0;
  if (company.isHiringNow) activityScore += 5;
  if (company.recentHires) activityScore += Math.min(company.recentHires / 20, 1) * 10;
  if (company.jobPostingFrequency) activityScore += Math.min(company.jobPostingFrequency / 5, 1) * 5;
  activityScore = Math.min(activityScore, SCORING_WEIGHTS.HIRING_ACTIVITY);
  
  // Factor 3: Company Quality Score (15% weight)
  const ratingScore = (company.rating / 5) * 10;
  const responseScore = company.applicationResponseRate ? (company.applicationResponseRate / 100) * 5 : 0;
  const qualityScore = Math.min(ratingScore + responseScore, SCORING_WEIGHTS.COMPANY_QUALITY);
  
  // Factor 4: Hiring Velocity Score (15% weight)
  let velocityScore = 0;
  if (company.hiringVelocity) {
    // Lower days = higher score (faster hiring)
    const velocityRatio = Math.max(0, (30 - company.hiringVelocity) / 30);
    velocityScore = velocityRatio * SCORING_WEIGHTS.HIRING_VELOCITY;
  }
  
  // Factor 5: Industry Demand Score (10% weight)
  const demandScore = company.industryDemand ? 
    (company.industryDemand / 10) * SCORING_WEIGHTS.INDUSTRY_DEMAND : 
    SCORING_WEIGHTS.INDUSTRY_DEMAND * 0.5; // Default to 50% if no data
  
  // Factor 6: Growth Rate Score (10% weight)
  const growthScore = Math.min(company.growthRate / 25, 1) * SCORING_WEIGHTS.GROWTH_RATE;
  
  // Factor 7: Urgency Score (5% weight)
  const urgencyScore = company.urgentPositions ? 
    Math.min(company.urgentPositions / 10, 1) * SCORING_WEIGHTS.URGENCY : 0;
  
  // Calculate total score
  const totalScore = positionScore + activityScore + qualityScore + 
                    velocityScore + demandScore + growthScore + urgencyScore;
  
  return {
    ...company,
    hiringScore: Math.round(totalScore),
    rank: 0, // Will be set after sorting
    scoreBreakdown: {
      positionScore: Math.round(positionScore),
      activityScore: Math.round(activityScore),
      qualityScore: Math.round(qualityScore),
      velocityScore: Math.round(velocityScore),
      demandScore: Math.round(demandScore)
    }
  };
};

/**
 * Get top hiring companies from a list of companies
 */
export const getTopHiringCompanies = (
  companies: CompanyHiringMetrics[], 
  limit: number = 3
): TopHiringCompanyResult[] => {
  // Calculate scores for all companies
  const companiesWithScores = companies.map(calculateHiringScore);
  
  // Sort by hiring score (descending)
  const sortedCompanies = companiesWithScores.sort((a, b) => b.hiringScore - a.hiringScore);
  
  // Add rank and return top companies
  return sortedCompanies
    .slice(0, limit)
    .map((company, index) => ({
      ...company,
      rank: index + 1
    }));
};

/**
 * Fetch top hiring companies from API (for production use)
 */
export const fetchTopHiringCompanies = async (limit: number = 3): Promise<TopHiringCompanyResult[]> => {
  try {
    // This would be the actual API call when the platform is live
    const url = new URL('http://localhost:3001/api/companies/top-hiring');
    url.searchParams.append('limit', limit.toString());
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch top hiring companies');
    }
    
    const data = await response.json();
    
    // If the API already returns ranked companies, use them directly
    if (data.companies && Array.isArray(data.companies) && data.companies[0]?.hiringScore) {
      return data.companies.slice(0, limit);
    }
    
    // Otherwise, apply our algorithm
    return getTopHiringCompanies(data.companies, limit);
    
  } catch (error) {
    console.error('Error fetching top hiring companies:', error);
    
    // Fallback to mock data or empty array
    return [];
  }
};

/**
 * Update company hiring metrics (for when new data comes in)
 */
export const updateCompanyHiringMetrics = async (
  companyId: number, 
  metrics: Partial<CompanyHiringMetrics>
): Promise<boolean> => {
  try {
    const response = await fetch(`http://localhost:3001/api/companies/${companyId}/hiring-metrics`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metrics),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error updating company hiring metrics:', error);
    return false;
  }
};

/**
 * Get hiring trends and insights
 */
export const getHiringTrends = async (): Promise<{
  totalOpenPositions: number;
  averageHiringVelocity: number;
  topIndustries: string[];
  mostActiveLocations: string[];
}> => {
  try {
    const response = await fetch('http://localhost:3001/api/analytics/hiring-trends');
    
    if (!response.ok) {
      throw new Error('Failed to fetch hiring trends');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching hiring trends:', error);
    
    // Return default/mock data
    return {
      totalOpenPositions: 0,
      averageHiringVelocity: 0,
      topIndustries: [],
      mostActiveLocations: []
    };
  }
};