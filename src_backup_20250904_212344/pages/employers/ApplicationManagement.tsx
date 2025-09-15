import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  Building, 
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  Users,
  Briefcase,
  Mail,
  Phone,
  Download,
  MoreHorizontal,
  User,
  Star,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { jobApplicationService, JobApplication } from '@/services/jobApplicationService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Status configuration
const STATUS_CONFIG = {
  applied: { 
    label: 'Applied', 
    color: 'bg-blue-100 text-blue-800 border-blue-200', 
    icon: FileText,
    description: 'Application submitted'
  },
  reviewed: { 
    label: 'Under Review', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
    icon: Eye,
    description: 'Application being reviewed'
  },
  interview: { 
    label: 'Interview', 
    color: 'bg-purple-100 text-purple-800 border-purple-200', 
    icon: Users,
    description: 'Interview scheduled'
  },
  rejected: { 
    label: 'Rejected', 
    color: 'bg-red-100 text-red-800 border-red-200', 
    icon: XCircle,
    description: 'Application not successful'
  },
  hired: { 
    label: 'Hired', 
    color: 'bg-green-100 text-green-800 border-green-200', 
    icon: CheckCircle,
    description: 'Candidate hired'
  },
};

/**
 * Application Management Dashboard for Employers
 */
const ApplicationManagement: React.FC = () => {
  const { jobId } = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State management
  const [activeTab, setActiveTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('appliedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('');
  const [updateNotes, setUpdateNotes] = useState('');

  // Fetch applications data
  const {
    data: applicationsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['employerApplications', { jobId, page: currentPage, limit: pageSize, status: statusFilter === 'all' ? undefined : statusFilter, sortBy, sortOrder }],
    queryFn: () => jobId 
      ? jobApplicationService.getJobApplications(jobId, { page: currentPage, limit: pageSize, status: statusFilter === 'all' ? undefined : statusFilter, sortBy, sortOrder })
      : jobApplicationService.getUserApplications({ page: currentPage, limit: pageSize, status: statusFilter === 'all' ? undefined : statusFilter, sortBy, sortOrder }),
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Update application mutation
  const updateApplicationMutation = useMutation({
    mutationFn: ({ applicationId, updates }: { 
      applicationId: number; 
      updates: { status?: string; notes?: string } 
    }) => 
      jobApplicationService.updateApplication(applicationId.toString(), updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employerApplications'] });
      toast({
        title: "Application Updated",
        description: "Application status has been updated successfully.",
      });
      setIsUpdateModalOpen(false);
      setSelectedApplication(null);
      setUpdateStatus('');
      setUpdateNotes('');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update application.",
        variant: "destructive",
      });
    },
  });

  // Filter applications by search query
  const filteredApplications = (applicationsData?.applications || []).filter(app => 
    searchQuery === '' || 
    app.jobId.toString().includes(searchQuery.toLowerCase()) ||
    app.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.coverLetter?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get statistics
  const getApplicationStats = () => {
    const applications = applicationsData?.applications || [];
    return {
      total: applications.length,
      applied: applications.filter(app => app.status === 'applied').length,
      reviewed: applications.filter(app => app.status === 'reviewed').length,
      interview: applications.filter(app => app.status === 'interview').length,
      rejected: applications.filter(app => app.status === 'rejected').length,
      hired: applications.filter(app => app.status === 'hired').length,
    };
  };

  const stats = getApplicationStats();

  // Handle status filter change
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'all') {
      setStatusFilter('all');
    } else {
      setStatusFilter(value);
    }
    setCurrentPage(1);
  };

  // Handle application update
  const handleUpdateApplication = (application: JobApplication) => {
    setSelectedApplication(application);
    setUpdateStatus(application.status);
    setUpdateNotes(application.notes || '');
    setIsUpdateModalOpen(true);
  };

  // Submit application update
  const handleSubmitUpdate = () => {
    if (!selectedApplication) return;
    
    updateApplicationMutation.mutate({
      applicationId: selectedApplication.id,
      updates: {
        status: updateStatus,
        notes: updateNotes.trim() || undefined,
      }
    });
  };

  // Format dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle unauthenticated users
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Alert variant="destructive" className="w-96">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please log in to access the application management dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Helmet>
        <title>Application Management | WorkWise SA</title>
        <meta name="description" content="Manage job applications and candidates" />
      </Helmet>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Application Management</h1>
          <p className="text-gray-500">
            {jobId ? `Applications for Job #${jobId}` : 'Manage all job applications'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/employers/dashboard')}
            className="flex items-center gap-2"
          >
            <Briefcase className="h-4 w-4" />
            Dashboard
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <Card className="bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold mt-1">{stats.total}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Applied</p>
                <p className="text-2xl font-bold mt-1">{stats.applied}</p>
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
                <p className="text-sm text-gray-500">Under Review</p>
                <p className="text-2xl font-bold mt-1">{stats.reviewed}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Eye className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-indigo-50">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Interview</p>
                <p className="text-2xl font-bold mt-1">{stats.interview}</p>
              </div>
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Users className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Rejected</p>
                <p className="text-2xl font-bold mt-1">{stats.rejected}</p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Hired</p>
                <p className="text-2xl font-bold mt-1">{stats.hired}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search applications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="appliedAt">Date Applied</SelectItem>
                  <SelectItem value="updatedAt">Last Updated</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest First</SelectItem>
                  <SelectItem value="asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Status Filtering */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
        <TabsList className="grid w-full md:w-fit grid-cols-3 md:grid-cols-6">
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="applied">Applied ({stats.applied})</TabsTrigger>
          <TabsTrigger value="reviewed">Review ({stats.reviewed})</TabsTrigger>
          <TabsTrigger value="interview">Interview ({stats.interview})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
          <TabsTrigger value="hired">Hired ({stats.hired})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Error State */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load applications. Please try again.
          </AlertDescription>
        </Alert>
      )}

      {/* Applications List */}
      <div className="space-y-4">
        {isLoading ? (
          // Loading skeletons
          Array(5).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                  <Skeleton className="h-8 w-20 rounded-full" />
                </div>
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredApplications.length > 0 ? (
          // Applications list
          filteredApplications.map((application) => {
            const statusConfig = STATUS_CONFIG[application.status as keyof typeof STATUS_CONFIG];
            const StatusIcon = statusConfig?.icon || FileText;

            return (
              <Card key={application.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge 
                          variant="outline" 
                          className={`${statusConfig?.color || 'bg-gray-100 text-gray-800'} flex items-center gap-1`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig?.label || application.status}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          Application #{application.id}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold mb-1">
                        Job Application #{application.jobId}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {statusConfig?.description || 'Application status update'}
                      </p>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleUpdateApplication(application)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Update Status
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Download Resume
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Application Details */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>Applied: {formatDate(application.appliedAt)}</span>
                      </div>
                      
                      {application.updatedAt !== application.appliedAt && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>Updated: {formatDateTime(application.updatedAt)}</span>
                        </div>
                      )}

                      {application.coverLetter && (
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <FileText className="h-4 w-4 mt-0.5" />
                          <span>Cover letter included</span>
                        </div>
                      )}

                      {application.resumeUrl && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FileText className="h-4 w-4" />
                          <span>Resume attached</span>
                        </div>
                      )}
                    </div>

                    {/* Status-specific information */}
                    <div className="space-y-3">
                      {application.notes && (
                        <div className="p-3 bg-gray-50 rounded-lg border">
                          <div className="text-sm font-medium text-gray-700 mb-1">Notes:</div>
                          <p className="text-sm text-gray-600">{application.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleUpdateApplication(application)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Update Status
                      </Button>
                      
                      {application.resumeUrl && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download Resume
                        </Button>
                      )}
                    </div>

                    <div className="text-xs text-gray-500">
                      Application ID: {application.id}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          // Empty state
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No applications found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'No applications have been submitted yet'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Update Application Modal */}
      <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Application Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={updateStatus} onValueChange={setUpdateStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="reviewed">Under Review</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="hired">Hired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this application..."
                value={updateNotes}
                onChange={(e) => setUpdateNotes(e.target.value)}
                rows={4}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setIsUpdateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitUpdate}
                disabled={updateApplicationMutation.isPending}
              >
                {updateApplicationMutation.isPending ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApplicationManagement;