import React, { useState } from 'react';
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
  Clock
} from 'lucide-react';

// Sample user data (in a real app this would come from API)
const userData = {
  id: 1,
  name: 'Sipho Mabhena',
  username: 'sipho_m',
  location: 'Cape Town, South Africa',
  bio: 'Dedicated worker with 3+ years experience in retail and customer service. Looking for new opportunities in the Eastern Cape area.',
  avatarUrl: 'https://i.pravatar.cc/300?img=12',
  additionalImages: [
    'https://i.pravatar.cc/300?img=11',
    'https://i.pravatar.cc/300?img=10'
  ],
  caption: 'Ready for new challenges',
  memberSince: 'January 2023',
  engagementScore: 87,
  engagementTier: 'high',
  ratings: {
    overall: 4.8,
    activity: 4.9,
    engagement: 4.7
  },
  applications: {
    current: 7,
    total: 23,
    successRate: 0.22
  },
  skills: [
    'Customer Service',
    'Cash Handling',
    'Inventory Management',
    'Team Leadership',
    'Sales'
  ],
  recentActivity: [
    {
      type: 'view',
      content: 'Watched "Basic Computer Skills Every Job Seeker Needs" video',
      timestamp: '2 hours ago',
      icon: Eye
    },
    {
      type: 'application',
      content: 'Applied for "Retail Assistant at Pick n Pay"',
      timestamp: '1 day ago',
      icon: Briefcase
    },
    {
      type: 'view',
      content: 'Watched "From Domestic Worker to Business Owner" video',
      timestamp: '2 days ago',
      icon: Eye
    },
    {
      type: 'profile',
      content: 'Updated profile information',
      timestamp: '1 week ago',
      icon: Edit
    },
    {
      type: 'application',
      content: 'Applied for "Security Guard at G4S"',
      timestamp: '1 week ago',
      icon: Briefcase
    }
  ],
  preferences: {
    categories: [1, 3, 5], // IDs of preferred job categories
    locations: ['Cape Town', 'Johannesburg', 'Durban'],
    jobTypes: ['Full-time', 'Part-time'],
    willingToRelocate: true,
    minSalary: 5000
  },
  notifications: 5
};

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
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');

  // All user images including profile picture
  const allImages = [userData.avatarUrl, ...userData.additionalImages];
  
  const userLevel = getUserLevel(userData.engagementScore);

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  return (
    <>
      <Helmet>
        <title>{userData.name} | Profile | WorkWise SA</title>
        <meta name="description" content={`${userData.name}'s profile on WorkWise SA. View details and activity history.`} />
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
                    src={allImages[activeImageIndex]} 
                    alt={userData.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -right-2 bottom-0">
                  <Button size="sm" variant="ghost" className="h-8 w-8 rounded-full bg-white" onClick={nextImage}>
                    <ChevronRight className="h-5 w-5 text-blue-500" />
                  </Button>
                </div>
                <div className="absolute -left-2 bottom-0">
                  <Button size="sm" variant="ghost" className="h-8 w-8 rounded-full bg-white" onClick={prevImage}>
                    <ChevronLeft className="h-5 w-5 text-blue-500" />
                  </Button>
                </div>
              </div>
              <p className="text-white text-sm mt-2">{userData.caption}</p>
            </div>

            {/* Rating in top right */}
            <div className="absolute top-4 right-4 md:right-8 bg-white/20 backdrop-blur-sm rounded-lg p-2 flex items-center space-x-1">
              <Star className="h-5 w-5 text-yellow-300 fill-yellow-300" />
              <span className="text-white font-medium">{userData.ratings.overall}</span>
              <Badge variant="outline" className="text-xs text-white border-white ml-1">
                Level {userLevel.level}
              </Badge>
            </div>
          </div>
        </div>
        
        {/* Name and Quick Actions */}
        <div className="container mx-auto px-4 pt-20 pb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{userData.name}</h1>
              <div className="flex items-center text-gray-500 mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                <span className="text-sm">{userData.location}</span>
                <Separator orientation="vertical" className="mx-2 h-4" />
                <Calendar className="h-4 w-4 mr-1" />
                <span className="text-sm">Member since {userData.memberSince}</span>
              </div>
            </div>
            
            <div className="flex space-x-2 mt-4 md:mt-0">
              <Button size="sm" variant="outline" className="flex items-center">
                <Mail className="h-4 w-4 mr-1" />
                <span>Message</span>
              </Button>
              <Button size="sm" variant="outline" className="relative">
                <Bell className="h-4 w-4" />
                {userData.notifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {userData.notifications}
                  </span>
                )}
              </Button>
              <Button size="sm" variant="outline">
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
                {/* Bio and Skills */}
                <Card className="md:col-span-2">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-2">About Me</h3>
                    <p className="text-gray-700 mb-6">{userData.bio}</p>
                    
                    <h3 className="text-lg font-semibold mb-2">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {userData.skills.map((skill, index) => (
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
                            <span className="text-sm font-medium">{userData.applications.current} active</span>
                          </div>
                          <Progress value={userData.applications.current / userData.applications.total * 100} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Success Rate</span>
                            <span className="text-sm font-medium">{(userData.applications.successRate * 100).toFixed(0)}%</span>
                          </div>
                          <Progress value={userData.applications.successRate * 100} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Engagement</span>
                            <span className="text-sm font-medium">{userData.engagementScore}/100</span>
                          </div>
                          <Progress value={userData.engagementScore} className="h-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Recent Activity</h3>
                        <Button variant="link" className="text-blue-500 p-0 h-auto">View All</Button>
                      </div>
                      
                      <div className="space-y-4">
                        {userData.recentActivity.slice(0, 3).map((activity, index) => (
                          <div key={index} className="flex items-start">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                              <activity.icon className="h-4 w-4 text-blue-600" />
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
                    <Badge variant={userData.applications.current > 0 ? "default" : "outline"}>
                      {userData.applications.current} Active Applications
                    </Badge>
                  </div>
                  
                  <div className="space-y-6">
                    {/* This would be a list of applications in a real app */}
                    <div className="border rounded-lg p-4 bg-white">
                      <div className="flex justify-between">
                        <div>
                          <h4 className="font-medium">Retail Assistant</h4>
                          <p className="text-sm text-gray-500">Pick n Pay - Cape Town</p>
                        </div>
                        <Badge>Applied</Badge>
                      </div>
                      <div className="mt-4 flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>Applied 1 day ago</span>
                        <Separator orientation="vertical" className="mx-2 h-4" />
                        <FileText className="h-4 w-4 mr-1" />
                        <span>Resume Submitted</span>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4 bg-white">
                      <div className="flex justify-between">
                        <div>
                          <h4 className="font-medium">Security Guard</h4>
                          <p className="text-sm text-gray-500">G4S - Johannesburg</p>
                        </div>
                        <Badge>In Review</Badge>
                      </div>
                      <div className="mt-4 flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>Applied 1 week ago</span>
                        <Separator orientation="vertical" className="mx-2 h-4" />
                        <FileText className="h-4 w-4 mr-1" />
                        <span>Resume Submitted</span>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4 bg-white">
                      <div className="flex justify-between">
                        <div>
                          <h4 className="font-medium">Cashier</h4>
                          <p className="text-sm text-gray-500">Shoprite - Durban</p>
                        </div>
                        <Badge variant="outline">Archived</Badge>
                      </div>
                      <div className="mt-4 flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>Applied 1 month ago</span>
                        <Separator orientation="vertical" className="mx-2 h-4" />
                        <FileText className="h-4 w-4 mr-1" />
                        <span>Resume Submitted</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="activity">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-6">Activity History</h3>
                  
                  <div className="space-y-4">
                    {userData.recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start border-b pb-4 last:border-0">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-4 flex-shrink-0">
                          <activity.icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-700">{activity.content}</p>
                          <p className="text-sm text-gray-500">{activity.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="preferences">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-6">Job Preferences</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Preferred Job Categories</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge>Retail</Badge>
                        <Badge>Security</Badge>
                        <Badge>Domestic Work</Badge>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Preferred Locations</h4>
                      <div className="flex flex-wrap gap-2">
                        {userData.preferences.locations.map((location, index) => (
                          <Badge key={index} variant="outline">
                            <MapPin className="h-3 w-3 mr-1" />
                            {location}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Job Types</h4>
                      <div className="flex flex-wrap gap-2">
                        {userData.preferences.jobTypes.map((type, index) => (
                          <Badge key={index} variant="outline">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Other Preferences</h4>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Briefcase className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm">Minimum Salary: R{userData.preferences.minSalary}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm">
                            {userData.preferences.willingToRelocate ? 
                              'Willing to relocate for work' : 
                              'Not willing to relocate'}
                          </span>
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
      </main>
    </>
  );
};

export default UserProfile;