import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { jobsService } from '@/services/jobsService';
import { useToast } from '@/hooks/use-toast';

// UI Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

// Icons
import {
  MapPin,
  Clock,
  DollarSign,
  Building,
  Users,
  Heart,
  Share2,
  ArrowLeft,
  Briefcase,
  Calendar,
  Phone,
  Mail,
  Globe,
  Star,
  BookmarkPlus,
  Send,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

// Types
import { JobWithCompany } from '@shared/schema';

interface JobDetailsPageProps {}

const JobDetails: React.FC<JobDetailsPageProps> = () => {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [isFavorited, setIsFavorited] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  // Fetch job details
  const {
    data: job,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobsService.getJobById(parseInt(id!)),
    enabled: !!id && !isNaN(parseInt(id!)),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Check if user has applied for this job
  useEffect(() => {
    const checkApplicationStatus = async () => {
      if (currentUser && job) {
        try {
          // TODO: Implement API call to check application status
          // const hasApplied = await applicationService.hasApplied(job.id);
          // setHasApplied(hasApplied);
        } catch (error) {
          console.error('Error checking application status:', error);
        }
      }
    };

    checkApplicationStatus();
  }, [currentUser, job]);

  // Handle favorite toggle
  const handleFavoriteToggle = async () => {
    if (!currentUser) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to save jobs to your favorites.',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    if (!job) return;

    try {
      const newFavoriteState = !isFavorited;
      setIsFavorited(newFavoriteState);
      
      await jobsService.toggleFavorite(job.id, newFavoriteState);
      
      toast({
        title: newFavoriteState ? 'Job Saved!' : 'Job Removed',
        description: newFavoriteState 
          ? 'This job has been added to your favorites.' 
          : 'This job has been removed from your favorites.',
      });
    } catch (error) {
      // Revert state on error
      setIsFavorited(!isFavorited);
      toast({
        title: 'Error',
        description: 'Failed to update favorites. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle job application
  const handleApply = async () => {
    if (!currentUser) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to apply for jobs.',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    if (!job) return;

    setIsApplying(true);
    
    try {
      // TODO: Navigate to application form or open application modal
      navigate(`/jobs/${job.id}/apply`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start application process. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsApplying(false);
    }
  };

  // Handle share
  const handleShare = async () => {
    if (!job) return;

    const shareData = {
      title: `${job.title} at ${job.company.name}`,
      text: `Check out this job opportunity: ${job.title} at ${job.company.name}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: 'Link Copied!',
          description: 'Job link has been copied to your clipboard.',
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: 'Share Failed',
        description: 'Unable to share this job. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle navigation back
  const handleGoBack = () => {
    navigate('/jobs');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-6">
            <Skeleton className="h-8 w-32" />
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-6 w-1/2" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-16 w-16 rounded-lg" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error ? 'Failed to load job details. Please try again later.' : 'Job not found.'}
            </AlertDescription>
          </Alert>
          <div className="mt-6">
            <Button onClick={handleGoBack} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Calculate days ago
  const getDaysAgo = (dateString: string) => {
    const jobDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - jobDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <>
      <Helmet>
        <title>{job.title} at {job.company.name} | WorkWise SA</title>
        <meta name="description" content={job.description.substring(0, 160)} />
        <meta property="og:title" content={`${job.title} at ${job.company.name}`} />
        <meta property="og:description" content={job.description.substring(0, 160)} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <Button
              onClick={handleGoBack}
              variant="ghost"
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Job Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Job Header Card */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {job.company.logo ? (
                          <img
                            src={job.company.logo}
                            alt={`${job.company.name} logo`}
                            className="h-12 w-12 rounded-lg object-contain border"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Building className="h-6 w-6 text-gray-500" />
                          </div>
                        )}
                        <div>
                          <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                          <p className="text-lg text-gray-600">{job.company.name}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {job.location}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {job.jobType}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {job.workMode}
                        </Badge>
                        {job.salary && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {job.salary}
                          </Badge>
                        )}
                        {job.isFeatured && (
                          <Badge variant="default" className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            Featured
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-2" />
                        Posted {getDaysAgo(job.createdAt)} • {formatDate(job.createdAt)}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleApply}
                      disabled={isApplying || hasApplied}
                      className="flex-1"
                    >
                      {isApplying ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : hasApplied ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Applied
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Apply Now
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={handleFavoriteToggle}
                      variant="outline"
                      size="icon"
                    >
                      <Heart className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                    
                    <Button
                      onClick={handleShare}
                      variant="outline"
                      size="icon"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {hasApplied && (
                    <Alert className="mt-4">
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        You have already applied for this position. Check your application status in your dashboard.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Job Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Job Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                      {job.description}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Company Information */}
              <Card>
                <CardHeader>
                  <CardTitle>About {job.company.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {job.company.logo ? (
                          <img
                            src={job.company.logo}
                            alt={`${job.company.name} logo`}
                            className="h-16 w-16 rounded-lg object-contain border"
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Building className="h-8 w-8 text-gray-500" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-lg">{job.company.name}</h3>
                          {job.company.location && (
                            <p className="text-gray-600 flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {job.company.location}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {job.company.openPositions && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-700">
                          <Users className="h-4 w-4 inline mr-2" />
                          {job.company.openPositions} open positions at this company
                        </p>
                      </div>
                    )}

                    <div className="flex gap-4 pt-4">
                      <Button variant="outline" size="sm">
                        <Building className="h-4 w-4 mr-2" />
                        View Company Profile
                      </Button>
                      <Button variant="outline" size="sm">
                        <Briefcase className="h-4 w-4 mr-2" />
                        More Jobs from {job.company.name}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={handleApply}
                    disabled={isApplying || hasApplied}
                    className="w-full"
                  >
                    {hasApplied ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Applied
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Apply Now
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleFavoriteToggle}
                    variant="outline"
                    className="w-full"
                  >
                    <BookmarkPlus className="h-4 w-4 mr-2" />
                    {isFavorited ? 'Saved' : 'Save Job'}
                  </Button>
                  
                  <Button
                    onClick={handleShare}
                    variant="outline"
                    className="w-full"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Job
                  </Button>
                </CardContent>
              </Card>

              {/* Job Details Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Job Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Job Type</span>
                      <Badge variant="outline">{job.jobType}</Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Work Mode</span>
                      <Badge variant="outline">{job.workMode}</Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Location</span>
                      <span className="text-sm font-medium">{job.location}</span>
                    </div>
                    
                    {job.salary && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Salary</span>
                        <span className="text-sm font-medium">{job.salary}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Posted</span>
                      <span className="text-sm font-medium">{getDaysAgo(job.createdAt)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Help & Support */}
              <Card>
                <CardHeader>
                  <CardTitle>Need Help?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Phone className="h-4 w-4 mr-2" />
                    Contact Support
                  </Button>
                  
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Globe className="h-4 w-4 mr-2" />
                    Application Tips
                  </Button>
                  
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Mail className="h-4 w-4 mr-2" />
                    Report Issue
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default JobDetails;
