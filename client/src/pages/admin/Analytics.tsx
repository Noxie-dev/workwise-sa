import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldAlert, BarChart3, TrendingUp, Users, Clock } from 'lucide-react';
import { Link } from 'wouter';

// Mock data for analytics
const mockAnalyticsData = {
  overview: {
    totalUsers: 12458,
    activeUsers: 3842,
    jobListings: 1245,
    applications: 8976,
  },
  userActivity: {
    daily: [120, 145, 132, 164, 187, 176, 198],
    weekly: [876, 924, 1032, 1123, 1087],
    monthly: [3245, 3876, 4231, 4567, 4321, 4765],
  },
  jobMetrics: {
    categories: ['IT', 'Finance', 'Marketing', 'Healthcare', 'Education', 'Other'],
    counts: [345, 234, 187, 156, 132, 191],
  },
  conversionRates: {
    viewToApplication: 12.4,
    applicationToInterview: 8.7,
    interviewToHire: 24.3,
  }
};

const AdminAnalytics: React.FC = () => {
  const { currentUser } = useAuth();

  // Check if user is an admin (in a real app, this would be based on a role in the database)
  const isAdmin = React.useMemo(() => {
    if (!currentUser?.email) return false;
    // For demo purposes, consider users with these domains as admins
    const adminDomains = ['workwisesa.co.za', 'admin.workwisesa.co.za', 'admin.com'];
    // Also grant admin access to specific email addresses
    const adminEmails = ['phakikrwele@gmail.com'];
    return adminDomains.some(domain => currentUser.email?.endsWith(domain)) ||
           adminEmails.includes(currentUser.email);
  }, [currentUser]);

  // If user is not an admin, show access denied message
  if (!isAdmin) {
    return (
      <div className="container py-8 max-w-[1200px] mx-auto">
        <Helmet>
          <title>Access Denied | WorkWise SA</title>
          <meta name="description" content="Admin analytics for WorkWise SA" />
        </Helmet>

        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">You do not have permission to access this page.</p>
          <Button asChild>
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-[1200px] mx-auto">
      <Helmet>
        <title>Analytics | Admin Dashboard | WorkWise SA</title>
        <meta name="description" content="Analytics dashboard for WorkWise SA" />
      </Helmet>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Monitor platform performance and user activity
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin">Back to Admin Dashboard</Link>
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Analytics</TabsTrigger>
          <TabsTrigger value="jobs">Job Analytics</TabsTrigger>
          <TabsTrigger value="conversion">Conversion Rates</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                <div className="flex items-center justify-between">
                  <CardDescription className="text-3xl font-bold">
                    {mockAnalyticsData.overview.totalUsers.toLocaleString()}
                  </CardDescription>
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
                <div className="flex items-center justify-between">
                  <CardDescription className="text-3xl font-bold">
                    {mockAnalyticsData.overview.activeUsers.toLocaleString()}
                  </CardDescription>
                  <Users className="h-5 w-5 text-green-500" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">+8% from last month</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Job Listings</CardTitle>
                <div className="flex items-center justify-between">
                  <CardDescription className="text-3xl font-bold">
                    {mockAnalyticsData.overview.jobListings.toLocaleString()}
                  </CardDescription>
                  <BarChart3 className="h-5 w-5 text-purple-500" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">+15% from last month</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Applications</CardTitle>
                <div className="flex items-center justify-between">
                  <CardDescription className="text-3xl font-bold">
                    {mockAnalyticsData.overview.applications.toLocaleString()}
                  </CardDescription>
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">+23% from last month</p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Platform Activity</CardTitle>
              <CardDescription>Daily user activity over the past week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-end justify-between gap-2">
                {mockAnalyticsData.userActivity.daily.map((value, index) => (
                  <div key={index} className="relative group">
                    <div 
                      className="w-12 bg-blue-500 rounded-t hover:bg-blue-600 transition-all" 
                      style={{ height: `${(value / 200) * 100}%` }}
                    ></div>
                    <div className="absolute bottom-0 left-0 right-0 text-center text-xs mt-1">
                      Day {index + 1}
                    </div>
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {value} users
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
              <CardDescription>Monthly user registration trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-end justify-between gap-2">
                {mockAnalyticsData.userActivity.monthly.map((value, index) => (
                  <div key={index} className="relative group">
                    <div 
                      className="w-16 bg-green-500 rounded-t hover:bg-green-600 transition-all" 
                      style={{ height: `${(value / 5000) * 100}%` }}
                    ></div>
                    <div className="absolute bottom-0 left-0 right-0 text-center text-xs mt-1">
                      Month {index + 1}
                    </div>
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {value} users
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>User Demographics</CardTitle>
              <CardDescription>User distribution by region and age</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-12">
                Demographic visualization would be displayed here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Categories Distribution</CardTitle>
              <CardDescription>Number of job listings by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-end justify-between gap-2">
                {mockAnalyticsData.jobMetrics.categories.map((category, index) => (
                  <div key={index} className="relative group">
                    <div 
                      className="w-16 bg-purple-500 rounded-t hover:bg-purple-600 transition-all" 
                      style={{ height: `${(mockAnalyticsData.jobMetrics.counts[index] / 400) * 100}%` }}
                    ></div>
                    <div className="absolute bottom-0 left-0 right-0 text-center text-xs mt-1">
                      {category}
                    </div>
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {mockAnalyticsData.jobMetrics.counts[index]} jobs
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Job Posting Trends</CardTitle>
              <CardDescription>Weekly job posting activity</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-12">
                Job posting trend visualization would be displayed here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversion" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>View to Application</CardTitle>
                <CardDescription>Percentage of job views that result in applications</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center pt-6">
                <div className="relative h-32 w-32 flex items-center justify-center">
                  <svg className="h-full w-full" viewBox="0 0 100 100">
                    <circle
                      className="text-muted stroke-current"
                      strokeWidth="10"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                    <circle
                      className="text-blue-500 stroke-current"
                      strokeWidth="10"
                      strokeLinecap="round"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                      strokeDasharray={`${mockAnalyticsData.conversionRates.viewToApplication * 2.5} 251.2`}
                      strokeDashoffset="0"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-2xl font-bold">{mockAnalyticsData.conversionRates.viewToApplication}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Application to Interview</CardTitle>
                <CardDescription>Percentage of applications that result in interviews</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center pt-6">
                <div className="relative h-32 w-32 flex items-center justify-center">
                  <svg className="h-full w-full" viewBox="0 0 100 100">
                    <circle
                      className="text-muted stroke-current"
                      strokeWidth="10"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                    <circle
                      className="text-green-500 stroke-current"
                      strokeWidth="10"
                      strokeLinecap="round"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                      strokeDasharray={`${mockAnalyticsData.conversionRates.applicationToInterview * 2.5} 251.2`}
                      strokeDashoffset="0"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-2xl font-bold">{mockAnalyticsData.conversionRates.applicationToInterview}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Interview to Hire</CardTitle>
                <CardDescription>Percentage of interviews that result in hires</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center pt-6">
                <div className="relative h-32 w-32 flex items-center justify-center">
                  <svg className="h-full w-full" viewBox="0 0 100 100">
                    <circle
                      className="text-muted stroke-current"
                      strokeWidth="10"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                    <circle
                      className="text-orange-500 stroke-current"
                      strokeWidth="10"
                      strokeLinecap="round"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                      strokeDasharray={`${mockAnalyticsData.conversionRates.interviewToHire * 2.5} 251.2`}
                      strokeDashoffset="0"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-2xl font-bold">{mockAnalyticsData.conversionRates.interviewToHire}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>Complete job application funnel</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-12">
                Conversion funnel visualization would be displayed here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAnalytics;