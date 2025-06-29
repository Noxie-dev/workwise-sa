import React from 'react';
import { Link } from 'wouter';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Users,
  Settings,
  FileText,
  Bell,
  ShieldAlert
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
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
          <meta name="description" content="Admin dashboard for WorkWise SA" />
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

  const adminModules = [
    {
      title: 'Marketing Rules',
      description: 'Manage marketing rules for job listings',
      icon: <MessageSquare className="h-8 w-8 text-blue-500" />,
      link: '/marketing-rules',
      notifications: 2,
    },
    {
      title: 'Analytics',
      description: 'View site analytics and reports',
      icon: <BarChart3 className="h-8 w-8 text-green-500" />,
      link: '/admin/analytics',
      notifications: 0,
    },
    {
      title: 'User Management',
      description: 'Manage users and permissions',
      icon: <Users className="h-8 w-8 text-purple-500" />,
      link: '/admin/users',
      notifications: 5,
    },
    {
      title: 'Content Management',
      description: 'Manage site content and resources',
      icon: <FileText className="h-8 w-8 text-orange-500" />,
      link: '/admin/content',
      notifications: 0,
    },
    {
      title: 'Notifications',
      description: 'Manage system notifications',
      icon: <Bell className="h-8 w-8 text-red-500" />,
      link: '/admin/notifications',
      notifications: 12,
    },
    {
      title: 'Settings',
      description: 'Configure system settings',
      icon: <Settings className="h-8 w-8 text-gray-500" />,
      link: '/admin/settings',
      notifications: 0,
    },
  ];

  return (
    <div className="container py-8 max-w-[1200px] mx-auto">
      <Helmet>
        <title>Admin Dashboard | WorkWise SA</title>
        <meta name="description" content="Admin dashboard for WorkWise SA" />
      </Helmet>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage and monitor WorkWise SA platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Logged in as:</span>
          <span className="text-sm font-medium">{currentUser?.email}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminModules.map((module, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-muted rounded-lg">
                  {module.icon}
                </div>
                {module.notifications > 0 && (
                  <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                    {module.notifications}
                  </span>
                )}
              </div>
              <CardTitle className="mt-4">{module.title}</CardTitle>
              <CardDescription>{module.description}</CardDescription>
            </CardHeader>
            <CardFooter className="pt-2">
              <Button asChild className="w-full">
                <Link href={module.link}>Access Module</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
