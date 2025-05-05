import { Request, Response } from 'express';
import { z } from 'zod';

// Pagination schema for validation
const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10)
});

// Query parameters schema for job distribution
const jobDistributionQuerySchema = z.object({
  categoryFilter: z.string().optional().default('all'),
  dateRange: z.string().optional().default('30d'),
  ...paginationSchema.shape
});

// Query parameters schema for job recommendations
const jobRecommendationsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(20).default(3),
  userId: z.string().optional(),
  ...paginationSchema.shape
});

// Query parameters schema for skills analysis
const skillsAnalysisQuerySchema = z.object({
  userId: z.string().optional(),
  ...paginationSchema.shape
});

/**
 * Get paginated job distribution data
 */
export const getJobDistribution = async (req: Request, res: Response) => {
  try {
    const { categoryFilter, dateRange, page, limit } = jobDistributionQuerySchema.parse(req.query);
    
    // In a real implementation, you would fetch data from your database with pagination
    // For example: const result = await db.jobDistribution.findMany({ 
    //   where: { category: categoryFilter !== 'all' ? categoryFilter : undefined },
    //   skip: (page - 1) * limit,
    //   take: limit
    // });
    
    // For now, we'll simulate pagination with mock data
    const mockData = generateMockJobDistribution(categoryFilter, dateRange);
    
    // Apply pagination to the mock data
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    // Paginate categories
    const paginatedCategories = mockData.categories.slice(startIndex, endIndex);
    
    // Return paginated data with metadata
    res.json({
      data: {
        ...mockData,
        categories: paginatedCategories
      },
      pagination: {
        page,
        limit,
        totalItems: mockData.categories.length,
        totalPages: Math.ceil(mockData.categories.length / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching job distribution:', error);
    res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch job distribution data'
    });
  }
};

/**
 * Get paginated job recommendations
 */
export const getJobRecommendations = async (req: Request, res: Response) => {
  try {
    const { limit: recommendationLimit, userId, page, limit: pageLimit } = jobRecommendationsQuerySchema.parse(req.query);
    
    // In a real implementation, fetch from database with pagination
    // For now, simulate with mock data
    const allRecommendations = generateMockJobRecommendations(userId);
    
    // Apply pagination
    const startIndex = (page - 1) * pageLimit;
    const endIndex = startIndex + pageLimit;
    const paginatedRecommendations = allRecommendations.slice(startIndex, endIndex);
    
    res.json({
      data: paginatedRecommendations,
      pagination: {
        page,
        limit: pageLimit,
        totalItems: allRecommendations.length,
        totalPages: Math.ceil(allRecommendations.length / pageLimit)
      }
    });
  } catch (error) {
    console.error('Error fetching job recommendations:', error);
    res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch job recommendations'
    });
  }
};

/**
 * Get paginated skills analysis data
 */
export const getSkillsAnalysis = async (req: Request, res: Response) => {
  try {
    const { userId, page, limit } = skillsAnalysisQuerySchema.parse(req.query);
    
    // In a real implementation, fetch from database with pagination
    // For now, simulate with mock data
    const skillsData = generateMockSkillsAnalysis(userId);
    
    // Apply pagination to marketDemand array
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedMarketDemand = skillsData.marketDemand.slice(startIndex, endIndex);
    
    res.json({
      data: {
        ...skillsData,
        marketDemand: paginatedMarketDemand
      },
      pagination: {
        page,
        limit,
        totalItems: skillsData.marketDemand.length,
        totalPages: Math.ceil(skillsData.marketDemand.length / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching skills analysis:', error);
    res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch skills analysis data'
    });
  }
};

// Mock data generators (these would be replaced with actual database queries)
function generateMockJobDistribution(categoryFilter: string, dateRange: string) {
  // This is just a placeholder - in a real implementation, you would query your database
  return {
    categories: [
      { category: 'General Worker', count: 145 },
      { category: 'Construction Worker', count: 89 },
      { category: 'Picker/Packer', count: 112 },
      { category: 'Warehouse Assistant', count: 78 },
      { category: 'Cashier', count: 103 },
      { category: 'Cleaner', count: 92 },
      { category: 'Security Guard', count: 67 },
      { category: 'Admin Clerk', count: 54 },
      { category: 'Retail Assistant', count: 88 },
      { category: 'Call Center Agent', count: 76 },
      { category: 'Driver', count: 65 },
      { category: 'Receptionist', count: 42 },
      { category: 'Factory Worker', count: 58 },
      { category: 'Kitchen Staff', count: 47 },
      { category: 'Gardener', count: 35 }
    ],
    locations: [
      { name: 'Gauteng', value: 450 },
      { name: 'Western Cape', value: 320 },
      { name: 'KwaZulu-Natal', value: 280 },
      { name: 'Eastern Cape', value: 150 },
      { name: 'Free State', value: 120 }
    ],
    trends: [
      { date: '2023-01', applications: 1200 },
      { date: '2023-02', applications: 1350 },
      { date: '2023-03', applications: 1500 },
      { date: '2023-04', applications: 1420 },
      { date: '2023-05', applications: 1650 },
      { date: '2023-06', applications: 1800 }
    ]
  };
}

function generateMockJobRecommendations(userId?: string) {
  // This is just a placeholder - in a real implementation, you would query your database
  return [
    {
      id: '1',
      title: 'Warehouse Assistant',
      company: 'LogiCorp SA',
      match: 95,
      location: 'Johannesburg, Gauteng',
      type: 'Full-time',
      postedDate: '2023-06-15',
      description: 'Looking for a reliable warehouse assistant to help with inventory management and order fulfillment.',
      skills: ['Inventory Management', 'Physical Stamina', 'Basic Computer Skills']
    },
    {
      id: '2',
      title: 'Retail Sales Associate',
      company: 'ShopRight',
      match: 88,
      location: 'Cape Town, Western Cape',
      type: 'Part-time',
      postedDate: '2023-06-18',
      description: 'Join our team as a retail sales associate to assist customers and manage store inventory.',
      skills: ['Customer Service', 'Cash Handling', 'Sales']
    },
    {
      id: '3',
      title: 'Office Admin Assistant',
      company: 'Business Solutions',
      match: 82,
      location: 'Pretoria, Gauteng',
      type: 'Full-time',
      postedDate: '2023-06-20',
      description: 'Entry-level administrative position supporting office operations and client communications.',
      skills: ['MS Office', 'Organization', 'Communication']
    },
    {
      id: '4',
      title: 'Security Guard',
      company: 'SecureForce',
      match: 79,
      location: 'Durban, KwaZulu-Natal',
      type: 'Full-time',
      postedDate: '2023-06-17',
      description: 'Responsible for maintaining security and safety at commercial properties.',
      skills: ['Security Protocols', 'Surveillance', 'Reporting']
    },
    {
      id: '5',
      title: 'Cashier',
      company: 'QuickMart',
      match: 75,
      location: 'Bloemfontein, Free State',
      type: 'Part-time',
      postedDate: '2023-06-19',
      description: 'Process customer transactions and provide excellent customer service.',
      skills: ['Cash Handling', 'Customer Service', 'Basic Math']
    }
  ];
}

function generateMockSkillsAnalysis(userId?: string) {
  // This is just a placeholder - in a real implementation, you would query your database
  return {
    marketDemand: [
      { skill: 'Customer Service', demand: 85, growth: 5 },
      { skill: 'Computer Literacy', demand: 78, growth: 12 },
      { skill: 'Communication', demand: 92, growth: 3 },
      { skill: 'Problem Solving', demand: 65, growth: 8 },
      { skill: 'Time Management', demand: 70, growth: 4 },
      { skill: 'Teamwork', demand: 88, growth: 2 },
      { skill: 'Adaptability', demand: 72, growth: 15 },
      { skill: 'Sales', demand: 68, growth: 7 },
      { skill: 'Basic Accounting', demand: 55, growth: 6 },
      { skill: 'Data Entry', demand: 60, growth: 9 },
      { skill: 'Inventory Management', demand: 58, growth: 5 },
      { skill: 'Microsoft Office', demand: 75, growth: 3 },
      { skill: 'Social Media', demand: 62, growth: 18 },
      { skill: 'Customer Relationship Management', demand: 67, growth: 10 },
      { skill: 'Basic Technical Support', demand: 59, growth: 14 }
    ],
    userSkills: [
      { skill: 'Customer Service', level: 'Intermediate' },
      { skill: 'Computer Literacy', level: 'Basic' },
      { skill: 'Communication', level: 'Advanced' }
    ],
    recommendations: [
      { skill: 'Microsoft Office', reason: 'High demand across multiple industries' },
      { skill: 'Social Media', reason: 'Fastest growing skill requirement' },
      { skill: 'Basic Accounting', reason: 'Would complement your existing skillset' }
    ]
  };
}
