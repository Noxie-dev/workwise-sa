import { mockExtendedCompanies } from '@/pages/Companies';
import { createMockResponse } from './mockData';

export interface CompanySearchParams {
  query?: string;
  industry?: string;
  location?: string;
  size?: string;
  hiringNow?: boolean;
  remote?: boolean;
  verified?: boolean;
  sortBy?: 'rating' | 'positions' | 'growth' | 'name';
  page?: number;
  limit?: number;
}

export interface CompanyInsights {
  hiringTrends: {
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  topIndustries: Array<{
    name: string;
    companies: number;
    growth: number;
  }>;
  averageRating: number;
  totalPositions: number;
  remotePercentage: number;
}

export interface CompanyAlert {
  id: string;
  companyId: number;
  userId: number;
  type: 'new_job' | 'company_update' | 'hiring_status';
  isActive: boolean;
  criteria: {
    roles?: string[];
    departments?: string[];
    locations?: string[];
  };
  createdAt: Date;
}

class CompanyService {
  private baseUrl = '/api/companies';

  async searchCompanies(params: CompanySearchParams = {}) {
    try {
      // In production, this would make an actual API call
      if (import.meta.env.PROD || window.location.hostname.includes('netlify.app')) {
        // Filter mock data based on search params
        let filtered = [...mockExtendedCompanies];

        if (params.query) {
          const query = params.query.toLowerCase();
          filtered = filtered.filter(company => 
            company.name.toLowerCase().includes(query) ||
            company.description?.toLowerCase().includes(query) ||
            company.industry?.toLowerCase().includes(query)
          );
        }

        if (params.industry && params.industry !== 'all') {
          filtered = filtered.filter(company => company.industry === params.industry);
        }

        if (params.location && params.location !== 'all') {
          filtered = filtered.filter(company => company.location.includes(params.location));
        }

        if (params.size && params.size !== 'all') {
          filtered = filtered.filter(company => company.size === params.size);
        }

        if (params.hiringNow) {
          filtered = filtered.filter(company => company.isHiringNow);
        }

        if (params.remote) {
          filtered = filtered.filter(company => company.isRemoteFriendly);
        }

        if (params.verified) {
          filtered = filtered.filter(company => company.isVerified);
        }

        // Sort results
        if (params.sortBy) {
          filtered.sort((a, b) => {
            switch (params.sortBy) {
              case 'rating':
                return (b.rating || 0) - (a.rating || 0);
              case 'positions':
                return b.openPositions - a.openPositions;
              case 'growth':
                return (b.growthRate || 0) - (a.growthRate || 0);
              case 'name':
                return a.name.localeCompare(b.name);
              default:
                return 0;
            }
          });
        }

        // Pagination
        const page = params.page || 1;
        const limit = params.limit || 20;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedResults = filtered.slice(startIndex, endIndex);

        return createMockResponse({
          companies: paginatedResults,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(filtered.length / limit),
            totalItems: filtered.length,
            itemsPerPage: limit
          }
        });
      }

      // Development API call
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`${this.baseUrl}?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch companies');
      }
      return response.json();
    } catch (error) {
      console.error('Error searching companies:', error);
      // Fallback to mock data
      return createMockResponse({ companies: mockExtendedCompanies });
    }
  }

  async getCompanyById(id: number) {
    try {
      if (import.meta.env.PROD || window.location.hostname.includes('netlify.app')) {
        const company = mockExtendedCompanies.find(c => c.id === id);
        if (!company) {
          throw new Error('Company not found');
        }
        return createMockResponse(company);
      }

      const response = await fetch(`${this.baseUrl}/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch company');
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching company:', error);
      throw error;
    }
  }

  async getCompanyBySlug(slug: string) {
    try {
      if (import.meta.env.PROD || window.location.hostname.includes('netlify.app')) {
        const company = mockExtendedCompanies.find(c => c.slug === slug);
        if (!company) {
          throw new Error('Company not found');
        }
        return createMockResponse(company);
      }

      const response = await fetch(`${this.baseUrl}/slug/${slug}`);
      if (!response.ok) {
        throw new Error('Failed to fetch company');
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching company by slug:', error);
      throw error;
    }
  }

  async getCompanyJobs(companyId: number, params: { page?: number; limit?: number } = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());

      const response = await fetch(`${this.baseUrl}/${companyId}/jobs?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch company jobs');
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching company jobs:', error);
      return createMockResponse({ jobs: [] });
    }
  }

  async getCompanyInsights(): Promise<CompanyInsights> {
    try {
      if (import.meta.env.PROD || window.location.hostname.includes('netlify.app')) {
        // Mock insights data
        return {
          hiringTrends: {
            thisMonth: 234,
            lastMonth: 198,
            growth: 18.2
          },
          topIndustries: [
            { name: 'Technology', companies: 127, growth: 45 },
            { name: 'FinTech', companies: 89, growth: 38 },
            { name: 'Healthcare', companies: 156, growth: 32 },
            { name: 'GreenTech', companies: 67, growth: 55 }
          ],
          averageRating: 4.3,
          totalPositions: 2547,
          remotePercentage: 68
        };
      }

      const response = await fetch(`${this.baseUrl}/insights`);
      if (!response.ok) {
        throw new Error('Failed to fetch company insights');
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching company insights:', error);
      throw error;
    }
  }

  async followCompany(companyId: number) {
    try {
      const response = await fetch(`${this.baseUrl}/${companyId}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to follow company');
      }
      return response.json();
    } catch (error) {
      console.error('Error following company:', error);
      throw error;
    }
  }

  async unfollowCompany(companyId: number) {
    try {
      const response = await fetch(`${this.baseUrl}/${companyId}/follow`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to unfollow company');
      }
      return response.json();
    } catch (error) {
      console.error('Error unfollowing company:', error);
      throw error;
    }
  }

  async createCompanyAlert(alert: Omit<CompanyAlert, 'id' | 'createdAt'>) {
    try {
      const response = await fetch(`${this.baseUrl}/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alert),
      });
      if (!response.ok) {
        throw new Error('Failed to create company alert');
      }
      return response.json();
    } catch (error) {
      console.error('Error creating company alert:', error);
      throw error;
    }
  }

  async getCompanyAlerts(userId: number) {
    try {
      const response = await fetch(`${this.baseUrl}/alerts?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch company alerts');
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching company alerts:', error);
      return createMockResponse({ alerts: [] });
    }
  }

  async generateCompanySummary(companyId: number) {
    try {
      // This would integrate with an AI service like OpenAI or Anthropic
      const response = await fetch(`${this.baseUrl}/${companyId}/ai-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to generate company summary');
      }
      return response.json();
    } catch (error) {
      console.error('Error generating company summary:', error);
      // Return a mock AI summary
      return {
        summary: "This company is known for its innovative approach and strong company culture. They offer competitive benefits and are actively growing their team across multiple departments.",
        keyStrengths: ["Innovation", "Growth", "Culture", "Benefits"],
        matchScore: 85
      };
    }
  }

  async generateCoverLetter(companyId: number, jobId: number, userProfile: any) {
    try {
      const response = await fetch(`${this.baseUrl}/${companyId}/jobs/${jobId}/cover-letter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userProfile }),
      });
      if (!response.ok) {
        throw new Error('Failed to generate cover letter');
      }
      return response.json();
    } catch (error) {
      console.error('Error generating cover letter:', error);
      // Return a mock cover letter
      return {
        coverLetter: "Dear Hiring Manager,\n\nI am excited to apply for this position at your company. Based on my experience and skills, I believe I would be a great fit for your team...\n\nBest regards,\n[Your Name]",
        tips: ["Customize the greeting", "Highlight relevant experience", "Show enthusiasm for the company"]
      };
    }
  }
}

export const companyService = new CompanyService();