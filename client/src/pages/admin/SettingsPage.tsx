import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Save,
  Upload,
  Download,
  Users,
  Settings,
  Bell,
  Shield,
  BarChart3,
  MessageSquare,
  Share2,
  Palette,
  Sliders,
  FileText,
  AlertTriangle,
  Beaker
} from 'lucide-react';
import AdminLayout from '@/components/marketing-rules/AdminLayout';

const SettingsPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('general');
  
  // Mock save function
  const handleSave = () => {
    toast({
      title: 'Settings Saved',
      description: 'Your settings have been successfully saved.',
    });
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>Admin Settings | WorkWise SA</title>
        <meta name="description" content="Configure system settings for WorkWise SA" />
      </Helmet>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Admin Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure system settings for marketing rules and entry-level job management
        </p>
      </div>

      <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 md:grid-cols-9 gap-2">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden md:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden md:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="marketing" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden md:inline">Marketing</span>
          </TabsTrigger>
          <TabsTrigger value="distribution" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            <span className="hidden md:inline">Distribution</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden md:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden md:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            <span className="hidden md:inline">Import/Export</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden md:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="experimental" className="flex items-center gap-2">
            <Beaker className="h-4 w-4" />
            <span className="hidden md:inline">Experimental</span>
          </TabsTrigger>
        </TabsList>     
   {/* 1. General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Site Branding</CardTitle>
              <CardDescription>
                Configure your site branding and appearance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="logo">Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 bg-muted rounded flex items-center justify-center">
                    <img src="/logo.png" alt="Current logo" className="max-h-14 max-w-14" />
                  </div>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload New Logo
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="primary-color">Primary Color</Label>
                <div className="flex items-center gap-4">
                  <Input 
                    id="primary-color" 
                    type="color" 
                    defaultValue="#0066CC" 
                    className="w-16 h-10" 
                  />
                  <Input 
                    type="text" 
                    defaultValue="#0066CC" 
                    className="w-32" 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="header-text">Header Text</Label>
                <Input 
                  id="header-text" 
                  defaultValue="WorkWise SA - Find Your Next Opportunity" 
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Default Location/Region</CardTitle>
              <CardDescription>
                Set default region for new job rules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-region">Default Region</Label>
                <Select defaultValue="gauteng">
                  <SelectTrigger>
                    <SelectValue placeholder="Select a region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gauteng">Gauteng</SelectItem>
                    <SelectItem value="western-cape">Western Cape</SelectItem>
                    <SelectItem value="kwazulu-natal">KwaZulu-Natal</SelectItem>
                    <SelectItem value="eastern-cape">Eastern Cape</SelectItem>
                    <SelectItem value="free-state">Free State</SelectItem>
                    <SelectItem value="north-west">North West</SelectItem>
                    <SelectItem value="mpumalanga">Mpumalanga</SelectItem>
                    <SelectItem value="limpopo">Limpopo</SelectItem>
                    <SelectItem value="northern-cape">Northern Cape</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>  
        
          <Card>
            <CardHeader>
              <CardTitle>Default Job Type</CardTitle>
              <CardDescription>
                Select most common entry job types
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch id="retail" defaultChecked />
                  <Label htmlFor="retail">Retail</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="security" defaultChecked />
                  <Label htmlFor="security">Security</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="cleaning" defaultChecked />
                  <Label htmlFor="cleaning">Cleaning</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="hospitality" />
                  <Label htmlFor="hospitality">Hospitality</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="call-center" />
                  <Label htmlFor="call-center">Call Center</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="admin" />
                  <Label htmlFor="admin">Administrative</Label>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </TabsContent>

        {/* 2. User & Role Management */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manage Admins</CardTitle>
              <CardDescription>
                Add, remove, and manage admin permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <div>
                    <p className="font-medium">admin@workwisesa.co.za</p>
                    <p className="text-sm text-muted-foreground">Full Admin</p>
                  </div>
                  <Select defaultValue="full-admin">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-admin">Full Admin</SelectItem>
                      <SelectItem value="rule-editor">Rule Editor</SelectItem>
                      <SelectItem value="analytics-viewer">Analytics Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div> 
               
                <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <div>
                    <p className="font-medium">marketing@workwisesa.co.za</p>
                    <p className="text-sm text-muted-foreground">Rule Editor</p>
                  </div>
                  <Select defaultValue="rule-editor">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-admin">Full Admin</SelectItem>
                      <SelectItem value="rule-editor">Rule Editor</SelectItem>
                      <SelectItem value="analytics-viewer">Analytics Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 mt-4">
                <Input placeholder="Enter email address" />
                <Select defaultValue="rule-editor">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-admin">Full Admin</SelectItem>
                    <SelectItem value="rule-editor">Rule Editor</SelectItem>
                    <SelectItem value="analytics-viewer">Analytics Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <Button>Add Admin</Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Activity Logs</CardTitle>
              <CardDescription>
                View admin actions history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="p-3 border-b">
                  <p className="text-sm font-medium">Marketing rule "Gauteng Retail" created</p>
                  <p className="text-xs text-muted-foreground">By admin@workwisesa.co.za • 2 hours ago</p>
                </div>
                <div className="p-3 border-b">
                  <p className="text-sm font-medium">Marketing rule "Cape Town Security" edited</p>
                  <p className="text-xs text-muted-foreground">By marketing@workwisesa.co.za • Yesterday</p>
                </div>
                <div className="p-3 border-b">
                  <p className="text-sm font-medium">New admin user added: analytics@workwisesa.co.za</p>
                  <p className="text-xs text-muted-foreground">By admin@workwisesa.co.za • 3 days ago</p>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4">View All Activity</Button>
            </CardContent>
          </Card>      
    
          <div className="flex justify-end">
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </TabsContent>

        {/* 3. Marketing Rule Settings */}
        <TabsContent value="marketing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>CTA Templates Manager</CardTitle>
              <CardDescription>
                Save and manage reusable call-to-action phrases
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-3 bg-muted rounded-md flex justify-between items-center">
                  <p>"No experience? No problem! Apply now."</p>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">Edit</Button>
                    <Button variant="ghost" size="sm">Delete</Button>
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-md flex justify-between items-center">
                  <p>"Perfect for first-time job seekers! Click to apply."</p>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">Edit</Button>
                    <Button variant="ghost" size="sm">Delete</Button>
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-md flex justify-between items-center">
                  <p>"Start your career today! Easy application process."</p>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">Edit</Button>
                    <Button variant="ghost" size="sm">Delete</Button>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 mt-4">
                <Input placeholder="Enter new CTA template" />
                <Button>Add Template</Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Rule Automation Settings</CardTitle>
              <CardDescription>
                Configure automatic rule behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-enable">Auto-enable new rules</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically enable rules when created
                  </p>
                </div>
                <Switch id="auto-enable" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-deactivate">Auto-deactivate rules</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically deactivate rules after a set period
                  </p>
                </div>
                <Switch id="auto-deactivate" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deactivate-days">Days until auto-deactivation</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    defaultValue={[30]}
                    max={90}
                    step={1}
                    className="flex-1"
                  />
                  <span className="w-12 text-center">30</span>
                </div>
              </div>
            </CardContent>
          </Card>     
     
          <Card>
            <CardHeader>
              <CardTitle>Rule Priority System</CardTitle>
              <CardDescription>
                Configure how rules are prioritized
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Priority Order (Drag to reorder)</Label>
                <div className="space-y-2">
                  <div className="p-3 bg-muted rounded-md flex items-center gap-3">
                    <span className="text-muted-foreground">1</span>
                    <span>Location-specific rules</span>
                  </div>
                  <div className="p-3 bg-muted rounded-md flex items-center gap-3">
                    <span className="text-muted-foreground">2</span>
                    <span>Job type-specific rules</span>
                  </div>
                  <div className="p-3 bg-muted rounded-md flex items-center gap-3">
                    <span className="text-muted-foreground">3</span>
                    <span>General rules</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <div className="space-y-0.5">
                  <Label htmlFor="weight-system">Enable rule weight system</Label>
                  <p className="text-sm text-muted-foreground">
                    Use numerical weights to determine rule priority
                  </p>
                </div>
                <Switch id="weight-system" />
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </TabsContent>

        {/* 4. Distribution & CTA Injection Settings */}
        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>CTA Impression Limit</CardTitle>
              <CardDescription>
                Cap how many times a CTA is shown per user/session
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enable-impression-limit">Enable impression limit</Label>
                  <p className="text-sm text-muted-foreground">
                    Limit how many times a user sees the same CTA
                  </p>
                </div>
                <Switch id="enable-impression-limit" defaultChecked />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="impression-limit">Maximum impressions per user</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    defaultValue={[3]}
                    max={10}
                    step={1}
                    className="flex-1"
                  />
                  <span className="w-12 text-center">3</span>
                </div>
              </div> 
             
              <div className="space-y-2">
                <Label htmlFor="impression-period">Reset period</Label>
                <Select defaultValue="daily">
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="session">Per session</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Injection Placement Control</CardTitle>
              <CardDescription>
                Choose where CTAs appear in job listings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Default placement</Label>
                <Select defaultValue="top">
                  <SelectTrigger>
                    <SelectValue placeholder="Select placement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Top of listing</SelectItem>
                    <SelectItem value="middle">Middle of listing</SelectItem>
                    <SelectItem value="bottom">Bottom of listing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <div className="space-y-0.5">
                  <Label htmlFor="allow-rule-override">Allow rule-specific placement</Label>
                  <p className="text-sm text-muted-foreground">
                    Let individual rules override the default placement
                  </p>
                </div>
                <Switch id="allow-rule-override" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <div className="space-y-0.5">
                  <Label htmlFor="highlight-cta">Highlight CTAs</Label>
                  <p className="text-sm text-muted-foreground">
                    Add visual emphasis to CTAs in job listings
                  </p>
                </div>
                <Switch id="highlight-cta" defaultChecked />
              </div>
            </CardContent>
          </Card>       
   
          <Card>
            <CardHeader>
              <CardTitle>Integration Channels</CardTitle>
              <CardDescription>
                Enable/disable platforms for CTA distribution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch id="web" defaultChecked />
                  <Label htmlFor="web">Website</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="email" defaultChecked />
                  <Label htmlFor="email">Email</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="sms" />
                  <Label htmlFor="sms">SMS</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="push" />
                  <Label htmlFor="push">Push Notifications</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="whatsapp" />
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="social" />
                  <Label htmlFor="social">Social Media</Label>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </TabsContent>

        {/* 5. Analytics & Reporting Settings */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tracking Configurations</CardTitle>
              <CardDescription>
                Configure analytics tracking services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="google-analytics">Google Analytics</Label>
                  <p className="text-sm text-muted-foreground">
                    Track user interactions with Google Analytics
                  </p>
                </div>
                <Switch id="google-analytics" defaultChecked />
              </div>            
  
              <div className="space-y-2">
                <Label htmlFor="ga-id">Google Analytics ID</Label>
                <Input id="ga-id" placeholder="UA-XXXXXXXXX-X or G-XXXXXXXXXX" defaultValue="G-ABC123XYZ" />
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <div className="space-y-0.5">
                  <Label htmlFor="mixpanel">Mixpanel</Label>
                  <p className="text-sm text-muted-foreground">
                    Track user behavior with Mixpanel
                  </p>
                </div>
                <Switch id="mixpanel" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mixpanel-id">Mixpanel Project Token</Label>
                <Input id="mixpanel-id" placeholder="Enter your Mixpanel token" />
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <div className="space-y-0.5">
                  <Label htmlFor="custom-events">Track custom events</Label>
                  <p className="text-sm text-muted-foreground">
                    Track specific user interactions with CTAs
                  </p>
                </div>
                <Switch id="custom-events" defaultChecked />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Export Frequency</CardTitle>
              <CardDescription>
                Set how often analytics data is exported
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Analytics export frequency</Label>
                <Select defaultValue="weekly">
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Export format</Label>
                <Select defaultValue="csv">
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                  </SelectContent>
                </Select>
              </div>  
            
              <div className="space-y-2">
                <Label htmlFor="export-email">Email reports to</Label>
                <Input id="export-email" type="email" placeholder="Enter email address" defaultValue="admin@workwisesa.co.za" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>CTR Threshold Alerts</CardTitle>
              <CardDescription>
                Get notified when CTR drops below threshold
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enable-ctr-alerts">Enable CTR alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when click-through rate drops
                  </p>
                </div>
                <Switch id="enable-ctr-alerts" defaultChecked />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ctr-threshold">CTR threshold percentage</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    defaultValue={[10]}
                    max={30}
                    step={1}
                    className="flex-1"
                  />
                  <span className="w-12 text-center">10%</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="alert-email">Send alerts to</Label>
                <Input id="alert-email" type="email" placeholder="Enter email address" defaultValue="marketing@workwisesa.co.za" />
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </TabsContent>

        {/* 6. Security & Privacy */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>2FA for Admins</CardTitle>
              <CardDescription>
                Configure two-factor authentication for admin users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="require-2fa">Require 2FA for all admins</Label>
                  <p className="text-sm text-muted-foreground">
                    Make two-factor authentication mandatory
                  </p>
                </div>
                <Switch id="require-2fa" />
              </div>     
         
              <div className="space-y-2">
                <Label>2FA method</Label>
                <Select defaultValue="app">
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="app">Authenticator app</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <div className="space-y-0.5">
                  <Label htmlFor="remember-device">Remember device for 30 days</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow trusted devices to skip 2FA for 30 days
                  </p>
                </div>
                <Switch id="remember-device" defaultChecked />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>IP Whitelisting</CardTitle>
              <CardDescription>
                Only allow admin login from specific IPs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enable-ip-whitelist">Enable IP whitelisting</Label>
                  <p className="text-sm text-muted-foreground">
                    Restrict admin access to specific IP addresses
                  </p>
                </div>
                <Switch id="enable-ip-whitelist" />
              </div>
              
              <div className="space-y-2">
                <Label>Whitelisted IPs</Label>
                <Textarea 
                  placeholder="Enter IP addresses, one per line" 
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-ip-block">Notify on blocked attempts</Label>
                  <p className="text-sm text-muted-foreground">
                    Send notification when login is blocked by IP
                  </p>
                </div>
                <Switch id="notify-ip-block" defaultChecked />
              </div>
            </CardContent>
          </Card>  
        
          <Card>
            <CardHeader>
              <CardTitle>Data Retention Settings</CardTitle>
              <CardDescription>
                Configure how long data is stored
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Job data retention period</Label>
                <Select defaultValue="6">
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 months</SelectItem>
                    <SelectItem value="6">6 months</SelectItem>
                    <SelectItem value="12">12 months</SelectItem>
                    <SelectItem value="24">24 months</SelectItem>
                    <SelectItem value="forever">Keep forever</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-delete">Auto-delete expired data</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically remove data older than retention period
                  </p>
                </div>
                <Switch id="auto-delete" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <div className="space-y-0.5">
                  <Label htmlFor="privacy-mode">Privacy mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Obfuscate jobseeker info in analytics views
                  </p>
                </div>
                <Switch id="privacy-mode" defaultChecked />
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </TabsContent>

        {/* 7. Import/Export Tools */}
        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Rule Upload</CardTitle>
              <CardDescription>
                Import marketing rules in bulk
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Import format</Label>
                <Select defaultValue="csv">
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                  </SelectContent>
                </Select>
              </div>  
            
              <div className="space-y-2">
                <Label>Upload file</Label>
                <div className="flex items-center gap-4">
                  <Input type="file" />
                  <Button>Upload</Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <div className="space-y-0.5">
                  <Label htmlFor="overwrite-existing">Overwrite existing rules</Label>
                  <p className="text-sm text-muted-foreground">
                    Replace existing rules with imported ones
                  </p>
                </div>
                <Switch id="overwrite-existing" />
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <div className="space-y-0.5">
                  <Label htmlFor="validate-import">Validate before import</Label>
                  <p className="text-sm text-muted-foreground">
                    Check for errors before importing rules
                  </p>
                </div>
                <Switch id="validate-import" defaultChecked />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Backup Configurations</CardTitle>
              <CardDescription>
                Export system settings and rules for backup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>What to export</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="export-rules" defaultChecked />
                    <Label htmlFor="export-rules">Marketing Rules</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="export-settings" defaultChecked />
                    <Label htmlFor="export-settings">System Settings</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="export-templates" defaultChecked />
                    <Label htmlFor="export-templates">CTA Templates</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="export-analytics" />
                    <Label htmlFor="export-analytics">Analytics Data</Label>
                  </div>
                </div>
              </div>    
          
              <div className="space-y-2">
                <Label>Export format</Label>
                <Select defaultValue="json">
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button className="mt-4">
                <Download className="h-4 w-4 mr-2" />
                Export Backup
              </Button>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </TabsContent>

        {/* 8. Notifications */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Admin Alerts</CardTitle>
              <CardDescription>
                Configure notifications for system events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Alert types</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="alert-rule-failure" defaultChecked />
                    <Label htmlFor="alert-rule-failure">Failed rule injections</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="alert-api-error" defaultChecked />
                    <Label htmlFor="alert-api-error">API errors</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="alert-login" defaultChecked />
                    <Label htmlFor="alert-login">Admin login attempts</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="alert-rule-change" />
                    <Label htmlFor="alert-rule-change">Rule changes</Label>
                  </div>
                </div>
              </div> 
             
              <div className="space-y-2">
                <Label>Notification channels</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="notify-email" defaultChecked />
                    <Label htmlFor="notify-email">Email</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="notify-dashboard" defaultChecked />
                    <Label htmlFor="notify-dashboard">Dashboard</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="notify-sms" />
                    <Label htmlFor="notify-sms">SMS</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="notify-slack" />
                    <Label htmlFor="notify-slack">Slack</Label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="alert-email">Alert email recipients</Label>
                <Input id="alert-email" type="text" placeholder="Enter email addresses (comma separated)" defaultValue="admin@workwisesa.co.za" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Weekly Digest</CardTitle>
              <CardDescription>
                Configure weekly performance summary emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enable-digest">Enable weekly digest</Label>
                  <p className="text-sm text-muted-foreground">
                    Send weekly summary of rule performance
                  </p>
                </div>
                <Switch id="enable-digest" defaultChecked />
              </div>
              
              <div className="space-y-2">
                <Label>Send on day</Label>
                <Select defaultValue="monday">
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monday">Monday</SelectItem>
                    <SelectItem value="tuesday">Tuesday</SelectItem>
                    <SelectItem value="wednesday">Wednesday</SelectItem>
                    <SelectItem value="thursday">Thursday</SelectItem>
                    <SelectItem value="friday">Friday</SelectItem>
                    <SelectItem value="saturday">Saturday</SelectItem>
                    <SelectItem value="sunday">Sunday</SelectItem>
                  </SelectContent>
                </Select>
              </div>  
            
              <div className="space-y-2">
                <Label htmlFor="digest-recipients">Digest recipients</Label>
                <Textarea 
                  id="digest-recipients"
                  placeholder="Enter email addresses, one per line"
                  defaultValue="admin@workwisesa.co.za&#10;marketing@workwisesa.co.za"
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Include in digest</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="digest-performance" defaultChecked />
                    <Label htmlFor="digest-performance">Rule performance</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="digest-new-rules" defaultChecked />
                    <Label htmlFor="digest-new-rules">New rules</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="digest-issues" defaultChecked />
                    <Label htmlFor="digest-issues">Issues detected</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="digest-recommendations" defaultChecked />
                    <Label htmlFor="digest-recommendations">Recommendations</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </TabsContent>

        {/* 9. Experimental Features */}
        <TabsContent value="experimental" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Experimental Features</CardTitle>
                <CardDescription>
                  Enable beta and experimental features
                </CardDescription>
              </div>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-sm text-amber-500 mb-4">
                Warning: These features are experimental and may not work as expected.
              </p>    
          
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="ab-testing">A/B Test Rules</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable split testing for CTAs
                    </p>
                  </div>
                  <Switch id="ab-testing" />
                </div>
                
                <div className="space-y-2">
                  <Label>A/B test variants</Label>
                  <Select defaultValue="2">
                    <SelectTrigger>
                      <SelectValue placeholder="Select number of variants" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 variants</SelectItem>
                      <SelectItem value="3">3 variants</SelectItem>
                      <SelectItem value="4">4 variants</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between mt-6">
                  <div className="space-y-0.5">
                    <Label htmlFor="ai-suggestions">Smart Suggestions</Label>
                    <p className="text-sm text-muted-foreground">
                      Auto-suggest best performing CTA texts using AI
                    </p>
                  </div>
                  <Switch id="ai-suggestions" />
                </div>
                
                <div className="space-y-2">
                  <Label>AI suggestion frequency</Label>
                  <Select defaultValue="weekly">
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between mt-6">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-targeting">Smart Audience Targeting</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically target rules to most receptive audiences
                    </p>
                  </div>
                  <Switch id="auto-targeting" />
                </div>
                
                <div className="flex items-center justify-between mt-6">
                  <div className="space-y-0.5">
                    <Label htmlFor="dynamic-cta">Dynamic CTA Generation</Label>
                    <p className="text-sm text-muted-foreground">
                      Generate personalized CTAs based on user behavior
                    </p>
                  </div>
                  <Switch id="dynamic-cta" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default SettingsPage;