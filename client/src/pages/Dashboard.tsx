import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { JobRecommendation, SkillsAnalysisData } from '@/services/dashboardService';
import { profileService } from '@/services/profileService';
import useDashboardData from '@/hooks/useDashboardData';
import analyticsService, { AnalyticsEventType } from '@/services/analyticsService';

// Lazy load dashboard components
const SkillsHeatmap = lazy(() => import('@/components/dashboard/SkillsHeatmap'));
const SkillsRadarChart = lazy(() => import('@/components/dashboard/SkillsRadarChart'));
const RealtimeUpdates = lazy(() => import('@/components/dashboard/RealtimeUpdates'));

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Lazy load chart components
const ChartComponents = lazy(() => import('../components/dashboard/ChartComponents'));

// Icons - import only what we need
import {
  AlertCircle,
  TrendingUp,
  MapPin,
  Briefcase,
  Star,
  Calendar,
  Download
} from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

// Mock skills data for the Skills Analysis tab
const SKILLS_DATA = [
  { skill: 'JavaScript', demand: 85, growth: 12 },
  { skill: 'Python', demand: 78, growth: 18 },
  { skill: 'React', demand: 72, growth: 15 },
  { skill: 'Data Analysis', demand: 68, growth: 22 },
  { skill: 'Project Management', demand: 65, growth: 8 },
  { skill: 'SQL', demand: 60, growth: 5 },
];

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30d');
  const [recommendationsLimit, setRecommendationsLimit] = useState(3);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [timeOnPage, setTimeOnPage] = useState(0);
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Track page view and time on page
  useEffect(() => {
    if (currentUser) {
      analyticsService.trackPageView(currentUser.uid, 'dashboard', {
        userDisplayName: currentUser.displayName || 'Unknown',
      });

      // Start tracking time on page
      timeIntervalRef.current = setInterval(() => {
        setTimeOnPage(prev => prev + 1);
      }, 1000);
    }

    // Cleanup function
    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);

        // Track time spent on page when unmounting
        if (currentUser && timeOnPage > 0) {
          analyticsService.trackTimeOnPage(currentUser.uid, 'dashboard', timeOnPage);
        }
      }
    };
  }, [currentUser]);

  // Track tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (currentUser) {
      analyticsService.trackTabChange(currentUser.uid, value);
    }
  };

  // Track filter changes
  const handleCategoryFilterChange = (value: string) => {
    setCategoryFilter(value);
    if (currentUser) {
      analyticsService.trackFilterChange(currentUser.uid, 'category', value);
    }
  };

  // Track date range changes
  const handleDateRangeChange = (value: string) => {
    setDateRange(value);
    if (currentUser) {
      analyticsService.trackFilterChange(currentUser.uid, 'dateRange', value);
    }
  };

  // Track job clicks
  const handleJobClick = (job: JobRecommendation) => {
    if (currentUser) {
      analyticsService.trackJobClick(currentUser.uid, job.id, job.title);
    }
    navigate(`/jobs/${job.id}`);
  };

  // Fetch user profile data
  const {
    data: userProfile,
    isLoading: isProfileLoading,
    error: profileError
  } = useQuery({
    queryKey: ['userProfile', currentUser?.uid],
    queryFn: () => currentUser ? profileService.getProfile(currentUser.uid) : null,
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    if (currentUser) {
      analyticsService.trackPagination(
        currentUser.uid,
        newPage,
        pageSize,
        0, // We'll update this with actual total items when available
        `dashboard-${activeTab}`
      );
    }
  };

  // Fetch dashboard data using custom hooks with pagination
  const {
    jobDistribution: { data: jobDistributionData, isLoading: isJobDataLoading, error: jobDataError },
    jobRecommendations: { data: jobRecommendationsData, isLoading: isRecommendationsLoading, error: recommendationsError },
    skillsAnalysis: { data: skillsAnalysisData, isLoading: isSkillsDataLoading, error: skillsDataError },
    isLoading,
    error,
    exportData
  } = useDashboardData(
    categoryFilter,
    dateRange,
    recommendationsLimit,
    currentUser?.uid,
    currentPage,
    pageSize
  );

  // Extract data and pagination info
  const jobData = jobDistributionData?.data;
  const jobPagination = jobDistributionData?.pagination;

  const recommendedJobs = jobRecommendationsData?.data || [];
  const recommendationsPagination = jobRecommendationsData?.pagination;

  const skillsData = skillsAnalysisData?.data;
  const skillsPagination = skillsAnalysisData?.pagination;

  // Calculate monthly growth
  const calculateGrowth = () => {
    if (jobData?.trends && jobData.trends.length >= 2) {
      const latest = jobData.trends[jobData.trends.length-1].applications;
      const previous = jobData.trends[jobData.trends.length-2].applications;
      const growth = ((latest / previous) - 1) * 100;
      return {
        value: growth.toFixed(1),
        isPositive: growth >= 0
      };
    }
    return { value: "N/A", isPositive: true };
  };

  const growth = calculateGrowth();

  // Handle unauthenticated users
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Alert variant="destructive" className="w-96">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please log in to view the job distribution dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Helmet>
        <title>Job Market Dashboard | WorkWise SA</title>
        <meta name="description" content="Insights and analytics for the South African job market" />
      </Helmet>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Job Market Dashboard</h1>
          <p className="text-gray-500">Insights and analytics for the South African job market</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <Select onValueChange={handleCategoryFilterChange} defaultValue={categoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="retail">Retail</SelectItem>
              <SelectItem value="it">IT</SelectItem>
              <SelectItem value="healthcare">Healthcare</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
              <SelectItem value="education">Education</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={handleDateRangeChange} defaultValue={dateRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => {
              if (currentUser) {
                analyticsService.trackExportData(
                  currentUser.uid,
                  'dashboard',
                  'json',
                  { categoryFilter, dateRange, tab: activeTab }
                );
              }
              // Use our new export functionality
              exportData.all();
            }}
          >
            <Download className="h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" value={activeTab} onValueChange={handleTabChange} className="mb-6">
        <TabsList className="grid w-full md:w-fit grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="skills">Skills Analysis</TabsTrigger>
          <TabsTrigger value="insights">Market Insights</TabsTrigger>
        </TabsList>
      </Tabs>

      <TabsContent value="overview" className={activeTab === "overview" ? "block" : "hidden"}>
        {/* Summary Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-8 w-1/3" />
              </div>
            ))
          ) : (
            <>
              <Card className="bg-blue-50">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500">Total Jobs</p>
                      <p className="text-2xl font-bold mt-1">
                        {jobData?.categories?.reduce((sum, item) => sum + item.count, 0) || 0}
                      </p>
                    </div>
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Briefcase className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500">Top Category</p>
                      <p className="text-2xl font-bold mt-1">
                        {jobData?.categories?.sort((a, b) => b.count - a.count)[0]?.category || 'N/A'}
                      </p>
                    </div>
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Star className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-yellow-50">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500">Top Location</p>
                      <p className="text-2xl font-bold mt-1">
                        {jobData?.locations?.sort((a, b) => b.value - a.value)[0]?.name || 'N/A'}
                      </p>
                    </div>
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <MapPin className="h-5 w-5 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={growth.isPositive ? "bg-purple-50" : "bg-red-50"}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500">Monthly Growth</p>
                      <div className="flex items-center gap-1 mt-1">
                        <p className="text-2xl font-bold">
                          {growth.value}%
                        </p>
                        <TrendingUp className={`h-4 w-4 ${growth.isPositive ? 'text-green-600' : 'text-red-600'}`} />
                      </div>
                    </div>
                    <div className={`p-2 rounded-lg ${growth.isPositive ? 'bg-purple-100' : 'bg-red-100'}`}>
                      <Calendar className={`h-5 w-5 ${growth.isPositive ? 'text-purple-600' : 'text-red-600'}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Jobs by Category Card */}
          <Card className="col-span-1 lg:col-span-1">
            <CardHeader>
              <CardTitle>Jobs by Category</CardTitle>
              <CardDescription>Distribution of job listings across industries</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : jobData?.categories?.length > 0 ? (
                <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                  <ChartComponents.JobCategoryBarChart
                    data={jobData.categories}
                    colors={COLORS}
                  />
                </Suspense>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No category data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Jobs by Location Card */}
          <Card className="col-span-1 lg:col-span-1">
            <CardHeader>
              <CardTitle>Jobs by Location</CardTitle>
              <CardDescription>Geographic distribution of job opportunities</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-64 w-full rounded-full mx-auto" />
                </div>
              ) : jobData?.locations?.length > 0 ? (
                <Suspense fallback={<Skeleton className="h-64 w-full rounded-full mx-auto" />}>
                  <ChartComponents.JobLocationPieChart
                    data={jobData.locations}
                    colors={COLORS}
                  />
                </Suspense>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No location data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Application Trends Card */}
          <Card className="col-span-1 md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle>Application Trends</CardTitle>
              <CardDescription>Job application volume over time</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : jobData?.trends?.length > 0 ? (
                <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                  <ChartComponents.ApplicationTrendsLineChart
                    data={jobData.trends}
                  />
                </Suspense>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No trend data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="recommendations" className={activeTab === "recommendations" ? "block" : "hidden"}>
        <Card>
          <CardHeader>
            <CardTitle>Personalized Job Recommendations</CardTitle>
            <CardDescription>Based on your skills, experience, and preferences</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="border rounded-lg p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <div className="flex gap-2 mb-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            ) : recommendedJobs.length > 0 ? (
              <div className="space-y-4">
                {recommendedJobs.map((job) => (
                  <Card key={job.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleJobClick(job)}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-semibold">{job.title}</h3>
                          <p className="text-gray-600">{job.company}</p>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          job.match >= 80
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {job.match}% Match
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 my-2">
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="h-3 w-3 mr-1" /> {job.location}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Briefcase className="h-3 w-3 mr-1" /> {job.type}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Timer className="h-3 w-3 mr-1" /> Posted {new Date(job.postedDate).toLocaleDateString()}
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mt-2">{job.description}</p>

                      <div className="flex flex-wrap gap-2 mt-4">
                        {job.skills.slice(0, 3).map((skill, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                            {skill}
                          </span>
                        ))}
                        {job.skills.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                            +{job.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500">No job recommendations available.</p>
                <p className="text-gray-500 mt-2">Complete your profile to get personalized recommendations.</p>
                <Button className="mt-4" onClick={() => navigate('/profile-setup')}>
                  Update Profile
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Show:</span>
              <Select
                value={recommendationsLimit.toString()}
                onValueChange={(value) => setRecommendationsLimit(parseInt(value))}
              >
                <SelectTrigger className="w-20">
                  <SelectValue placeholder="3" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => navigate('/jobs')}>
              View All Jobs
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="skills" className={activeTab === "skills" ? "block" : "hidden"}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Skills Heatmap - New Component */}
          <SkillsHeatmap
            data={skillsData}
            isLoading={isLoading || isSkillsDataLoading}
            onExport={() => {
              if (currentUser) {
                analyticsService.trackExportData(
                  currentUser.uid,
                  'skills-heatmap',
                  'csv',
                  { view: 'demand' }
                );
              }
              exportData.skillsAnalysis();
            }}
          />

          {/* Skills Radar Chart - New Component */}
          <SkillsRadarChart
            data={skillsData}
            isLoading={isLoading || isSkillsDataLoading}
            onExport={() => {
              if (currentUser) {
                analyticsService.trackExportData(
                  currentUser.uid,
                  'skills-radar',
                  'csv',
                  { view: 'comparison' }
                );
              }
              exportData.skillsAnalysis();
            }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>In-Demand Skills</CardTitle>
              <CardDescription>Most sought-after skills in the current job market</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ) : skillsData?.marketDemand ? (
                <div className="space-y-6">
                  {skillsData.marketDemand.slice(0, 5).map((item) => (
                    <div key={item.skill} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{item.skill}</span>
                        <span className="text-sm text-gray-500">Demand Score: {item.demand}/100</span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${item.demand}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-end">
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          item.growth > 10
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {item.growth > 0 ? '+' : ''}{item.growth}% YoY Growth
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Pagination for skills list */}
                  {skillsPagination && skillsPagination.totalPages > 1 && (
                    <div className="flex justify-center mt-4">
                      <div className="flex space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={skillsPagination.page === 1}
                          onClick={() => handlePageChange(skillsPagination.page - 1)}
                        >
                          Previous
                        </Button>

                        {Array.from({ length: skillsPagination.totalPages }, (_, i) => i + 1)
                          .filter(page =>
                            page === 1 ||
                            page === skillsPagination.totalPages ||
                            Math.abs(page - skillsPagination.page) <= 1
                          )
                          .map((page, i, arr) => {
                            // Add ellipsis
                            if (i > 0 && page - arr[i - 1] > 1) {
                              return (
                                <React.Fragment key={`ellipsis-${page}`}>
                                  <Button variant="outline" size="sm" disabled>
                                    ...
                                  </Button>
                                  <Button
                                    key={page}
                                    variant={page === skillsPagination.page ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handlePageChange(page)}
                                  >
                                    {page}
                                  </Button>
                                </React.Fragment>
                              );
                            }

                            return (
                              <Button
                                key={page}
                                variant={page === skillsPagination.page ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handlePageChange(page)}
                              >
                                {page}
                              </Button>
                            );
                          })
                        }

                        <Button
                          variant="outline"
                          size="sm"
                          disabled={skillsPagination.page === skillsPagination.totalPages}
                          onClick={() => handlePageChange(skillsPagination.page + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500">No skills demand data available.</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  if (currentUser) {
                    analyticsService.trackExportData(
                      currentUser.uid,
                      'skills-demand',
                      'csv',
                      { }
                    );
                  }
                  exportData.skillsAnalysis();
                }}
              >
                Export Skills Analysis Data
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Skills Gap Analysis</CardTitle>
              <CardDescription>Skills you may want to develop based on job market trends</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading || isProfileLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ) : !userProfile?.skills?.skills?.length ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">We need more information about your skills and experience.</p>
                  <Button className="mt-4" onClick={() => navigate('/profile-setup')}>
                    Complete Your Profile
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-medium mb-2">Skills You Have</h3>
                    <div className="flex flex-wrap gap-2">
                      {userProfile.skills.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                          onClick={() => {
                            if (currentUser) {
                              analyticsService.trackSkillView(currentUser.uid, skill);
                            }
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {skillsData?.recommendations && (
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <h3 className="font-medium mb-2">Recommended Skills to Develop</h3>
                      <div className="space-y-4">
                        {skillsData.recommendations.map((recommendation, index) => (
                          <div key={index}>
                            <div className="flex justify-between mb-1">
                              <span>{recommendation.skill}</span>
                              <span className="text-sm text-gray-500">
                                {skillsData.marketDemand.find(s => s.skill === recommendation.skill)?.demand >= 70
                                  ? 'High Demand'
                                  : 'Medium Demand'}
                              </span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-yellow-500 rounded-full"
                                style={{
                                  width: `${skillsData.marketDemand.find(s => s.skill === recommendation.skill)?.demand || 50}%`
                                }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{recommendation.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => navigate('/learning')}>
                Find Courses
              </Button>
              <Button onClick={() => navigate('/cv-builder')}>
                Update Your CV
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Real-time Updates Component */}
        <div className="mt-6">
          <RealtimeUpdates userId={currentUser?.uid} />
        </div>
      </TabsContent>

      <TabsContent value="insights" className={activeTab === "insights" ? "block" : "hidden"}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Industry Growth Trends</CardTitle>
              <CardDescription>Year-on-year growth by industry in South Africa</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'IT', growth: 18.5 },
                    { name: 'Finance', growth: 7.2 },
                    { name: 'Healthcare', growth: 12.8 },
                    { name: 'Education', growth: 5.3 },
                    { name: 'Retail', growth: -2.1 },
                    { name: 'Manufacturing', growth: 4.2 }
                  ]}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}%`, 'Growth']} />
                  <Legend />
                  <Bar dataKey="growth" name="YoY Growth (%)">
                    {[
                      { name: 'IT', growth: 18.5 },
                      { name: 'Finance', growth: 7.2 },
                      { name: 'Healthcare', growth: 12.8 },
                      { name: 'Education', growth: 5.3 },
                      { name: 'Retail', growth: -2.1 },
                      { name: 'Manufacturing', growth: 4.2 }
                    ].map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.growth >= 0 ? COLORS[index % COLORS.length] : '#ff0000'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Salary Benchmarks</CardTitle>
              <CardDescription>Average annual salaries by profession (ZAR)</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={[
                    { role: 'Software Developer', salary: 650000 },
                    { role: 'Accountant', salary: 520000 },
                    { role: 'Marketing Manager', salary: 480000 },
                    { role: 'Data Analyst', salary: 580000 },
                    { role: 'Teacher', salary: 310000 },
                    { role: 'Nurse', salary: 380000 }
                  ]}
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 800000]} tickFormatter={(value) => `R${value/1000}k`} />
                  <YAxis type="category" dataKey="role" />
                  <Tooltip formatter={(value) => [`R${value.toLocaleString()}`, 'Avg. Salary']} />
                  <Legend />
                  <Bar dataKey="salary" name="Average Salary" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Market Insights and Recommendations</CardTitle>
              <CardDescription>Personalized insights based on your profile and market trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" /> Industry Growth
                  </h3>
                  <p className="mt-2">The IT sector is showing strong growth at 18.5% year-on-year, with particular demand in data analysis, cloud computing, and cybersecurity roles.</p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-medium flex items-center gap-2">
                    <MapPin className="h-5 w-5" /> Geographic Opportunities
                  </h3>
                  <p className="mt-2">Johannesburg and Cape Town remain the primary job markets, but remote work opportunities have increased by 215% since 2023, opening more possibilities across South Africa.</p>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h3 className="font-medium flex items-center gap-2">
                    <Star className="h-5 w-5" /> Career Advancement
                  </h3>
                  <p className="mt-2">Based on your profile, consider developing data analysis skills further or exploring project management certifications to increase your marketability in the current job landscape.</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => navigate('/career-planning')}>
                Create Career Development Plan
              </Button>
            </CardFooter>
          </Card>
        </div>
      </TabsContent>

      {/* Bottom section with contextual information */}
      <div className="mt-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Job Market Pulse</CardTitle>
            <CardDescription>
              Updated {new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white border rounded-lg">
                <h3 className="font-medium mb-2">Trending Industries</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span>Renewable Energy</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span>Healthcare Technology</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span>E-commerce</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-white border rounded-lg">
                <h3 className="font-medium mb-2">Economic Indicators</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between">
                    <span>Unemployment Rate:</span>
                    <span className="font-medium">32.9%</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Job Creation (YoY):</span>
                    <span className="font-medium text-green-600">+2.3%</span>
                  </li>
                  <li className="flex justify-between">
                    <span>GDP Growth:</span>
                    <span className="font-medium text-green-600">1.8%</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-white border rounded-lg">
                <h3 className="font-medium mb-2">Latest News</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="#" className="text-blue-600 hover:underline">New Government Initiative to Boost Youth Employment</a>
                    <p className="text-gray-500 text-xs mt-1">May 1, 2025</p>
                  </li>
                  <li>
                    <a href="#" className="text-blue-600 hover:underline">Tech Companies Expanding Presence in Cape Town</a>
                    <p className="text-gray-500 text-xs mt-1">April 28, 2025</p>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between pt-0">
            <Button variant="ghost" size="sm" className="text-xs">
              Subscribe to Updates
            </Button>
            <Button variant="link" size="sm" className="text-xs">
              View Full Economic Report
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Add a disclaimer/info section at the bottom */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Data sources: Statistics South Africa, Department of Labour, WorkWiseSA Market Analysis</p>
        <p className="mt-1">Last updated: {new Date().toLocaleDateString('en-ZA')}</p>
      </div>
    </div>
  );
}
