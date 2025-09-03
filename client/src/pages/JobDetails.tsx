import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import AuthGuard from '@/components/AuthGuard';
import { 
  MapPin, 
  Building2, 
  Clock, 
  DollarSign, 
  Users, 
  Calendar, 
  Briefcase, 
  CheckCircle, 
  Send,
  ArrowLeft,
  ExternalLink,
  Star
} from 'lucide-react';
import { JobWithDetails, JobApplicationInput } from '../../../shared/job-types';
import { tieredJobsService } from '@/services/tieredJobsService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

/**
 * Job Details page - shows full job information for authenticated users
 */
const JobDetails: React.FC = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');

  const jobId = id ? parseInt(id) : null;

  // Fetch job details
  const { data: job, isLoading, error } = useQuery({
    queryKey: ['job-details', jobId],
    queryFn: () => jobId ? tieredJobsService.getJobDetails(jobId) : null,
    enabled: !!jobId && !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Apply for job mutation
  const applyMutation = useMutation({
    mutationFn: (applicationData: JobApplicationInput) => 
      tieredJobsService.applyForJob(applicationData),
    onSuccess: (data) => {
      toast({
        title: 'Application Submitted!',
        description: data.message,
      });
      setIsApplicationModalOpen(false);
      setCoverLetter('');
      // Invalidate user applications query
      queryClient.invalidateQueries({ queryKey: ['user-applications'] });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Application Failed',
        description: error.message,
      });
    },
  });

  const handleApply = () => {
    if (!jobId) return;
    
    applyMutation.mutate({
      jobId,
      coverLetter: coverLetter.trim() || undefined,
    });
  };

  const formatPostedDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  if (!jobId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Job ID</h1>
          <Button onClick={() => navigate('/jobs')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard message="Please sign in to view full job details">
      <div className="min-h-screen bg-gray-50">
        {job && (
          <Helmet>
            <title>{job.title} at {job.company.name} | WorkWise SA</title>
            <meta name="description" content={job.shortDescription} />
          </Helmet>
        )}

        <div className="container mx-auto px-4 py-8">
          {/* Back button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate('/jobs')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>

          {isLoading ? (
            <JobDetailsSkeleton />
          ) : error ? (
            <div className="text-center p-8 bg-white rounded-lg shadow">
              <h2 className="text-xl font-bold text-red-600 mb-4">Failed to Load Job</h2>
              <p className="text-muted mb-4">
                {error instanceof Error ? error.message : 'Something went wrong'}
              </p>
              <Button onClick={() => navigate('/jobs')}>
                Back to Jobs
              </Button>
            </div>
          ) : job ? (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Job Header */}
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                          <h1 className="text-2xl font-bold mb-2">{job.title}</h1>
                          <div className="flex items-center space-x-4 text-muted mb-3">
                            <div className="flex items-center">
                              <Building2 className="w-4 h-4 mr-1" />
                              <span>{job.company.name}</span>
                            </div>
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              <span>{job.location}</span>
                            </div>
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              <span>Posted {formatPostedDate(job.postedDate)}</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="bg-blue-100 text-primary">
                              {job.jobType}
                            </Badge>
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              {job.workMode}
                            </Badge>
                            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                              {job.experienceLevel}
                            </Badge>
                            {job.featured && (
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                <Star className="w-3 h-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Job Description */}
                <Card>
                  <CardHeader>
                    <CardTitle>Job Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      <p className="whitespace-pre-wrap">{job.details.fullDescription}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Requirements */}
                <Card>
                  <CardHeader>
                    <CardTitle>Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {job.details.requirements.map((requirement, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                          <span>{requirement}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Responsibilities */}
                <Card>
                  <CardHeader>
                    <CardTitle>Responsibilities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {job.details.responsibilities.map((responsibility, index) => (
                        <li key={index} className="flex items-start">
                          <Briefcase className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                          <span>{responsibility}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Benefits */}
                <Card>
                  <CardHeader>
                    <CardTitle>Benefits & Perks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {job.details.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start">
                          <Star className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Apply Button */}
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={() => navigate(`/jobs/${jobId}/apply`)}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Apply for this Job
                    </Button>
                    
                    <div className="text-center">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsApplicationModalOpen(true)}
                        className="text-sm"
                      >
                        Quick Apply (Modal)
                      </Button>
                    </div>
                    
                    <Dialog open={isApplicationModalOpen} onOpenChange={setIsApplicationModalOpen}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Quick Apply for {job.title}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              Cover Letter (Optional)
                            </label>
                            <Textarea
                              placeholder="Tell us why you're interested in this position..."
                              value={coverLetter}
                              onChange={(e) => setCoverLetter(e.target.value)}
                              rows={6}
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              onClick={() => setIsApplicationModalOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleApply}
                              disabled={applyMutation.isPending}
                            >
                              {applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>

                {/* Job Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Job Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-muted" />
                        <span className="text-sm">Job Type</span>
                      </div>
                      <span className="text-sm font-medium">{job.jobType}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2 text-muted" />
                        <span className="text-sm">Work Mode</span>
                      </div>
                      <span className="text-sm font-medium">{job.workMode}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-muted" />
                        <span className="text-sm">Location</span>
                      </div>
                      <span className="text-sm font-medium">{job.location}</span>
                    </div>

                    {job.details.salaryDetails && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-2 text-muted" />
                          <span className="text-sm">Salary</span>
                        </div>
                        <span className="text-sm font-medium">
                          {job.details.salaryDetails.displayText}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Company Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>About {job.company.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted">
                      {job.details.companyDetails.about}
                    </p>
                    
                    {job.details.companyDetails.website && (
                      <a 
                        href={job.details.companyDetails.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-primary hover:underline"
                      >
                        Visit Company Website
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    )}

                    <Separator />
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted">Industry</span>
                        <span>{job.details.companyDetails.industry}</span>
                      </div>
                      {job.details.companyDetails.size && (
                        <div className="flex justify-between">
                          <span className="text-muted">Company Size</span>
                          <span>{job.details.companyDetails.size}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </AuthGuard>
  );
};

/**
 * Skeleton loader for job details
 */
const JobDetailsSkeleton: React.FC = () => (
  <div className="grid lg:grid-cols-3 gap-8">
    <div className="lg:col-span-2 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start space-x-4">
            <Skeleton className="w-16 h-16 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-3" />
              <div className="flex space-x-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      {Array(4).fill(0).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
    
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
      
      {Array(2).fill(0).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default JobDetails;