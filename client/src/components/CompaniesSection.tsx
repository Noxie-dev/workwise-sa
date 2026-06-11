import { useQuery } from '@tanstack/react-query';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import CompanyCard from './CompanyCard';
import { Skeleton } from '@/components/ui/skeleton';
import { type Company } from '@shared/schema';
import { mockCompanies, createMockResponse } from '@/services/mockData';

interface CompanyResponse {
  success: boolean;
  data: Company[];
}

const normalizeCompaniesResponse = (payload: Company[] | CompanyResponse): Company[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  return Array.isArray(payload.data) ? payload.data : [];
};

const CompaniesSection = () => {
  const {
    data: companies,
    isLoading,
    error,
  } = useQuery<Company[]>({
    queryKey: ['/api/companies'],
    queryFn: async () => {
      const useMockPublicData = import.meta.env.VITE_USE_MOCK_PUBLIC_DATA !== 'false';

      try {
        const response = await fetch('/api/companies');
        if (!response.ok) {
          throw new Error('Failed to fetch companies');
        }
        const payload = await response.json();
        return normalizeCompaniesResponse(payload);
      } catch (error) {
        if (import.meta.env.DEV && useMockPublicData) {
          console.warn('Falling back to mock companies data:', error);
          return normalizeCompaniesResponse(createMockResponse(mockCompanies));
        }

        throw error;
      }
    },
  });

  const normalizedCompanies = companies?.map(company => ({
    ...company,
    slug: company.slug || company.name.toLowerCase().replace(/\s+/g, '-'),
    openPositions: company.openPositions ?? 0,
  }));

  const renderCompanySkeleton = () =>
    Array(6)
      .fill(0)
      .map((_, i) => (
        <div key={i} className="w-40 flex flex-col items-center text-center">
          <Skeleton className="w-20 h-20 rounded-full mb-3" />
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-3 w-16" />
        </div>
      ));

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
              {isLoading
                ? renderCompanySkeleton()
                : normalizedCompanies?.map(company => (
                    <CompanyCard key={company.id} company={company} />
                  ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>
    </section>
  );
};

export default CompaniesSection;
