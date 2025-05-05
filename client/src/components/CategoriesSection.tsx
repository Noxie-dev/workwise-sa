import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import CategoryCard from './CategoryCard';
import { Skeleton } from '@/components/ui/skeleton';
import { type Category } from '@shared/schema';
import { mockCategories, createMockResponse } from '@/services/mockData';

interface CategoryResponse {
  success: boolean;
  data: Category[];
}

const CategoriesSection = () => {
  const { data: categoriesResponse, isLoading, error } = useQuery<CategoryResponse>({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      // In production, use mock data to avoid API calls
      if (import.meta.env.PROD) {
        return createMockResponse(mockCategories);
      }

      // In development, make the actual API call
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Fallback to mock data if API call fails
        return createMockResponse(mockCategories);
      }
    }
  });

  // Extract the categories array from the response and map to the expected format
  const categories = categoriesResponse?.data?.map(category => ({
    ...category,
    jobCount: category.count, // Map count to jobCount
    icon: category.icon || 'briefcase' // Provide a default icon
  }));

  const renderCategorySkeleton = () => (
    Array(5).fill(0).map((_, i) => (
      <div key={i} className="bg-light rounded-lg p-4 text-center">
        <div className="flex flex-col items-center">
          <Skeleton className="h-14 w-14 rounded-full mb-3" />
          <Skeleton className="h-5 w-24 mb-1" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    ))
  );

  if (error) {
    return (
      <section className="py-10 md:py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center text-red-500">
            Failed to load categories. Please try again later.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 md:py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Explore Job Categories</h2>
          <Link href="/categories" className="text-primary hover:underline font-medium">
            View All
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {isLoading ? renderCategorySkeleton() : (
            Array.isArray(categories) && categories.length > 0 ? (
              categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500">
                No categories found.
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
