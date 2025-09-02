import React, { useState, useCallback, memo } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Eye, Calendar, MapPin, Building2 } from 'lucide-react';
import { JobPreview } from '../../../shared/job-types';
import { useAuth } from '@/hooks/useAuth';

/**
 * Props for the JobPreviewCard component
 */
interface JobPreviewCardProps {
  job: JobPreview;
  onClick?: () => void;
  showAuthPrompt?: boolean;
  className?: string;
}

/**
 * JobPreviewCard component displays a job preview with authentication prompts
 * for anonymous users and direct access for authenticated users
 */
const JobPreviewCard: React.FC<JobPreviewCardProps> = ({ 
  job, 
  onClick,
  showAuthPrompt = false,
  className = ''
}) => {
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  /**
   * Handle card click - either show auth prompt or navigate to details
   */
  const handleCardClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (onClick) {
      onClick();
    }
  }, [onClick]);

  /**
   * Format the posted date
   */
  const formatPostedDate = useCallback((date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  }, []);

  return (
    <Card 
      className={`bg-white rounded-lg shadow-card overflow-hidden job-preview-card transition-all duration-200 hover:shadow-lg cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      <CardHeader className="p-4 border-b border-border">
        <div className="flex justify-between items-start">
          <div className="flex items-center flex-1">
            <div className="w-12 h-12 rounded-md overflow-hidden bg-light flex-shrink-0 mr-3 flex items-center justify-center" 
                 aria-hidden="true">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg hover:text-primary transition-colors truncate">
                {job.title}
              </h3>
              <div className="flex items-center text-sm text-muted mt-1">
                <Building2 className="w-4 h-4 mr-1" />
                <span className="truncate">{job.company.name}</span>
                <span className="mx-2">•</span>
                <MapPin className="w-4 h-4 mr-1" />
                <span className="truncate">{job.location}</span>
              </div>
            </div>
          </div>
          
          {job.featured && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 ml-2">
              Featured
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="mb-3">
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {job.shortDescription}
          </p>
          
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="secondary" className="bg-blue-100 text-primary">
              {job.jobType}
            </Badge>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {job.workMode}
            </Badge>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              {job.experienceLevel}
            </Badge>
          </div>
          
          <div className="flex items-center text-xs text-muted mb-3">
            <Calendar className="w-3 h-3 mr-1" />
            <span>Posted {formatPostedDate(job.postedDate)}</span>
          </div>
        </div>

        {/* Authentication-based action buttons */}
        <div className="flex justify-between items-center">
          {showAuthPrompt && !user ? (
            <div className="flex-1">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 mb-2">
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <Lock className="w-4 h-4 mr-2 text-primary" />
                  <span>Sign up to view full details and apply</span>
                </div>
                <Button 
                  size="sm" 
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={(e) => {
                    e.stopPropagation();
                    // This will be handled by the parent component
                    if (onClick) onClick();
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Full Job Details
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center w-full">
              <div className="text-sm text-muted">
                {job.category.name}
              </div>
              <Link 
                href={`/jobs/${job.id}`} 
                className="text-primary hover:underline text-sm font-medium flex items-center"
                onClick={(e) => e.stopPropagation()}
              >
                <Eye className="w-4 h-4 mr-1" />
                View Details
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(JobPreviewCard);