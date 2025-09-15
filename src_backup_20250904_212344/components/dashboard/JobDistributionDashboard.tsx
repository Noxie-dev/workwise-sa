// src/components/dashboard/JobDistributionDashboard.tsx
import React, { useState } from 'react';
import { useJobDistribution } from '../../hooks/useJobDistribution';
import { useCategoryDistribution } from '../../hooks/useCategoryDistribution';
import { useDistributionWorkflow } from '../../hooks/useDistributionWorkflow';
import { useGeographicDistribution } from '../../hooks/useGeographicDistribution';
import { useMatchingFactorsAnalysis } from '../../hooks/useMatchingFactorsAnalysis';
import { useAlgorithmConfiguration } from '../../hooks/useAlgorithmConfiguration';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../ui/dropdown-menu';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Briefcase, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Database,
  Filter,
  MessageSquare,
  Send,
  ChevronRight,
  RefreshCw,
  Settings,
  Search,
  MoreVertical,
  Download,
  FileText
} from 'lucide-react';
import { StatCard } from './StatCard';
import { WorkflowCard } from './WorkflowCard';
import { PriorityIndicator } from './PriorityIndicator';
import { JobDistributionTable } from './JobDistributionTable';
import { AlgorithmSettingsModal } from './AlgorithmSettingsModal';
import { Pagination } from '../ui/pagination';
import { Badge } from '../ui/badge';
import { exportDashboardData } from '../../utils/exportData';

// Job categories from the requirements
const JOB_CATEGORIES = [
  { id: 1, name: 'General Worker', slug: 'general-worker' },
  { id: 2, name: 'Construction Worker', slug: 'construction-worker' },
  { id: 3, name: 'Picker/Packer', slug: 'picker-packer' },
  { id: 4, name: 'Warehouse Assistant', slug: 'warehouse-assistant' },
  { id: 5, name: 'Cashier', slug: 'cashier' },
  { id: 6, name: 'Cleaner', slug: 'cleaner' },
  { id: 7, name: 'Security Guard', slug: 'security-guard' },
  { id: 8, name: 'Retail Assistant', slug: 'retail-assistant' },
  { id: 9, name: 'Call Center Agent', slug: 'call-center-agent' },
  { id: 10, name: 'Domestic Worker', slug: 'domestic-worker' },
  { id: 11, name: 'Petrol Attendant', slug: 'petrol-attendant' },
  { id: 12, name: 'Childcare Worker', slug: 'childcare-worker' },
  { id: 13, name: 'Landscaping/Gardener', slug: 'landscaping-gardener' },
  { id: 14, name: 'Driver', slug: 'driver' },
  { id: 15, name: 'Admin Clerk', slug: 'admin-clerk' },
  { id: 16, name: 'Hospitality Staff', slug: 'hospitality-staff' }
];

// Date range options
const DATE_RANGES = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' }
];

// Status options
const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'queued', label: 'Queued' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'distributed', label: 'Distributed' },
  { value: 'failed', label: 'Failed' }
];

// Priority options
const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All Priorities' },
  { value: '1', label: 'Priority 1 (Lowest)' },
  { value: '2', label: 'Priority 2' },
  { value: '3', label: 'Priority 3' },
  { value: '4', label: 'Priority 4' },
  { value: '5', label: 'Priority 5 (Highest)' }
];

// Chart colors
const CHART_COLORS = ['#36B37E', '#FF5630', '#FFAB00', '#6554C0', '#00B8D9', '#6B778C'];

export const JobDistributionDashboard: React.FC = () => {
  // State for filters
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('30d');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [chartView, setChartView] = useState<string>('count');
  
  // State for modals
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  
  // Fetch data using the hooks
  const { 
    data: jobDistributionData, 
    isLoading: isJobsLoading,
    refetch: refetchJobs
  } = useJobDistribution(categoryFilter, dateRange, page, limit, statusFilter, priorityFilter, searchQuery);
  
  const {
    data: categoryDistributionData,
    isLoading: isCategoriesLoading
  } = useCategoryDistribution(dateRange);
  
  const {
    data: workflowData,
    isLoading: isWorkflowLoading
  } = useDistributionWorkflow(dateRange);
  
  const {
    data: geographicData,
    isLoading: isGeographicLoading
  } = useGeographicDistribution(categoryFilter, dateRange);
  
  const {
    data: matchingFactorsData,
    isLoading: isMatchingFactorsLoading
  } = useMatchingFactorsAnalysis(dateRange);
  
  const {
    data: algorithmConfig,
    isLoading: isAlgorithmConfigLoading,
    updateConfig
  } = useAlgorithmConfiguration();
  
  // Calculate summary statistics
  const totalJobs = jobDistributionData?.pagination?.totalItems || 0;
  const pendingJobs = categoryDistributionData?.reduce(
    (sum, category) => sum + category.distributionStatus.pending, 0
  ) || 0;
  const distributedJobs = categoryDistributionData?.reduce(
    (sum, category) => sum + category.distributionStatus.distributed, 0
  ) || 0;
  const failedJobs = categoryDistributionData?.reduce(
    (sum, category) => sum + category.distributionStatus.failed, 0
  ) || 0;
  
  // Prepare data for charts
  const categoryChartData = categoryDistributionData?.map(category => ({
    name: category.name,
    count: category.count,
    pending: category.distributionStatus.pending,
    distributed: category.distributionStatus.distributed,
    failed: category.distributionStatus.failed
  })) || [];
  
  const locationChartData = geographicData?.slice(0, 10) || [];
  
  const matchingFactorsChartData = matchingFactorsData || [];
  
  // Handle refresh
  const handleRefresh = () => {
    refetchJobs();
  };
  
  // Handle export
  const handleExport = (format: string) => {
    const apiUrl = `/api/dashboard/job-distribution/export?categoryFilter=${categoryFilter}&dateRange=${dateRange}&format=${format}`;
    window.open(apiUrl, '_blank');
  };
  
  // Handle algorithm settings
  const handleSaveAlgorithmSettings = (config: any) => {
    updateConfig(config);
    setSettingsOpen(false);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Job Distribution Dashboard</h1>
          <p className="text-gray-500">Manage and monitor job distribution across categories</p>
        </div>
        <div className="flex space-x-2 mt-4 md:mt-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                CSV Export
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('json')}>
                JSON Export
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                PDF Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={() => setSettingsOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Algorithm Settings
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Select Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {JOB_CATEGORIES.map(category => (
              <SelectItem key={category.id} value={category.slug}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger>
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            {DATE_RANGES.map(range => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(status => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map(priority => (
              <SelectItem key={priority.value} value={priority.value}>
                {priority.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="Total Jobs" 
          value={totalJobs} 
          icon={<Briefcase className="h-6 w-6 text-blue-500" />} 
          trend={0} 
        />
        <StatCard 
          title="Pending Distribution" 
          value={pendingJobs} 
          icon={<Clock className="h-6 w-6 text-yellow-500" />} 
          trend={0} 
        />
        <StatCard 
          title="Successfully Distributed" 
          value={distributedJobs} 
          icon={<CheckCircle className="h-6 w-6 text-green-500" />} 
          trend={0} 
        />
        <StatCard 
          title="Distribution Failures" 
          value={failedJobs} 
          icon={<AlertTriangle className="h-6 w-6 text-red-500" />} 
          trend={0} 
        />
      </div>
      
      {/* Distribution Workflow */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Distribution Workflow</h2>
        <div className="flex flex-col md:flex-row justify-between items-center">
          <WorkflowCard
            icon={<Database className="h-6 w-6 text-blue-500" />}
            title="Job Intake"
            count={workflowData?.jobIntake || 0}
            description="Jobs collected from various sources"
          />
          <ChevronRight className="transform rotate-90 md:rotate-0 my-2 md:my-0" />
          <WorkflowCard
            icon={<Filter className="h-6 w-6 text-purple-500" />}
            title="Rule Matching"
            count={workflowData?.ruleMatching || 0}
            description="Jobs matched against marketing rules"
          />
          <ChevronRight className="transform rotate-90 md:rotate-0 my-2 md:my-0" />
          <WorkflowCard
            icon={<MessageSquare className="h-6 w-6 text-orange-500" />}
            title="CTA Injection"
            count={workflowData?.ctaInjection || 0}
            description="Custom messages added to job listings"
          />
          <ChevronRight className="transform rotate-90 md:rotate-0 my-2 md:my-0" />
          <WorkflowCard
            icon={<Send className="h-6 w-6 text-green-500" />}
            title="Distribution"
            count={workflowData?.distribution || 0}
            description="Enhanced jobs published to users"
          />
        </div>
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Category Distribution Chart */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Category Distribution</CardTitle>
                <CardDescription>Jobs by category and status</CardDescription>
              </div>
              <Select value={chartView} onValueChange={setChartView}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="View" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="count">Job Count</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="status">By Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                {chartView === 'status' ? (
                  <BarChart data={categoryChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="pending" stackId="status" fill="#FFAB00" name="Pending" />
                    <Bar dataKey="distributed" stackId="status" fill="#36B37E" name="Distributed" />
                    <Bar dataKey="failed" stackId="status" fill="#FF5630" name="Failed" />
                  </BarChart>
                ) : (
                  <BarChart data={categoryChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#6554C0" name="Job Count" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Geographic Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Geographic Distribution</CardTitle>
            <CardDescription>Jobs by location</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={locationChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="location" type="category" width={150} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#00B8D9" name="Job Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Matching Factors Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Matching Factors Analysis</CardTitle>
            <CardDescription>Factors contributing to job matches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={matchingFactorsChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="percentage"
                    nameKey="factor"
                  >
                    {matchingFactorsChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Distribution Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Distribution Performance</CardTitle>
            <CardDescription>Key performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Average Match Score</div>
                <div className="text-2xl font-bold">72.5%</div>
                <div className="text-xs text-green-500">+3.2% from last period</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Distribution Rate</div>
                <div className="text-2xl font-bold">89.3%</div>
                <div className="text-xs text-green-500">+1.7% from last period</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Avg. Time to Distribute</div>
                <div className="text-2xl font-bold">1.4 hrs</div>
                <div className="text-xs text-red-500">+0.2 hrs from last period</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">User Engagement</div>
                <div className="text-2xl font-bold">42.8%</div>
                <div className="text-xs text-green-500">+5.3% from last period</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Job Distribution Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Job Distribution Queue</h2>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
        
        <div className="mb-4">
          <Input
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
        
        <JobDistributionTable 
          jobs={jobDistributionData?.data || []}
          isLoading={isJobsLoading}
          onRefresh={handleRefresh}
        />
        
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-500">
            Showing {jobDistributionData?.data?.length || 0} of {jobDistributionData?.pagination?.totalItems || 0} jobs
          </div>
          <Pagination
            currentPage={page}
            totalPages={jobDistributionData?.pagination?.totalPages || 1}
            onPageChange={setPage}
          />
        </div>
      </div>
      
      {/* Algorithm Settings Modal */}
      {algorithmConfig && (
        <AlgorithmSettingsModal
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          config={algorithmConfig}
          onSave={handleSaveAlgorithmSettings}
          categories={JOB_CATEGORIES}
        />
      )}
    </div>
  );
};

export default JobDistributionDashboard;
