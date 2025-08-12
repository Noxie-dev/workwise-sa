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
            skills: [],
            languages: ['English'],
            hasDriversLicense: false,
            hasTransport: false,
          },
          preferences: {
            jobTypes: [],
            locations: [],
            minSalary: 0,
            willingToRelocate: false,
          },
          memberSince: new Date().toISOString().split('T')[0],
          engagementScore: 10,
          applications: {
            current: 0,
            total: 0,
            successRate: 0,
          },
          ratings: {
            overall: 0,
          },
          notifications: 0,
          recentActivity: [],
        });
        const images = [currentUser.photoURL || '/images/default-avatar.png'];
        setProfileImages(images);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [currentUser]);

  const userLevel = getUserLevel(profile?.engagementScore || 0);

  const nextImage = () => {
    setActiveImageIndex(prev => (prev + 1) % profileImages.length);
  };

  const prevImage = () => {
    setActiveImageIndex(prev => (prev - 1 + profileImages.length) % profileImages.length);
  };



  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }
  if (!profile) {
    return <div className="flex items-center justify-center h-64">Profile not found.</div>;
  }

  return (
    <>
      <Helmet>
        <title>{profile.personal?.fullName || 'User'} | Profile | WorkWise SA</title>
        <meta
          name="description"
          content={`${
            profile.personal?.fullName || 'User'
          }'s profile on WorkWise SA. View details and activity history.`}
        />
      </Helmet>

      <main className="flex-grow bg-gray-50 min-h-screen">
        {/* Hero Section with Profile Picture */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-64 relative">
          <div className="container mx-auto px-4 h-full flex items-end">
            {/* Logo in top left */}
            <div className="absolute top-4 left-4 md:left-8">
              <img
                src="/images/logo.png"
                alt="WorkWise SA Logo"
                className="h-24 rounded-md shadow-md transition-all duration-200 hover:scale-105"
              />
            </div>
            <div className="relative -bottom-16 flex flex-col items-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white bg-white shadow-lg relative">
                  <img
                    src={profileImages[activeImageIndex]}
                    alt={profile.personal?.fullName || 'Profile'}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute bottom-2 right-2 z-10"
                    onClick={() => setShowImageUpload(true)}
                    disabled={uploading}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </div>
                {profileImages.length > 1 && (
                  <>
                    <div className="absolute -right-2 bottom-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 rounded-full bg-white"
                        onClick={nextImage}
                      >
                        <ChevronRight className="h-5 w-5 text-blue-500" />
                      </Button>
                    </div>
                    <div className="absolute -left-2 bottom-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 rounded-full bg-white"
                        onClick={prevImage}
                      >
                        <ChevronLeft className="h-5 w-5 text-blue-500" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
              <p className="text-white text-sm mt-2">{profile.personal?.caption || ''}</p>
            </div>
            {/* Rating in top right */}
            <div className="absolute top-4 right-4 md:right-8 space-y-2">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 flex items-center space-x-1">
                <Star className="h-5 w-5 text-yellow-300 fill-yellow-300" />
                <span className="text-white font-medium">{profile.ratings?.overall || '-'}</span>
                <Badge variant="outline" className="text-xs text-white border-white ml-1">
                  Level {userLevel.level}
                </Badge>
              </div>
              {professionalImage && (
                <div className="bg-blue-500/80 backdrop-blur-sm rounded-lg p-2 flex items-center space-x-1">
                  <Briefcase className="h-4 w-4 text-white" />
                  <span className="text-white text-xs font-medium">Professional Image</span>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Name and Quick Actions */}
        <div className="container mx-auto px-4 pt-20 pb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{profile.personal?.fullName}</h1>
              <div className="flex items-center text-gray-500 mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                <span className="text-sm">{profile.personal?.location}</span>
                <Separator orientation="vertical" className="mx-2 h-4" />
                <Calendar className="h-4 w-4 mr-1" />
                <span className="text-sm">Member since {profile.memberSince || '-'}</span>
              </div>
            </div>
            <div className="flex space-x-2 mt-4 md:mt-0">
              <Button size="sm" variant="outline" className="flex items-center">
                <Mail className="h-4 w-4 mr-1" />
                <span>Message</span>
              </Button>
              <Button size="sm" variant="outline" className="relative">
                <Bell className="h-4 w-4" />
                {profile.notifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {profile.notifications}
                  </span>
                )}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Completion Tracker */}
                <div className="md:col-span-3">
                  <ProfileCompletionTracker 
                    profile={profile}
                    onSectionClick={(sectionId) => {
                      // Navigate to profile setup with specific section
                      console.log('Navigate to section:', sectionId);
                    }}
                  />
                </div>

                {/* Bio and Skills */}
                <Card className="md:col-span-2">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold">About Me</h3>
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
                      </div>
                    </div>
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
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Engagement</span>
                            <span className="text-sm font-medium">
                              {profile.engagementScore || 0}/100
                            </span>
                          </div>
                          <Progress value={profile.engagementScore || 0} className="h-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Professional Image Quick Access */}
                  {professionalImage && (
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-4">For Recruiters</h3>
                        <div className="space-y-3">
                          <Button
                            onClick={() => setShowProfessionalViewer(true)}
                            className="w-full flex items-center gap-2"
                            variant="outline"
                          >
                            <Eye className="h-4 w-4" />
                            View Professional Image
                          </Button>
                          <p className="text-xs text-gray-500 text-center">
                            Professional image available for detailed review
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Recent Activity</h3>
                        <Button variant="link" className="text-blue-500 p-0 h-auto">
                          View All
                        </Button>
                      </div>
                      <div className="space-y-4">
                        {(profile.recentActivity || [])
                          .slice(0, 3)
                          .map((activity: any, index: number) => (
                            <div key={index} className="flex items-start">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                                {activity.icon ? (
                                  <activity.icon className="h-4 w-4 text-blue-600" />
                                ) : null}
                              </div>
                              <div>
                                <p className="text-sm text-gray-700">{activity.content}</p>
                                <p className="text-xs text-gray-500">{activity.timestamp}</p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
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
                    {/* TODO: Replace with real application data if available */}
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
                    <div>
                      <h4 className="font-medium mb-2">Other Preferences</h4>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Briefcase className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm">
                            Minimum Salary: R{profile.preferences?.minSalary || 0}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm">
                            {profile.preferences?.willingToRelocate
                              ? 'Willing to relocate for work'
                              : 'Not willing to relocate'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-medium mb-4">Professional Presentation</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <Briefcase className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Professional Image</p>
                            <p className="text-sm text-gray-600">
                              {professionalImage 
                                ? 'Available for recruiters to view' 
                                : 'Add a professional image for recruiters'
                              }
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {professionalImage && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowProfessionalViewer(true)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowProfessionalUpload(true)}
                          >
                            {professionalImage ? 'Update' : 'Add'}
                          </Button>
                        </div>
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
