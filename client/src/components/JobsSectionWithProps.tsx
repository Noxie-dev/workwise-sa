import React from 'react';
import { Link } from 'wouter';
import JobCard from './JobCard';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { type JobWithCompany } from '@shared/schema';

interface JobsSectionProps {
  featuredJobs: JobWithCompany[] | Record<string, JobWithCompany> | null | undefined;
}

/**
 * JobsSection component that accepts featuredJobs as a prop
 * Can handle both array and object formats of job data
 */
const JobsSection: React.FC<JobsSectionProps> = ({ featuredJobs }) => {
  // Check if featuredJobs is an object
  const featuredJobsArray =
    typeof featuredJobs === "object" && featuredJobs !== null
      ? Array.isArray(featuredJobs)
        ? featuredJobs // Already an array
        : Object.values(featuredJobs) // Convert object to array of values
      : []; // If not an object or null, use an empty array

  return (
    <section className="py-10 md:py-16 bg-light">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Featured Opportunities</h2>
          <p className="text-muted">Discover top employment opportunities from leading companies in South Africa</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredJobsArray.length === 0 ? (
            <div className="col-span-full text-center text-muted">
              No featured jobs available at the moment.
            </div>
          ) : (
            featuredJobsArray.map((job) => (
              <JobCard key={job.id} job={job} />
            ))
          )}
        </div>

        <div className="text-center mt-10">
          <Button
            variant="outline"
            asChild
            className="inline-flex items-center justify-center border-primary text-primary hover:bg-primary hover:text-white"
          >
            <Link href="/jobs">
              Browse All Jobs <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default JobsSection;
