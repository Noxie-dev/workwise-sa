import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
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
  Star,
  FileText,
  Upload,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { JobWithDetails, JobApplicationInput, SuitabilityAnalysis } from '../../../shared/job-types';
import { tieredJobsService } from '@/services/tieredJobsService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import SuitabilityAnalysisComponent from '@/components/SuitabilityAnalysis';
import CoverLetterGenerator from '@/components/CoverLetterGenerator';
import { profileService } from '@/services/profileService';

/**
 * Job Application Form Page - Dedicated page for applying to jobs
 */
const JobApplication: React.FC = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [coverLetter, setCoverLetter] = useState('');
  const [notes, setNotes] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationProgress, setApplicationProgress] = useState(0);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [suitabilityAnalysis, setSuitabilityAnalysis] = useState<SuitabilityAnalysis | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showCoverLetterGenerator, setShowCoverLetterGenerator] = useState(false);

  const jobId = id ? parseInt(id) : null;

  // Fetch job details
  const { data: job, isLoading, error } = useQuery({
    queryKey: ['job-details', jobId],
    queryFn: () => jobId ? tieredJobsService.getJobDetails(jobId) : null,
    enabled: !!jobId && !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfile', user?.uid],
    queryFn: () => user?.uid ? profileService.getProfile(user.uid) : null,
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update user profile state when profile data changes
  useEffect(() => {
    if (profile) {
      setUserProfile(profile);
    }
  }, [profile]);

  // Apply for job mutation
  const applyMutation = useMutation({
    mutationFn: (applicationData: JobApplicationInput) => 
      tieredJobsService.applyForJob(applicationData),
    onSuccess: (data) => {
      toast({
        title: 'Application Submitted Successfully!',
        description: 'Your application has been sent to the employer. You can track its status in your application history.',
      });
      // Navigate to application history
      navigate('/applications');
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Application Failed',
        description: error.message,
      });
    },
  });

  // Calculate application progress
  useEffect(() => {
    let progress = 0;
    if (coverLetter.trim()) progress += 25;
    if (notes.trim()) progress += 15;
    if (resumeFile) progress += 25;
    if (user) progress += 15; // User is authenticated
    if (suitabilityAnalysis) progress += 10; // AI analysis completed
    if (showCoverLetterGenerator) progress += 10; // AI cover letter generated
    setApplicationProgress(progress);
  }, [coverLetter, notes, resumeFile, user, suitabilityAnalysis, showCoverLetterGenerator]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          variant: 'destructive',
          title: 'Invalid File Type',
          description: 'Please upload a PDF or Word document.',
        });
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'File Too Large',
          description: 'Please upload a file smaller than 5MB.',
        });
        return;
      }
      
      setResumeFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!jobId) return;
    
    setIsSubmitting(true);
    
    try {
      // TODO: Upload resume file to Firebase Storage if provided
      let resumeUrl: string | undefined;
      if (resumeFile) {
        // For now, we'll skip file upload and just include the filename
        // In a real implementation, you'd upload to Firebase Storage
        resumeUrl = `resume_${Date.now()}_${resumeFile.name}`;
      }
      
      applyMutation.mutate({
        jobId,
        coverLetter: coverLetter.trim() || undefined,
        resumeUrl,
        notes: notes.trim() || undefined,
      });
    } catch (error) {
      console.error('Error submitting application:', error);
    } finally {
      setIsSubmitting(false);
    }
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

  const handleAnalysisComplete = (analysis: SuitabilityAnalysis) => {
    setSuitabilityAnalysis(analysis);
    setShowAnalysis(true);
  };

  const handleCoverLetterGenerated = (generatedCoverLetter: string) => {
    setCoverLetter(generatedCoverLetter);
    setShowCoverLetterGenerator(true);
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
    <AuthGuard message="Please sign in to apply for jobs">
      <div className="min-h-screen bg-gray-50">
        {job && (
          <Helmet>
            <title>Apply for {job.title} at {job.company.name} | WorkWise SA</title>
            <meta name="description" content={`Apply for ${job.title} at ${job.company.name}`} />
          </Helmet>
        )}

        <div className="container mx-auto px-4 py-8">
          {/* Back button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/jobs/${jobId}`)}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Job Details
          </Button>

          {isLoading ? (
            <JobApplicationSkeleton />
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
              {/* Application Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Application Progress */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                      Application Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Progress value={applicationProgress} className="w-full" />
                      <p className="text-sm text-muted">
                        {applicationProgress}% complete - {applicationProgress >= 80 ? 'Ready to submit!' : 'Add more details to strengthen your application'}
                        {suitabilityAnalysis && (
                          <span className="block mt-1 text-blue-600">
                            ✨ AI analysis completed - your application is optimized!
                          </span>
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* AI-Powered Analysis */}
                {userProfile && (
                  <div className="space-y-6">
                    <SuitabilityAnalysisComponent
                      jobId={jobId.toString()}
                      userProfile={userProfile}
                      onAnalysisComplete={handleAnalysisComplete}
                    />
                    
                    {suitabilityAnalysis && (
                      <CoverLetterGenerator
                        jobId={jobId.toString()}
                        userProfile={userProfile}
                        jobTitle={job.title}
                        companyName={job.company.name}
                        suitabilityAnalysis={suitabilityAnalysis}
                        onCoverLetterGenerated={handleCoverLetterGenerated}
                      />
                    )}
                  </div>
                )}

                {/* Application Form */}
                <Card>
                  <CardHeader>
                    <CardTitle>Application Form</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Cover Letter */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="coverLetter">
                          Cover Letter <span className="text-muted">(Optional but recommended)</span>
                        </Label>
                        {showCoverLetterGenerator && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            <Sparkles className="w-3 h-3 mr-1" />
                            AI-Generated
                          </Badge>
                        )}
                      </div>
                      <Textarea
                        id="coverLetter"
                        placeholder="Tell the employer why you're interested in this position and what makes you a great fit..."
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        rows={8}
                        className="resize-none"
                      />
                      <p className="text-xs text-muted">
                        {coverLetter.length}/1000 characters
                      </p>
                    </div>

                    {/* Resume Upload */}
                    <div className="space-y-2">
                      <Label htmlFor="resume">
                        Resume/CV <span className="text-muted">(Optional)</span>
                      </Label>
                      <div className="flex items-center gap-4">
                        <Input
                          id="resume"
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileChange}
                          className="flex-1"
                        />
                        {resumeFile && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            {resumeFile.name}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted">
                        Accepted formats: PDF, DOC, DOCX (max 5MB)
                      </p>
                    </div>

                    {/* Additional Notes */}
                    <div className="space-y-2">
                      <Label htmlFor="notes">
                        Additional Notes <span className="text-muted">(Optional)</span>
                      </Label>
                      <Textarea
                        id="notes"
                        placeholder="Any additional information you'd like to share with the employer..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        className="resize-none"
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                      <Button 
                        onClick={handleSubmit}
                        disabled={isSubmitting || applicationProgress < 20}
                        className="w-full"
                        size="lg"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Submitting Application...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Submit Application
                          </>
                        )}
                      </Button>
                      
                      {applicationProgress < 20 && (
                        <Alert className="mt-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Please add a cover letter or upload a resume to submit your application.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Job Summary Sidebar */}
              <div className="space-y-6">
                {/* Job Header */}
                <Card>
                  <CardHeader>
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold mb-2">{job.title}</h2>
                        <div className="flex items-center space-x-4 text-muted mb-3">
                          <div className="flex items-center">
                            <Building2 className="w-4 h-4 mr-1" />
                            <span>{job.company.name}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            <span>{job.location}</span>
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
                  </CardHeader>
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

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-muted" />
                        <span className="text-sm">Posted</span>
                      </div>
                      <span className="text-sm font-medium">{formatPostedDate(job.postedDate)}</span>
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

                {/* Application Tips */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Application Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm space-y-2">
                      <p>• Customize your cover letter for this specific role</p>
                      <p>• Highlight relevant experience and skills</p>
                      <p>• Keep your resume up to date and error-free</p>
                      <p>• Show enthusiasm for the company and position</p>
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
 * Skeleton loader for job application page
 */
const JobApplicationSkeleton: React.FC = () => (
  <div className="grid lg:grid-cols-3 gap-8">
    <div className="lg:col-span-2 space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2" />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    </div>
    
    <div className="space-y-6">
      {Array(3).fill(0).map((_, i) => (
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

export default JobApplication;