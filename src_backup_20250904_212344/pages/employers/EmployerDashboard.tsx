import { useState, useEffect, lazy, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { employerDashboardService } from '@/services/employerDashboardService';
import analyticsService from '@/services/analyticsService';

// Lazy load dashboard components
const JobManagementChart = lazy(() => import('@/components/employer/JobManagementChart'));
const ApplicationsChart = lazy(() => import('@/components/employer/ApplicationsChart'));

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
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Icons
import {
  AlertCircle,
  Briefcase,
  Users,
  FileText,
  TrendingUp,
  Eye,
  Plus,
  Edit3,
  Trash2,
  Download,
  BarChart3
} from 'lucide-react';

export default function EmployerDashboard() {
  const { currentUser } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState('30d');
  const [statusFilter, setStatusFilter] = useState('all');

  // Track page view
  useEffect(() => {
    if (currentUser) {
      analyticsService.trackPageView(currentUser.uid, 'employer-dashboard', {
        userDisplayName: currentUser.displayName || 'Unknown',
      });
    }
  }, [currentUser]);

  // Fetch dashboard data
  const {
    data: dashboardData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['employerDashboard', currentUser?.uid, dateRange, statusFilter],
    queryFn: () => currentUser ? employerDashboardService.fetchEmployerDashboard(currentUser.uid, dateRange, statusFilter) : null,
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch jobs list
  const {
    data: jobsData,
    isLoading: isJobsLoading,
    error: jobsError
  } = useQuery({
    queryKey: ['employerJobs', currentUser?.uid, statusFilter],
    queryFn: () => currentUser ? employerDashboardService.fetchEmployerJobs(currentUser.uid, statusFilter) : null,
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (currentUser) {
      analyticsService.trackTabChange(currentUser.uid, value);
    }
  };

  const handleDateRangeChange = (value: string) => {
    setDateRange(value);
    if (currentUser) {
      analyticsService.trackFilterChange(currentUser.uid, 'dateRange', value);
    }
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    if (currentUser) {
      analyticsService.trackFilterChange(currentUser.uid, 'statusFilter', value);
    }
  };

  const handleJobAction = (action: string, jobId: string) => {
    if (currentUser) {
      analyticsService.trackEvent('job_action', currentUser.uid, { action, jobId });
    }
    
    switch (action) {
      case 'view':
        navigate(`/employers/jobs/${jobId}`);
        break;
      case 'edit':
        navigate(`/employers/jobs/${jobId}/edit`);
        break;
      case 'applications':
        navigate(`/employers/jobs/${jobId}/applications`);
        break;
      default:
        break;
    }
  };

  const handleExportData = () => {
    if (currentUser && dashboardData) {
      analyticsService.trackExportData(currentUser.uid, 'employer-dashboard', 'csv', { dateRange, statusFilter });
      employerDashboardService.exportDashboardData(dashboardData, 'employer-dashboard.csv');
    }
  };

  // Handle unauthenticated users
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Alert variant="destructive" className="w-96">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please log in to access the employer dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Helmet>
        <title>Employer Dashboard | WorkWise SA</title>
        <meta name="description" content="Manage your job postings and track applications" />
      </Helmet>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Employer Dashboard</h1>
          <p className="text-gray-500">Manage your job postings and track applications</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <Select onValueChange={handleStatusFilterChange} defaultValue={statusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jobs</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
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
            onClick={handleExportData}
          >
            <Download className="h-4 w-4" />
            Export Data
          </Button>

          <Button
            className="flex items-center gap-2"
            onClick={() => navigate('/employers/post-job')}
          >
            <Plus className="h-4 w-4" />
            Post New Job
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error instanceof Error ? error.message : 'An error occurred'}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" value={activeTab} onValueChange={handleTabChange} className="mb-6">
        <TabsList className="grid w-full md:w-fit grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="jobs">Manage Jobs</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
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
                        {dashboardData?.stats?.totalJobs || 0}
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
                      <p className="text-sm text-gray-500">Active Jobs</p>
                      <p className="text-2xl font-bold mt-1">
                        {dashboardData?.stats?.activeJobs || 0}
                      </p>
                    </div>
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-yellow-50">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500">Total Applications</p>
                      <p className="text-2xl font-bold mt-1">
                        {dashboardData?.stats?.totalApplications || 0}
                      </p>
                    </div>
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <FileText className="h-5 w-5 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-50">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500">Total Views</p>
                      <p className="text-2xl font-bold mt-1">
                        {dashboardData?.stats?.totalViews || 0}
                      </p>
                    </div>
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Eye className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Applications Over Time</CardTitle>
              <CardDescription>Track how applications are coming in</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : (
                <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                  <ApplicationsChart data={dashboardData?.charts?.applications || []} />
                </Suspense>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Job Performance</CardTitle>
              <CardDescription>Views and applications by job</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : (
                <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                  <JobManagementChart data={dashboardData?.charts?.jobPerformance || []} />
                </Suspense>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest applications and job interactions</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {dashboardData?.recentActivity?.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-500">{activity.description}</p>
                    </div>
                    <div className="text-sm text-gray-500">{activity.timestamp}</div>
                  </div>
                )) || (
                  <div className="text-center py-10 text-gray-500">
                    No recent activity
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="jobs" className={activeTab === "jobs" ? "block" : "hidden"}>
        <Card>
          <CardHeader>
            <CardTitle>Manage Jobs</CardTitle>
            <CardDescription>View and manage all your job postings</CardDescription>
          </CardHeader>
          <CardContent>
            {isJobsLoading ? (
              <div className="space-y-4">
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} className="border rounded-lg p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : jobsData?.length > 0 ? (
              <div className="space-y-4">
                {jobsData.map((job) => (
                  <Card key={job.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">{job.title}</h3>
                          <p className="text-gray-600">{job.location} • {job.type}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>{job.applications} applications</span>
                            <span>{job.views} views</span>
                            <span>Posted {job.postedDate}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={
                              job.status === 'active' ? 'default' :
                              job.status === 'paused' ? 'secondary' :
                              job.status === 'closed' ? 'destructive' : 'outline'
                            }
                          >
                            {job.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleJobAction('view', job.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleJobAction('edit', job.id)}
                        >
                          <Edit3 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleJobAction('applications', job.id)}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Applications ({job.applications})
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleJobAction('analytics', job.id)}
                        >
                          <BarChart3 className="h-4 w-4 mr-1" />
                          Analytics
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No jobs posted yet</p>
                <Button onClick={() => navigate('/employers/post-job')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Post Your First Job
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="applications" className={activeTab === "applications" ? "block" : "hidden"}>
        <Card>
          <CardHeader>
            <CardTitle>Application Management</CardTitle>
            <CardDescription>Review and manage job applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-10">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Application management coming soon</p>
              <p className="text-sm text-gray-400">
                Track, review, and manage all applications in one place
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="analytics" className={activeTab === "analytics" ? "block" : "hidden"}>
        <Card>
          <CardHeader>
            <CardTitle>Advanced Analytics</CardTitle>
            <CardDescription>Detailed insights into your job posting performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-10">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Advanced analytics coming soon</p>
              <p className="text-sm text-gray-400">
                Get detailed insights into application trends, candidate demographics, and more
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </div>
  );
}
