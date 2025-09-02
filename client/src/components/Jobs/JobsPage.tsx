import React, { useState } from 'react';
import { useJobPreviews, useJobDetails, useSubmitApplication, useFeaturedJobs } from '@/hooks/useJobs';
import type { JobPreview, JobSearchParams } from '@/types/jobs';

/**
 * Example Jobs page component demonstrating enhanced React Query hooks
 */
export default function JobsPage() {
  const [searchParams, setSearchParams] = useState<JobSearchParams>({
    page: 1,
    limit: 20,
  });

  // Fetch job previews with search and filtering
  const { 
    data: jobData, 
    isLoading, 
    error,
    isFetching 
  } = useJobPreviews(searchParams);

  // Fetch featured jobs for the sidebar
  const { data: featuredJobs } = useFeaturedJobs(6);

  const handleSearch = (query: string) => {
    setSearchParams(prev => ({ ...prev, query, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setSearchParams(prev => ({ ...prev, page }));
  };

  const handleFilterChange = (filters: Partial<JobSearchParams>) => {
    setSearchParams(prev => ({ ...prev, ...filters, page: 1 }));
  };

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 text-lg font-semibold mb-2">
          Failed to load jobs
        </div>
        <div className="text-gray-600">
          {error.message}
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Find Your Dream Job
          </h1>
          <p className="text-gray-600">
            Discover opportunities that match your skills and aspirations
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <SearchAndFilters 
            onSearch={handleSearch}
            onFilterChange={handleFilterChange}
            currentFilters={searchParams}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Loading State */}
            {isLoading && (
              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <JobCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Jobs List */}
            {!isLoading && jobData && (
              <div className="space-y-4">
                {jobData.jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {jobData && jobData.totalPages > 1 && (
              <Pagination 
                currentPage={jobData.page}
                totalPages={jobData.totalPages}
                onPageChange={handlePageChange}
                isLoading={isFetching}
              />
            )}

            {/* No Results */}
            {!isLoading && jobData && jobData.jobs.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-2">
                  No jobs found matching your criteria
                </div>
                <button 
                  onClick={() => setSearchParams({ page: 1, limit: 20 })}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <FeaturedJobsSidebar jobs={featuredJobs?.jobs || []} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Job Card Component
 */
function JobCard({ job }: { job: JobPreview }) {
  const { data: details } = useJobDetails(job.id);
  const applyMutation = useSubmitApplication();

  const handleApply = () => {
    // In a real app, you'd collect user information from a form
    applyMutation.mutate({
      jobId: job.id,
      coverLetter: 'I am interested in this position...',
      resumeUrl: 'https://example.com/resume.pdf',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {job.title}
          </h3>
          <div className="flex items-center text-gray-600 mb-2">
            <span className="font-medium">{job.company.name}</span>
            {job.company.location && (
              <>
                <span className="mx-2">•</span>
                <span>{job.company.location}</span>
              </>
            )}
          </div>
        </div>
        {job.featured && (
          <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            Featured
          </span>
        )}
      </div>

      <p className="text-gray-600 mb-4 line-clamp-2">
        {job.shortDescription}
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {job.tags.map((tag, index) => (
          <span 
            key={index}
            className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span>{job.jobType}</span>
          <span>•</span>
          <span>{job.workMode}</span>
          <span>•</span>
          <span>{job.experienceLevel}</span>
          {job.isRemote && (
            <>
              <span>•</span>
              <span className="text-green-600">Remote</span>
            </>
          )}
        </div>

        <button
          onClick={handleApply}
          disabled={applyMutation.isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {applyMutation.isPending ? 'Applying...' : 'Apply Now'}
        </button>
      </div>

      {/* Job Details (if authenticated and loaded) */}
      {details && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-2">Requirements</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {details.details.requirements.slice(0, 3).map((req, index) => (
              <li key={index} className="flex items-center">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></span>
                {req}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Search and Filters Component
 */
function SearchAndFilters({ 
  onSearch, 
  onFilterChange, 
  currentFilters 
}: { 
  onSearch: (query: string) => void;
  onFilterChange: (filters: Partial<JobSearchParams>) => void;
  currentFilters: JobSearchParams;
}) {
  const [searchQuery, setSearchQuery] = useState(currentFilters.query || '');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <form onSubmit={handleSearchSubmit} className="mb-4">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search jobs, companies, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Search
          </button>
        </div>
      </form>

      <div className="flex flex-wrap gap-4">
        <div>
          <label htmlFor="jobType" className="block text-sm font-medium text-gray-700 mb-1">
            Job Type
          </label>
          <select
            id="jobType"
            value={currentFilters.jobType || ''}
            onChange={(e) => onFilterChange({ jobType: e.target.value || undefined })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Job Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
          </select>
        </div>

        <div>
          <label htmlFor="workMode" className="block text-sm font-medium text-gray-700 mb-1">
            Work Mode
          </label>
          <select
            id="workMode"
            value={currentFilters.workMode || ''}
            onChange={(e) => onFilterChange({ workMode: e.target.value || undefined })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Work Modes</option>
            <option value="Remote">Remote</option>
            <option value="On-site">On-site</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </div>

        <div>
          <label htmlFor="experienceLevel" className="block text-sm font-medium text-gray-700 mb-1">
            Experience Level
          </label>
          <select
            id="experienceLevel"
            value={currentFilters.experienceLevel || ''}
            onChange={(e) => onFilterChange({ experienceLevel: e.target.value || undefined })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Experience Levels</option>
            <option value="entry">Entry Level</option>
            <option value="mid">Mid Level</option>
            <option value="senior">Senior Level</option>
          </select>
        </div>
      </div>
    </div>
  );
}

/**
 * Pagination Component
 */
function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  isLoading 
}: { 
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  
  return (
    <div className="flex justify-center items-center space-x-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || isLoading}
        className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        Previous
      </button>
      
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          disabled={isLoading}
          className={`px-3 py-2 border rounded-lg ${
            page === currentPage
              ? 'bg-blue-600 text-white border-blue-600'
              : 'border-gray-300 hover:bg-gray-50'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {page}
        </button>
      ))}
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || isLoading}
        className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        Next
      </button>
    </div>
  );
}

/**
 * Featured Jobs Sidebar
 */
function FeaturedJobsSidebar({ jobs }: { jobs: JobPreview[] }) {
  if (jobs.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Featured Jobs
      </h3>
      <div className="space-y-4">
        {jobs.map((job) => (
          <div key={job.id} className="border-b border-gray-100 pb-4 last:border-b-0">
            <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">
              {job.title}
            </h4>
            <p className="text-sm text-gray-600 mb-2">
              {job.company.name}
            </p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{job.location}</span>
              <span>{job.jobType}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Job Card Skeleton for Loading State
 */
function JobCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="h-6 bg-gray-200 rounded mb-2 w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
      </div>
      <div className="h-4 bg-gray-200 rounded mb-4 w-full"></div>
      <div className="flex gap-2 mb-4">
        <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
        <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
        <div className="h-6 w-14 bg-gray-200 rounded-full"></div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <div className="h-4 w-16 bg-gray-200 rounded"></div>
          <div className="h-4 w-20 bg-gray-200 rounded"></div>
          <div className="h-4 w-16 bg-gray-200 rounded"></div>
        </div>
        <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  );
}
