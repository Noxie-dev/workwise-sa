import React, { useState, useCallback, memo } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { JobWithCompany } from '../../../shared/schema';

/**
 * Work mode types for job listings
 */
type WorkMode = 'remote' | 'hybrid' | 'on-site';

/**
 * Props for the JobCard component
 */
interface JobCardProps {
  job: JobWithCompany;
  onFavoriteToggle?: (jobId: number, isFavorite: boolean) => void;
  initialFavoriteState?: boolean;
  className?: string;
}

/**
 * JobCard component displays a job listing with company information
 * and allows users to favorite the job
 */
const JobCard: React.FC<JobCardProps> = ({ 
  job, 
  onFavoriteToggle,
  initialFavoriteState = false,
  className = ''
}) => {
  const [isFavorite, setIsFavorite] = useState<boolean>(initialFavoriteState);

  /**
   * Toggles the favorite status of a job
   */
  const toggleFavorite = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const newFavoriteStatus = !isFavorite;
    setIsFavorite(newFavoriteStatus);

    // Call the callback if provided
    if (onFavoriteToggle) {
      onFavoriteToggle(job.id, newFavoriteStatus);
    }
  }, [isFavorite, job.id, onFavoriteToggle]);

  /**
   * Determines the CSS class for the work mode badge
   */
  const getWorkModeBadgeClass = useCallback((workMode?: string): string => {
    // Default to 'on-site' if workMode is undefined or null
    if (!workMode) {
      return 'bg-purple-100 text-purple-800';
    }

    switch (workMode.toLowerCase() as WorkMode) {
      case 'remote':
        return 'bg-green-100 text-green-800';
      case 'hybrid':
        return 'bg-yellow-100 text-yellow-800';
      case 'on-site':
      default:
        return 'bg-purple-100 text-purple-800';
    }
  }, []);

  return (
    <Card className={`bg-white rounded-lg shadow-card overflow-hidden job-card ${className}`}>
      <CardHeader className="p-4 border-b border-border">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-md overflow-hidden bg-light flex-shrink-0 mr-3 flex items-center justify-center" 
                 aria-hidden="true">
              <span className="text-xl font-bold text-primary">
                {job.company?.name ? job.company.name.charAt(0) : 'C'}
              </span>
            </div>
            <div>
              <Link href={`/jobs/${job.id}`}>
                <h3 className="font-semibold text-lg hover:text-primary cursor-pointer transition-colors">{job.title}</h3>
              </Link>
              <p className="text-sm text-muted">
                {job.company?.name ? `${job.company.name} - ` : ''}{job.location}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={`${isFavorite ? 'text-primary' : 'text-gray-400'} hover:text-primary hover:bg-transparent`}
            onClick={toggleFavorite}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={isFavorite}
          >
            <span className={`h-5 w-5 ${isFavorite ? 'text-primary fill-current' : 'text-gray-400'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="mb-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-blue-100 text-primary">
              {job.jobType || 'Full-time'}
            </Badge>
            <Badge variant="secondary" className={getWorkModeBadgeClass(job.workMode)}>
              {job.workMode || 'On-site'}
            </Badge>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <p className="font-medium text-green-600">{job.salary}</p>
          <Link href={`/jobs/${job.id}`} className="text-primary hover:underline text-sm font-medium">
            View details
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(JobCard);
