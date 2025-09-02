// src/api/v1/routes/top-hiring.ts
import { Router } from 'express';
import { storage } from '../../../../server/storage';

export function registerTopHiringRoutes(router: Router) {
  // Get top hiring companies endpoint
  router.get("/companies/top-hiring", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 3;
      
      // Get all companies with their hiring metrics
      const companies = await storage.getCompaniesWithHiringMetrics();
      
      // Calculate hiring scores and rank companies
      const topHiringCompanies = calculateTopHiringCompanies(companies, limit);
      
      res.json({
        success: true,
        data: {
          companies: topHiringCompanies,
          lastUpdated: new Date().toISOString(),
          algorithm: {
            version: "1.0",
            factors: [
              "Open positions (25%)",
              "Hiring activity (20%)", 
              "Company quality (15%)",
              "Hiring velocity (15%)",
              "Industry demand (10%)",
              "Growth rate (10%)",
              "Urgency (5%)"
            ]
          }
        }
      });
    } catch (error) {
      console.error("Error fetching top hiring companies:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch top hiring companies",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Get hiring trends and analytics
  router.get("/analytics/hiring-trends", async (req, res) => {
    try {
      const trends = await storage.getHiringTrends();
      
      res.json({
        success: true,
        data: trends
      });
    } catch (error) {
      console.error("Error fetching hiring trends:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch hiring trends",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Update company hiring metrics
  router.patch("/companies/:id/hiring-metrics", async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      const metrics = req.body;
      
      // Validate the metrics data
      if (!isValidHiringMetrics(metrics)) {
        return res.status(400).json({
          success: false,
          message: "Invalid hiring metrics data"
        });
      }
      
      const updated = await storage.updateCompanyHiringMetrics(companyId, metrics);
      
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Company not found"
        });
      }
      
      res.json({
        success: true,
        message: "Hiring metrics updated successfully"
      });
    } catch (error) {
      console.error("Error updating hiring metrics:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to update hiring metrics",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });
}

// Algorithm to calculate top hiring companies
function calculateTopHiringCompanies(companies: any[], limit: number) {
  const WEIGHTS = {
    OPEN_POSITIONS: 25,
    HIRING_ACTIVITY: 20,
    COMPANY_QUALITY: 15,
    HIRING_VELOCITY: 15,
    INDUSTRY_DEMAND: 10,
    GROWTH_RATE: 10,
    URGENCY: 5
  };

  const companiesWithScores = companies.map(company => {
    // Factor 1: Open Positions Score
    const positionScore = Math.min(company.openPositions / 100, 1) * WEIGHTS.OPEN_POSITIONS;
    
    // Factor 2: Hiring Activity Score
    let activityScore = 0;
    if (company.isHiringNow) activityScore += 5;
    if (company.recentHires) activityScore += Math.min(company.recentHires / 20, 1) * 10;
    if (company.jobPostingFrequency) activityScore += Math.min(company.jobPostingFrequency / 5, 1) * 5;
    activityScore = Math.min(activityScore, WEIGHTS.HIRING_ACTIVITY);
    
    // Factor 3: Company Quality Score
    const ratingScore = (company.rating / 5) * 10;
    const responseScore = company.applicationResponseRate ? (company.applicationResponseRate / 100) * 5 : 0;
    const qualityScore = Math.min(ratingScore + responseScore, WEIGHTS.COMPANY_QUALITY);
    
    // Factor 4: Hiring Velocity Score
    let velocityScore = 0;
    if (company.hiringVelocity) {
      const velocityRatio = Math.max(0, (30 - company.hiringVelocity) / 30);
      velocityScore = velocityRatio * WEIGHTS.HIRING_VELOCITY;
    }
    
    // Factor 5: Industry Demand Score
    const demandScore = company.industryDemand ? 
      (company.industryDemand / 10) * WEIGHTS.INDUSTRY_DEMAND : 
      WEIGHTS.INDUSTRY_DEMAND * 0.5;
    
    // Factor 6: Growth Rate Score
    const growthScore = Math.min(company.growthRate / 25, 1) * WEIGHTS.GROWTH_RATE;
    
    // Factor 7: Urgency Score
    const urgencyScore = company.urgentPositions ? 
      Math.min(company.urgentPositions / 10, 1) * WEIGHTS.URGENCY : 0;
    
    const totalScore = positionScore + activityScore + qualityScore + 
                      velocityScore + demandScore + growthScore + urgencyScore;
    
    return {
      ...company,
      hiringScore: Math.round(totalScore),
      scoreBreakdown: {
        positionScore: Math.round(positionScore),
        activityScore: Math.round(activityScore),
        qualityScore: Math.round(qualityScore),
        velocityScore: Math.round(velocityScore),
        demandScore: Math.round(demandScore)
      }
    };
  });

  // Sort by hiring score and return top companies
  return companiesWithScores
    .sort((a, b) => b.hiringScore - a.hiringScore)
    .slice(0, limit)
    .map((company, index) => ({
      ...company,
      rank: index + 1
    }));
}

// Validate hiring metrics data
function isValidHiringMetrics(metrics: any): boolean {
  const validFields = [
    'openPositions', 'recentHires', 'jobPostingFrequency', 
    'applicationResponseRate', 'hiringVelocity', 'industryDemand',
    'urgentPositions', 'isHiringNow'
  ];
  
  // Check if at least one valid field is present
  return Object.keys(metrics).some(key => validFields.includes(key));
}