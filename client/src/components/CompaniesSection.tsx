import { useQuery } from '@tanstack/react-query';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import CompanyCard from './CompanyCard';
import { Skeleton } from '@/components/ui/skeleton';
import { type Company } from '@shared/schema';
import { mockCompanies, createMockResponse } from '@/services/mockData';
import { buildApiUrl, shouldUseMockData } from '@/config/api';

interface CompanyResponse {
  success: boolean;
  data: Company[];
}

const CompaniesSection = () => {
  const { data: companiesResponse, isLoading, error } = useQuery<CompanyResponse>({
    queryKey: ['/api/companies'],
    queryFn: async () => {
      // Always use mock data in production or if we're on Netlify
      if (shouldUseMockData()) {
        console.log('Using mock companies data in production or Netlify environment');
        return createMockResponse(mockCompanies);
      }

      // In development, make the actual API call
      try {
        const response = await fetch(buildApiUrl('/api/companies'));
        if (!response.ok) {
          throw new Error('Failed to fetch companies');
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching companies:', error);
        // Fallback to mock data if API call fails
        return createMockResponse(mockCompanies);
      }
    }
  });

  // Extract the companies array from the response and map to the expected format
  const companies = companiesResponse?.data?.map(company => ({
    ...company,
    slug: company.name.toLowerCase().replace(/\s+/g, '-'), // Generate slug from name
    openPositions: 5 // Default value for open positions
  }));

  const renderCompanySkeleton = () => (
    Array(6).fill(0).map((_, i) => (
      <div key={i} className="w-40 flex flex-col items-center text-center">
        <Skeleton className="w-20 h-20 rounded-full mb-3" />
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-3 w-16" />
      </div>
    ))
  );

  if (error) {
    return (
      <section className="py-10 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center text-red-500">
            Failed to load companies. Please try again later.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 md:py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Top Companies Hiring</h2>
          <p className="text-muted">Join prestigious organizations looking for talent like yours</p>
        </div>

        <div className="relative">
          <ScrollArea className="w-full pb-4 top-companies-slider touch-pan-x">
            <div className="flex space-x-4 md:space-x-6 min-w-max px-4 md:px-0">
              {isLoading ? renderCompanySkeleton() : (
                companies?.map((company) => (
                  <CompanyCard key={company.id} company={company} />
                ))
              )}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>
    </section>
  );
};

export default CompaniesSection;
