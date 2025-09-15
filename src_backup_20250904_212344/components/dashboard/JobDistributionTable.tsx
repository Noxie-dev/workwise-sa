// src/components/dashboard/JobDistributionTable.tsx
import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '../ui/dropdown-menu';
import { MoreVertical, Eye, Edit, Send, Trash } from 'lucide-react';
import { PriorityIndicator } from './PriorityIndicator';
import { JobDistributionData } from '../../types/dashboard';
import { dashboardService } from '../../services/dashboardService';
import { useToast } from '../ui/use-toast';

interface JobDistributionTableProps {
  jobs: JobDistributionData[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const JobDistributionTable: React.FC<JobDistributionTableProps> = ({
  jobs,
  isLoading,
  onRefresh
}) => {
  const { toast } = useToast();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'queued':
        return 'outline';
      case 'in_progress':
        return 'default';
      case 'distributed':
        return 'success';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const viewJobDetails = (jobId: number) => {
    // Navigate to job details page or open modal
    console.log('View job details:', jobId);
    toast({
      title: "Job Details",
      description: `Viewing details for job #${jobId}`,
    });
  };

  const editJobPriority = async (jobId: number) => {
    // In a real app, this would open a modal for editing
    const newPriority = prompt('Enter new priority (1-5):', '3');
    if (newPriority && !isNaN(parseInt(newPriority)) && parseInt(newPriority) >= 1 && parseInt(newPriority) <= 5) {
      try {
        await dashboardService.updateJobPriority(jobId, parseInt(newPriority));
        toast({
          title: "Priority Updated",
          description: `Job #${jobId} priority set to ${newPriority}`,
        });
        onRefresh();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update job priority",
          variant: "destructive",
        });
      }
    }
  };

  const distributeJob = async (jobId: number) => {
    try {
      await dashboardService.distributeJob(jobId);
      toast({
        title: "Distribution Initiated",
        description: `Job #${jobId} distribution process started`,
      });
      onRefresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to distribute job",
        variant: "destructive",
      });
    }
  };

  const removeFromQueue = async (jobId: number) => {
    try {
      await dashboardService.removeFromQueue(jobId);
      toast({
        title: "Removed from Queue",
        description: `Job #${jobId} removed from distribution queue`,
      });
      onRefresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove job from queue",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="py-10 text-center">Loading job distribution data...</div>;
  }

  if (!jobs || jobs.length === 0) {
    return <div className="py-10 text-center">No jobs found matching the current filters.</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Job Title</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.map((job) => (
          <TableRow key={job.id}>
            <TableCell className="font-medium">{job.jobTitle}</TableCell>
            <TableCell>{job.companyName}</TableCell>
            <TableCell>{job.categoryName}</TableCell>
            <TableCell>
              <Badge variant={getStatusVariant(job.status)}>
                {job.status}
              </Badge>
            </TableCell>
            <TableCell>
              <PriorityIndicator priority={job.priority} />
            </TableCell>
            <TableCell>{formatDate(job.createdAt)}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => viewJobDetails(job.jobId)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => editJobPriority(job.jobId)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Priority
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => distributeJob(job.jobId)}>
                    <Send className="h-4 w-4 mr-2" />
                    Distribute Now
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => removeFromQueue(job.jobId)} className="text-red-600">
                    <Trash className="h-4 w-4 mr-2" />
                    Remove from Queue
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
