import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  CheckCircle, 
  AlertCircle, 
  Lightbulb,
  Users,
  Star,
  MapPin,
  GraduationCap,
  Briefcase,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { SuitabilityAnalysis as SuitabilityAnalysisType } from '../../../shared/job-types';
import { coverLetterApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { CompetitionLevelDisplay, CompetitionLevelColors } from '@/lib/constants';

interface SuitabilityAnalysisProps {
  jobId: string;
  userProfile: any;
  onAnalysisComplete?: (analysis: SuitabilityAnalysisType) => void;
  className?: string;
}

/**
 * Suitability Analysis Component
 * Analyzes user's fit for a specific job and provides insights
 */
const SuitabilityAnalysis: React.FC<SuitabilityAnalysisProps> = ({
  jobId,
  userProfile,
  onAnalysisComplete,
  className = ''
}) => {
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<SuitabilityAnalysisType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const analyzeSuitability = async () => {
    if (!userProfile || !jobId) return;

    setIsLoading(true);
    try {
      const request = {
        jobId,
        userProfile: {
          id: userProfile.id || 'user',
          firstName: userProfile.personal?.fullName?.split(' ')[0] || 'User',
          lastName: userProfile.personal?.fullName?.split(' ').slice(1).join(' ') || '',
          email: userProfile.email || '',
          skills: userProfile.skills?.skills || [],
          experience: userProfile.experience?.hasExperience ? [{
            title: userProfile.experience.jobTitle || '',
            company: userProfile.experience.employer || '',
            description: userProfile.experience.jobDescription || '',
            startDate: userProfile.experience.startDate,
            endDate: userProfile.experience.endDate,
            current: userProfile.experience.currentlyEmployed
          }] : [],
          education: userProfile.education?.highestEducation ? [{
            degree: userProfile.education.highestEducation,
            institution: userProfile.education.schoolName,
            year: userProfile.education.yearCompleted || '',
            field: userProfile.education.fieldOfStudy
          }] : [],
          summary: userProfile.personal?.bio || '',
          location: userProfile.personal?.location || '',
          phone: userProfile.personal?.phoneNumber || ''
        }
      };

      const [analysisData, error] = await coverLetterApi.analyzeSuitability(request);
      
      if (error) {
        throw new Error(error.message);
      }

      if (analysisData) {
        setAnalysis(analysisData);
        setHasAnalyzed(true);
        onAnalysisComplete?.(analysisData);
        
        toast({
          title: "Analysis Complete",
          description: "Your suitability analysis has been generated successfully.",
        });
      }
    } catch (error: any) {
      console.error('Failed to analyze suitability:', error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: error.message || "Could not analyze your suitability for this job. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success-dark';
    if (score >= 60) return 'text-warning-dark';
    return 'text-destructive-dark';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-success-light';
    if (score >= 60) return 'bg-warning-light';
    return 'bg-destructive-light';
  };

  const getCompetitionLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-success-light text-success-dark';
      case 'medium': return 'bg-warning-light text-warning-dark';
      case 'high': return 'bg-destructive-light text-destructive-dark';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getCompetitionIcon = (level: string) => {
    switch (level) {
      case 'low': return <TrendingDown className="w-4 h-4" />;
      case 'medium': return <Target className="w-4 h-4" />;
      case 'high': return <TrendingUp className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  if (!hasAnalyzed && !isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Job Suitability Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Analyze Your Fit</h3>
            <p className="text-gray-600 mb-6">
              Get AI-powered insights about how well your profile matches this job opportunity.
            </p>
            <Button onClick={analyzeSuitability} disabled={!userProfile}>
              <Sparkles className="w-4 h-4 mr-2" />
              Analyze Suitability
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary animate-spin" />
            Analyzing Suitability...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="grid grid-cols-2 gap-4 mt-6">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) return null;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Suitability Analysis
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={analyzeSuitability}
            disabled={isLoading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${getScoreBgColor(analysis.overallScore)} mb-4`}>
            <span className={`text-2xl font-bold ${getScoreColor(analysis.overallScore)}`}>
              {analysis.overallScore}%
            </span>
          </div>
          <h3 className="text-lg font-semibold mb-2">Overall Match Score</h3>
          <p className="text-gray-600">{analysis.estimatedChances}% chance of success</p>
        </div>

        {/* Breakdown */}
        <div className="space-y-4">
          <h4 className="font-medium">Match Breakdown</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm">Skills</span>
                </div>
                <span className="text-sm font-medium">{analysis.breakdown.skillsMatch}%</span>
              </div>
              <Progress value={analysis.breakdown.skillsMatch} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Experience</span>
                </div>
                <span className="text-sm font-medium">{analysis.breakdown.experienceMatch}%</span>
              </div>
              <Progress value={analysis.breakdown.experienceMatch} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Education</span>
                </div>
                <span className="text-sm font-medium">{analysis.breakdown.educationMatch}%</span>
              </div>
              <Progress value={analysis.breakdown.educationMatch} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-500" />
                  <span className="text-sm">Location</span>
                </div>
                <span className="text-sm font-medium">{analysis.breakdown.locationMatch}%</span>
              </div>
              <Progress value={analysis.breakdown.locationMatch} className="h-2" />
            </div>
          </div>
        </div>

        {/* Competition Level */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            {getCompetitionIcon(analysis.competitionLevel)}
            <span className="font-medium">Competition Level</span>
          </div>
          <Badge className={CompetitionLevelColors[analysis.competitionLevel]}>
            {CompetitionLevelDisplay[analysis.competitionLevel]}
          </Badge>
        </div>

        {/* Strengths */}
        {analysis.strengths.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Your Strengths
            </h4>
            <div className="flex flex-wrap gap-2">
              {analysis.strengths.map((strength, index) => (
                <Badge key={index} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {strength}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Gaps */}
        {analysis.gaps.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              Areas to Improve
            </h4>
            <div className="flex flex-wrap gap-2">
              {analysis.gaps.map((gap, index) => (
                <Badge key={index} variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  {gap}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {analysis.recommendations.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-blue-500" />
              Recommendations
            </h4>
            <ul className="space-y-2">
              {analysis.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                  <span>{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Alert */}
        <Alert>
          <Target className="h-4 w-4" />
          <AlertDescription>
            <strong>Next Steps:</strong> Based on this analysis, consider highlighting your strengths in your cover letter and addressing any gaps through additional training or experience.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default SuitabilityAnalysis;