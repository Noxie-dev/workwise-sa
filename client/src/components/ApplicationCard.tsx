import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  MapPin, 
  Building, 
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  Users,
  ExternalLink,
  MoreHorizontal
} from 'lucide-react';
import { JobApplication } from '@/services/jobApplicationService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Status configuration
const STATUS_CONFIG = {
  applied: { 
    label: 'Applied', 
    color: 'bg-blue-100 text-blue-800 border-blue-200', 
    icon: FileText,
    description: 'Application submitted'
  },
  reviewed: { 
    label: 'Under Review', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
    icon: Eye,
    description: 'Application being reviewed'
  },
  interview: { 
    label: 'Interview', 
    color: 'bg-purple-100 text-purple-800 border-purple-200', 
    icon: Users,
    description: 'Interview scheduled'
  },
  rejected: { 
    label: 'Rejected', 
    color: 'bg-red-100 text-red-800 border-red-200', 
    icon: XCircle,
    description: 'Application not successful'
  },
  hired: { 
    label: 'Hired', 
    color: 'bg-green-100 text-green-800 border-green-200', 
    icon: CheckCircle,
    description: 'Congratulations! You got the job'
  },
};

interface ApplicationCardProps {
  application: JobApplication;
  onViewDetails: () => void;
  onWithdraw?: (applicationId: number) => void;
  onUpdateNotes?: (applicationId: number, notes: string) => void;
  isWithdrawing?: boolean;
}

export default function ApplicationCard({ 
  application, 
  onViewDetails, 
  onWithdraw,
  onUpdateNotes,
  isWithdrawing = false
}: ApplicationCardProps) {
  const statusConfig = STATUS_CONFIG[application.status as keyof typeof STATUS_CONFIG];
  const StatusIcon = statusConfig?.icon || FileText;

  // Format dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate days since application
  const getDaysSinceApplication = () => {
    const appliedDate = new Date(application.appliedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - appliedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysSinceApplication = getDaysSinceApplication();

  // Get status-specific styling
  const getStatusStyling = () => {
    switch (application.status) {
      case 'hired':
        return 'border-l-4 border-l-green-500 bg-green-50/30';
      case 'interview':
        return 'border-l-4 border-l-purple-500 bg-purple-50/30';
      case 'reviewed':
        return 'border-l-4 border-l-yellow-500 bg-yellow-50/30';
      case 'rejected':
        return 'border-l-4 border-l-red-500 bg-red-50/30';
      default:
        return 'border-l-4 border-l-blue-500 bg-blue-50/30';
    }
  };

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${getStatusStyling()}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge 
                variant="outline" 
                className={`${statusConfig?.color || 'bg-gray-100 text-gray-800'} flex items-center gap-1`}
              >
                <StatusIcon className="h-3 w-3" />
                {statusConfig?.label || application.status}
              </Badge>
              <span className="text-sm text-gray-500">
                {daysSinceApplication === 0 ? 'Today' : 
                 daysSinceApplication === 1 ? 'Yesterday' : 
                 `${daysSinceApplication} days ago`}
              </span>
            </div>
            <CardTitle className="text-lg">
              Job Application #{application.jobId}
            </CardTitle>
            <CardDescription className="mt-1">
              {statusConfig?.description || 'Application status update'}
            </CardDescription>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onViewDetails}>
                <ExternalLink className="mr-2 h-4 w-4" />
                View Job Details
              </DropdownMenuItem>
              {application.status === 'applied' && onWithdraw && (
                <DropdownMenuItem 
                  onClick={() => onWithdraw(application.id)}
                  className="text-red-600"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Withdraw Application
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Application Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>Applied: {formatDate(application.appliedAt)}</span>
            </div>
            
            {application.updatedAt !== application.appliedAt && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Updated: {formatDateTime(application.updatedAt)}</span>
              </div>
            )}

            {application.coverLetter && (
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <FileText className="h-4 w-4 mt-0.5" />
                <span>Cover letter included</span>
              </div>
            )}

            {application.resumeUrl && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileText className="h-4 w-4" />
                <span>Resume attached</span>
              </div>
            )}
          </div>

          {/* Status-specific information */}
          <div className="space-y-3">
            {application.status === 'interview' && (
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 text-purple-800 font-medium mb-1">
                  <Users className="h-4 w-4" />
                  Interview Scheduled
                </div>
                <p className="text-sm text-purple-700">
                  Check your email for interview details
                </p>
              </div>
            )}

            {application.status === 'hired' && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-800 font-medium mb-1">
                  <CheckCircle className="h-4 w-4" />
                  Congratulations!
                </div>
                <p className="text-sm text-green-700">
                  You've been selected for this position
                </p>
              </div>
            )}

            {application.status === 'rejected' && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 text-red-800 font-medium mb-1">
                  <XCircle className="h-4 w-4" />
                  Application Not Successful
                </div>
                <p className="text-sm text-red-700">
                  Keep applying - your next opportunity awaits!
                </p>
              </div>
            )}

            {application.notes && (
              <div className="p-3 bg-gray-50 rounded-lg border">
                <div className="text-sm font-medium text-gray-700 mb-1">Notes:</div>
                <p className="text-sm text-gray-600">{application.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onViewDetails}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              View Job
            </Button>
            
            {application.status === 'applied' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onWithdraw?.(application.id)}
                disabled={isWithdrawing}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                {isWithdrawing ? 'Withdrawing...' : 'Withdraw'}
              </Button>
            )}
          </div>

          <div className="text-xs text-gray-500">
            Application ID: {application.id}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}