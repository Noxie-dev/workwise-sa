import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/services/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldAlert, BarChart3, TrendingUp, Users } from 'lucide-react';
import { Link } from 'wouter';

type AdminAnalyticsResponse = {
  overview: {
    totalUsers: number;
    activeUsers: number;
    jobListings: number;
    applications: number;
  };
  userActivity: {
    daily: number[];
    weekly: number[];
    monthly: number[];
  };
  jobMetrics: {
    categories: string[];
    counts: number[];
  };
  conversionRates: {
    viewToApplication: number;
    applicationToInterview: number;
    interviewToHire: number;
  };
};

const emptyAnalytics: AdminAnalyticsResponse = {
  overview: {
    totalUsers: 0,
    activeUsers: 0,
    jobListings: 0,
    applications: 0,
  },
  userActivity: {
    daily: [],
    weekly: [],
    monthly: [],
  },
  jobMetrics: {
    categories: [],
    counts: [],
  },
  conversionRates: {
    viewToApplication: 0,
    applicationToInterview: 0,
    interviewToHire: 0,
  },
};

const AdminAnalytics: React.FC = () => {
  const { role } = useAuth();
  const isAdmin = role === 'admin';

  const { data, isLoading, error } = useQuery({
    queryKey: ['adminAnalyticsOverview'],
    queryFn: async () => {
      const response = await apiClient.get<AdminAnalyticsResponse>('/admin/analytics/overview');
      return response.data;
    },
    enabled: isAdmin,
    staleTime: 5 * 60 * 1000,
  });

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
          <p className="text-muted-foreground mb-6">
            You do not have permission to access this page.
          </p>
          <Button asChild>
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const analytics = data || emptyAnalytics;

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

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error instanceof Error ? error.message : 'Failed to load analytics'}
        </div>
      )}

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
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Users
                </CardTitle>
                <div className="flex items-center justify-between">
                  <CardDescription className="text-3xl font-bold">
                    {analytics.overview.totalUsers.toLocaleString()}
                  </CardDescription>
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Users
                </CardTitle>
                <div className="flex items-center justify-between">
                  <CardDescription className="text-3xl font-bold">
                    {analytics.overview.activeUsers.toLocaleString()}
                  </CardDescription>
                  <Users className="h-5 w-5 text-green-500" />
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Job Listings
                </CardTitle>
                <div className="flex items-center justify-between">
                  <CardDescription className="text-3xl font-bold">
                    {analytics.overview.jobListings.toLocaleString()}
                  </CardDescription>
                  <BarChart3 className="h-5 w-5 text-purple-500" />
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Applications
                </CardTitle>
                <div className="flex items-center justify-between">
                  <CardDescription className="text-3xl font-bold">
                    {analytics.overview.applications.toLocaleString()}
                  </CardDescription>
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                </div>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Platform Activity</CardTitle>
              <CardDescription>Daily user activity over the past week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-end justify-between gap-2">
                {(isLoading ? Array(7).fill(0) : analytics.userActivity.daily).map(
                  (value, index) => (
                    <div key={index} className="relative group">
                      <div
                        className="w-12 bg-blue-500 rounded-t hover:bg-blue-600 transition-all"
                        style={{ height: `${Math.min(100, value)}%` }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 text-center text-xs mt-1">
                        Day {index + 1}
                      </div>
                    </div>
                  )
                )}
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
                {(isLoading ? Array(6).fill(0) : analytics.userActivity.monthly).map(
                  (value, index) => (
                    <div key={index} className="relative group">
                      <div
                        className="w-16 bg-green-500 rounded-t hover:bg-green-600 transition-all"
                        style={{ height: `${Math.min(100, value)}%` }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 text-center text-xs mt-1">
                        Month {index + 1}
                      </div>
                    </div>
                  )
                )}
              </div>
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
                {analytics.jobMetrics.categories.map((category, index) => (
                  <div key={index} className="relative group">
                    <div
                      className="w-16 bg-purple-500 rounded-t hover:bg-purple-600 transition-all"
                      style={{
                        height: `${Math.min(100, analytics.jobMetrics.counts[index] || 0)}%`,
                      }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 text-center text-xs mt-1">
                      {category}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversion" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'View to Application',
                value: analytics.conversionRates.viewToApplication,
                color: 'text-blue-500',
              },
              {
                title: 'Application to Interview',
                value: analytics.conversionRates.applicationToInterview,
                color: 'text-green-500',
              },
              {
                title: 'Interview to Hire',
                value: analytics.conversionRates.interviewToHire,
                color: 'text-orange-500',
              },
            ].map(metric => (
              <Card key={metric.title}>
                <CardHeader>
                  <CardTitle>{metric.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center pt-6">
                  <div className={`text-4xl font-bold ${metric.color}`}>{metric.value}%</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAnalytics;
