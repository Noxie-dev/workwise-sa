import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Star,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  Award,
  ChevronLeft,
  ChevronRight,
  Edit,
  MessageSquare,
  Bell,
  Settings,
  FileText,
  Heart,
  Eye,
  Clock,
  X,
  Accessibility,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { profileService } from '@/services/profileService';
import { fileUploadService } from '@/services/fileUploadService';
import { updateProfile as firebaseUpdateProfile } from 'firebase/auth';
import ProfileImageUpload from '@/components/ProfileImageUpload';
import ProfessionalImageUpload from '@/components/ProfessionalImageUpload';
import ProfessionalImageViewer from '@/components/ProfessionalImageViewer';
import ProfileCompletionTracker from '@/components/ProfileCompletionTracker';
import ProfileAnalytics from '@/components/ProfileAnalytics';
import ProfileEditModal from '@/components/ProfileEditModal';
import AccessibilitySettingsModal from '@/components/accessibility/AccessibilitySettingsModal';
import MobileAccessibilityFab from '@/components/accessibility/MobileAccessibilityFab';

// Calculate level based on engagement score
const getUserLevel = (score: number) => {
  if (score >= 300) return { level: 5, title: 'Premium' };
  if (score >= 150) return { level: 4, title: 'Advanced' };
  if (score >= 50) return { level: 3, title: 'Intermediate' };
  if (score >= 20) return { level: 2, title: 'Beginner' };
  return { level: 1, title: 'Novice' };
};

const UserProfile = () => {
  const { username } = useParams();
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [uploading, setUploading] = useState(false);
  const [profileImages, setProfileImages] = useState<string[]>([]);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [professionalImage, setProfessionalImage] = useState<string | null>(null);
  const [showProfessionalUpload, setShowProfessionalUpload] = useState(false);
  const [showProfessionalViewer, setShowProfessionalViewer] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAccessibilitySettings, setShowAccessibilitySettings] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        const data = await profileService.getProfile(currentUser.uid);
        setProfile(data);
        // Profile picture priority: Firebase photoURL, then profile.profilePicture, then fallback
        const images = [
          currentUser.photoURL || data?.personal?.profilePicture || '/images/default-avatar.png',
        ];
        setProfileImages(images);
        // Set professional image if available
        setProfessionalImage(data?.personal?.professionalImage || null);
      } catch (e) {
        console.error('Failed to fetch profile:', e);
        // Create a default profile structure if fetch fails
        setProfile({
          personal: {
            fullName: currentUser.displayName || 'User',
            phoneNumber: '',
            location: 'Not specified',
            bio: 'Welcome to WorkWise SA! Complete your profile to get better job matches.',
            profilePicture: currentUser.photoURL,
          },
          education: {
            highestEducation: 'Not specified',
            schoolName: 'Not specified',
          },
          experience: {
            hasExperience: false,
            jobTitle: 'Not specified',
            employer: 'Not specified',
          },
          skills: {
            skills: ['Communication', 'Teamwork', 'Problem Solving'],
          },
          applications: {
            current: 0,
            total: 0,
            successRate: 0,
          },
          preferences: {
            locations: ['Remote', 'Cape Town', 'Johannesburg'],
            jobTypes: ['Full-time', 'Part-time', 'Contract'],
          },
          recentActivity: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Profile not found</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{profile.personal?.fullName || 'User'} - Profile | WorkWise SA</title>
        <meta name="description" content={`View ${profile.personal?.fullName || 'User'}'s professional profile on WorkWise SA`} />
      </Helmet>

      <main className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Profile Image */}
              <div className="relative">
                <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-200">
                  <img
                    src={profileImages[activeImageIndex] || '/images/default-avatar.png'}
                    alt={profile.personal?.fullName || 'User'}
                    className="h-full w-full object-cover"
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                  onClick={() => setShowImageUpload(true)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {profile.personal?.fullName || 'User'}
                    </h1>
                    <p className="text-lg text-gray-600">
                      {profile.experience?.hasExperience ? profile.experience.jobTitle : 'Job Seeker'}
                      {profile.experience?.hasExperience && profile.experience.employer && (
                        <span> at {profile.experience.employer}</span>
                      )}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      {profile.personal?.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {profile.personal.location}
                        </span>
                      )}
                      {profile.education?.highestEducation && (
                        <span className="flex items-center gap-1">
                          <Award className="h-4 w-4" />
                          {profile.education.highestEducation}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEditModal(true)}
                      className="flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit Profile
                    </Button>
                    {professionalImage && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowProfessionalViewer(true)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View Professional Image
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowProfessionalUpload(true)}
                      className="flex items-center gap-2"
                    >
                      <Briefcase className="h-4 w-4" />
                      {professionalImage ? 'Update' : 'Add'} Professional Image
                    </Button>
                    <Button
                      size="sm" 
                      variant="outline"
                      onClick={() => setShowAccessibilitySettings(true)}
                      aria-label="Open accessibility and user settings"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="container mx-auto px-4 pb-12">
          <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="applications">Applications</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Profile Info */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold mb-4">About</h3>
                      <p className="text-gray-700 mb-6">{profile.personal?.bio}</p>
                      
                      {professionalImage && (
                        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2 text-sm text-blue-700">
                            <Briefcase className="h-4 w-4" />
                            <span className="font-medium">Professional image available for recruiters</span>
                          </div>
                        </div>
                      )}
                      
                      <h3 className="text-lg font-semibold mb-2">Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {(profile.skills?.skills || []).map((skill: string, index: number) => (
                          <Badge key={index} variant="outline" className="bg-blue-50">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Stats and Activity */}
                <div className="space-y-6">
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Stats</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Applications</span>
                            <span className="text-sm font-medium">
                              {profile.applications?.current || 0} active
                            </span>
                          </div>
                          <Progress
                            value={
                              ((profile.applications?.current || 0) /
                                (profile.applications?.total || 1)) *
                              100
                            }
                            className="h-2"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Success Rate</span>
                            <span className="text-sm font-medium">
                              {((profile.applications?.successRate || 0) * 100).toFixed(0)}%
                            </span>
                          </div>
                          <Progress
                            value={(profile.applications?.successRate || 0) * 100}
                            className="h-2"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Profile Completion Tracker */}
                  <ProfileCompletionTracker 
                    profile={profile}
                    onSectionClick={(sectionId) => {
                      console.log('Navigate to section:', sectionId);
                    }}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="applications">
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold">Job Applications</h3>
                    <Badge variant={profile.applications?.current > 0 ? 'default' : 'outline'}>
                      {profile.applications?.current || 0} Active Applications
                    </Badge>
                  </div>
                  <div className="space-y-6">
                    {/* This would be a list of applications in a real app */}
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No applications yet</p>
                      <p className="text-sm text-gray-400">Start applying for jobs to see your applications here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold mb-6">Activity History</h3>
                      <div className="space-y-4">
                        {(profile.recentActivity || []).length > 0 ? (
                          (profile.recentActivity || []).map((activity: any, index: number) => (
                            <div key={index} className="flex items-start border-b pb-4 last:border-0">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-4 flex-shrink-0">
                                {activity.icon ? (
                                  <activity.icon className="h-5 w-5 text-blue-600" />
                                ) : (
                                  <Clock className="h-5 w-5 text-blue-600" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-gray-700">{activity.content}</p>
                                <p className="text-sm text-gray-500">{activity.timestamp}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No recent activity</p>
                            <p className="text-sm text-gray-400">Start applying for jobs to see your activity here</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div>
                  <ProfileAnalytics profile={profile} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preferences">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-6">Job Preferences</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Preferred Job Categories</h4>
                      <div className="flex flex-wrap gap-2">
                        {/* TODO: Replace with real categories if available */}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Preferred Locations</h4>
                      <div className="flex flex-wrap gap-2">
                        {(profile.preferences?.locations || []).map(
                          (location: string, index: number) => (
                            <Badge key={index} variant="outline">
                              <MapPin className="h-3 w-3 mr-1" />
                              {location}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Job Types</h4>
                      <div className="flex flex-wrap gap-2">
                        {(profile.preferences?.jobTypes || []).map(
                          (type: string, index: number) => (
                            <Badge key={index} variant="outline">
                              {type}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Button>Update Preferences</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Profile Image Upload Modal */}
        {showImageUpload && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">Update Profile Image</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowImageUpload(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-4">
                <ProfileImageUpload
                  currentImageUrl={profileImages[activeImageIndex]}
                  onImageUpdate={(newImageUrl) => {
                    setProfileImages(prev => [newImageUrl, ...prev.slice(1)]);
                    setShowImageUpload(false);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Professional Image Upload Modal */}
        {showProfessionalUpload && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">Professional Image</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowProfessionalUpload(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-4">
                <ProfessionalImageUpload
                  currentImageUrl={professionalImage || undefined}
                  onImageUpdate={(newImageUrl) => {
                    setProfessionalImage(newImageUrl);
                    setShowProfessionalUpload(false);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Professional Image Viewer Modal */}
        {showProfessionalViewer && professionalImage && (
          <ProfessionalImageViewer
            imageUrl={professionalImage}
            candidateName={profile.personal?.fullName || 'User'}
            onClose={() => setShowProfessionalViewer(false)}
            isOpen={showProfessionalViewer}
          />
        )}

        {/* Profile Edit Modal */}
        {showEditModal && (
          <ProfileEditModal
            profile={profile}
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onSave={(updatedProfile) => {
              setProfile(updatedProfile);
            }}
            userId={currentUser?.uid || ''}
          />
        )}

        {/* Accessibility Settings Modal */}
        <AccessibilitySettingsModal
          open={showAccessibilitySettings}
          onOpenChange={setShowAccessibilitySettings}
        />

        {/* Mobile Accessibility FAB */}
        <MobileAccessibilityFab
          onOpenSettings={() => setShowAccessibilitySettings(true)}
        />
      </main>
    </>
  );
};

export default UserProfile;
