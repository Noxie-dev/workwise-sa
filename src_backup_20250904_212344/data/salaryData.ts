/**
 * Centralized salary data for the WorkWise SA platform
 * Contains industry averages and job category information for South Africa
 */

// South African minimum wage (2024)
export const MINIMUM_WAGE = {
  hourly: 27.58,
  monthly: 4769.93, // Based on 173 hours per month
  annual: 57239.16,
};

// Industry average salary data for professional jobs in South Africa (monthly)
export const professionalIndustryAverages = {
  "Technology": { entry: 25000, mid: 45000, senior: 70000 },
  "Finance": { entry: 28000, mid: 50000, senior: 80000 },
  "Healthcare": { entry: 22000, mid: 38000, senior: 60000 },
  "Education": { entry: 20000, mid: 32000, senior: 48000 },
  "Marketing": { entry: 18000, mid: 35000, senior: 55000 },
  "Retail": { entry: 15000, mid: 25000, senior: 45000 },
  "Manufacturing": { entry: 16000, mid: 28000, senior: 52000 },
  "Construction": { entry: 17000, mid: 30000, senior: 58000 },
  "Hospitality": { entry: 14000, mid: 22000, senior: 40000 },
};

// Entry-level job categories and salary data in South Africa (monthly)
export const lowLevelJobAverages = {
  "General Worker": { entry: 4800, mid: 5500, senior: 7000 },
  "Domestic Worker": { entry: 4800, mid: 5800, senior: 8500 },
  "Security Guard": { entry: 5500, mid: 7000, senior: 9500 },
  "Retail Assistant": { entry: 5000, mid: 6500, senior: 8000 },
  "Cleaner": { entry: 4800, mid: 5500, senior: 7000 },
  "Gardener": { entry: 4800, mid: 5500, senior: 7000 },
  "Factory Worker": { entry: 5500, mid: 7000, senior: 9000 },
  "Cashier": { entry: 5000, mid: 6500, senior: 8000 },
  "Waitstaff": { entry: 4800, mid: 6000, senior: 8000 },
  "Call Center Agent": { entry: 6000, mid: 8000, senior: 12000 },
  "Driver": { entry: 6000, mid: 8000, senior: 12000 },
  "Warehouse Worker": { entry: 5500, mid: 7000, senior: 9000 },
};

// Combined industry averages for all job types
export const allIndustryAverages = {
  ...professionalIndustryAverages,
  ...lowLevelJobAverages,
};

// Job level descriptions
export const jobLevelDescriptions = {
  entry: "Entry level positions typically require minimal experience (0-2 years) and may involve basic tasks under supervision.",
  mid: "Mid-level positions usually require some experience (2-5 years) and involve more responsibility and independent work.",
  senior: "Senior positions typically require significant experience (5+ years) and may involve supervisory responsibilities.",
};

// Regional salary variations (multipliers)
export const regionalVariations = {
  "Gauteng": 1.0, // Base reference (100%)
  "Western Cape": 0.95,
  "KwaZulu-Natal": 0.9,
  "Eastern Cape": 0.85,
  "Free State": 0.85,
  "Mpumalanga": 0.85,
  "North West": 0.85,
  "Limpopo": 0.8,
  "Northern Cape": 0.8,
};

// Job category information
export const jobCategoryInfo = {
  "General Worker": {
    description: "Basic labor roles across various industries requiring minimal specialized skills.",
    qualifications: "No formal qualifications required, sometimes Grade 10-12.",
    growth: "Stable demand across multiple sectors.",
    benefits: "Often includes basic UIF benefits.",
  },
  "Domestic Worker": {
    description: "Household maintenance including cleaning, cooking, and childcare.",
    qualifications: "No formal qualifications required.",
    growth: "Steady demand in urban areas.",
    benefits: "Legally entitled to UIF benefits when registered.",
  },
  "Security Guard": {
    description: "Protection of property, people and assets through monitoring and patrol.",
    qualifications: "PSIRA registration required, Grade 10-12.",
    growth: "High demand due to security concerns.",
    benefits: "Often includes shift allowances and regulated working hours.",
  },
  "Retail Assistant": {
    description: "Customer service, merchandising and sales in retail environments.",
    qualifications: "Grade 10-12, sometimes retail certifications.",
    growth: "Consistent demand with seasonal peaks.",
    benefits: "May include staff discounts and commission structures.",
  },
  "Cleaner": {
    description: "Cleaning and sanitizing of commercial or residential spaces.",
    qualifications: "No formal qualifications required.",
    growth: "Stable demand across sectors.",
    benefits: "Often includes regulated working hours.",
  },
};

export default allIndustryAverages;
