import React from 'react';

interface RelatedCardProps {
  title: string;
  description: string;
  href: string;
}

// Related resources card component
const RelatedCard = ({ title, description, href }: RelatedCardProps) => (
  <a
    href={href}
    className="block p-4 bg-white dark:bg-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-600"
  >
    <h3 className="font-medium text-lg mb-2 dark:text-white">{title}</h3>
    <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>
  </a>
);

const RelatedResourcesSection = () => {
  return (
    <div className="mt-12 bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
      <h2 className="text-xl font-semibold mb-4 dark:text-white">Related Resources</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RelatedCard
          title="Latest Job Market Trends"
          description="Discover the latest trends in South Africa's job market for 2025."
          href="/blog/job-market-trends"
        />
        <RelatedCard
          title="Industry Salary Guide"
          description="Compare salaries across different industries in South Africa."
          href="/resources/salary-guide"
        />
        <RelatedCard
          title="Free Skills Workshops"
          description="Register for our upcoming free skills development workshops."
          href="/events"
        />
      </div>
    </div>
  );
};

export default RelatedResourcesSection;
