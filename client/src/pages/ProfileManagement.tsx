import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft,
  User,
  Briefcase,
  GraduationCap,
  Star,
  Settings,
  CheckCircle,
  AlertCircle,
  Save,
  Upload,
  Camera
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { profileService, ProfileData } from '@/services/profileService';
import PersonalDetailsForm from '@/components/profile/PersonalDetailsForm';
import ProfilePictureUploader from '@/components/profile/ProfilePictureUploader';
import SkillsManager from '@/components/profile/SkillsManager';
import ExperienceTimeline from '@/components/profile/ExperienceTimeline';
import EducationTimeline from '@/components/profile/EducationTimeline';

/**
 * Comprehensive Profile Management Page
 * Replaces the basic modal with a full-page, modular interface
 */
const ProfileManagement: React.FC = () => {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('personal');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch user profile data
  const {
    data: profile,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['userProfile', user?.uid],
    queryFn: () => user?.uid ? profileService.getProfile(user.uid) : null,
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Save profile mutation
  const saveProfileMutation = useMutation({
    mutationFn: (profileData: Partial<ProfileData>) => 
      user?.uid ? profileService.updateProfile(user.uid, profileData) : Promise.reject('No user ID'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      setHasUnsavedChanges(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
      });
    },
  });

  // Calculate profile completion percentage
  const calculateCompletion = (profileData: ProfileData | null): number => {
    if (!profileData) return 0;
    
    let completed = 0;
    let total = 0;

    // Personal information (25%)
    const personalFields = ['fullName', 'phoneNumber', 'location', 'bio'];
    personalFields.forEach(field => {
      total++;
      if (profileData.personal?.[field as keyof typeof profileData.personal]) {
        completed++;
      }
    });

    // Skills (20%)
    total++;
    if (profileData.skills?.skills && profileData.skills.skills.length > 0) {
      completed++;
    }

    // Experience (25%)
    total++;
    if (profileData.experience?.hasExperience && 
        profileData.experience.jobTitle && 
        profileData.experience.employer) {
      completed++;
    }

    // Education (20%)
    total++;
    if (profileData.education?.highestEducation && 
        profileData.education.schoolName) {
      completed++;
    }

    // Profile picture (10%)
    total++;
    if (profileData.personal?.profilePicture) {
      completed++;
    }

    return Math.round((completed / total) * 100);
  };

  const completionPercentage = calculateCompletion(profile);

  // Handle profile updates
  const handleProfileUpdate = (section: keyof ProfileData, data: any) => {
    if (!profile) return;
    
    const updatedProfile = {
      ...profile,
      [section]: {
        ...profile[section],
        ...data
      }
    };

    // Update the profile in the cache
    queryClient.setQueryData(['userProfile', user?.uid], updatedProfile);
    setHasUnsavedChanges(true);
  };

  // Save all changes
  const handleSaveAll = async () => {
    if (!profile || !user?.uid) return;
    
    setIsSaving(true);
    try {
      await saveProfileMutation.mutateAsync(profile);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please sign in to manage your profile.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return <ProfileManagementSkeleton />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load profile. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Profile Management | WorkWise SA</title>
        <meta name="description" content="Manage your professional profile and preferences" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Profile
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Profile Management</h1>
              <p className="text-gray-600">Complete and manage your professional profile</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {hasUnsavedChanges && (
              <Badge variant="outline" className="text-orange-600 border-orange-200">
                Unsaved Changes
              </Badge>
            )}
            <Button
              onClick={handleSaveAll}
              disabled={!hasUnsavedChanges || isSaving}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save All Changes'}
            </Button>
          </div>
        </div>

        {/* Profile Completion Progress */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              Profile Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {completionPercentage}% Complete
                </span>
                <span className="text-sm text-gray-500">
                  {completionPercentage >= 80 ? 'Excellent!' : 
                   completionPercentage >= 60 ? 'Good progress!' : 
                   'Keep going!'}
                </span>
              </div>
              <Progress value={completionPercentage} className="w-full" />
              <p className="text-sm text-gray-600">
                Complete your profile to improve your job match quality and employer visibility.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="picture" className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Photos
            </TabsTrigger>
            <TabsTrigger value="skills" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Skills
            </TabsTrigger>
            <TabsTrigger value="experience" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Experience
            </TabsTrigger>
            <TabsTrigger value="education" className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Education
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <PersonalDetailsForm
              profile={profile}
              onUpdate={(data) => handleProfileUpdate('personal', data)}
            />
          </TabsContent>

          <TabsContent value="picture">
            <ProfilePictureUploader
              profile={profile}
              onUpdate={(data) => handleProfileUpdate('personal', data)}
            />
          </TabsContent>

          <TabsContent value="skills">
            <SkillsManager
              profile={profile}
              onUpdate={(data) => handleProfileUpdate('skills', data)}
            />
          </TabsContent>

          <TabsContent value="experience">
            <ExperienceTimeline
              profile={profile}
              onUpdate={(data) => handleProfileUpdate('experience', data)}
            />
          </TabsContent>

          <TabsContent value="education">
            <EducationTimeline
              profile={profile}
              onUpdate={(data) => handleProfileUpdate('education', data)}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

/**
 * Skeleton loader for profile management page
 */
const ProfileManagementSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-32" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <Card className="mb-8">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-5 gap-4 mb-8">
        {Array(5).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>

      <Card>
        <CardContent className="p-8">
          <div className="space-y-6">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

export default ProfileManagement;