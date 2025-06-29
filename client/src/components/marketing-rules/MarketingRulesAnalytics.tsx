import React from 'react';
import { useQuery } from '@tanstack/react-query';
import marketingRuleService from '@/services/marketingRuleService';
import { MarketingRuleStats, MarketingRuleAnalyticsData } from '@/types/marketing-rules';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';

const MarketingRulesAnalytics: React.FC = () => {
  // Fetch analytics data
  const { data: analytics = [], isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ['marketingRulesAnalytics'],
    queryFn: marketingRuleService.getRulesAnalytics,
  });

  // Fetch rules to get names
  const { data: rules = [], isLoading: isLoadingRules } = useQuery({
    queryKey: ['marketingRules'],
    queryFn: marketingRuleService.getRules,
  });

  // Fetch overall stats
  const { data: stats, isLoading: isLoadingStats } = useQuery<MarketingRuleStats>({
    queryKey: ['marketingRulesStats'],
    queryFn: marketingRuleService.getOverallStats,
  });

  // Fetch analytics dashboard data
  const { data: analyticsData, isLoading: isLoadingAnalyticsData } = useQuery<MarketingRuleAnalyticsData>({
    queryKey: ['marketingRulesAnalyticsData'],
    queryFn: marketingRuleService.getMarketingAnalytics,
  });

  // Combine analytics with rule names
  const analyticsWithNames = React.useMemo(() => {
    return analytics.map(item => {
      const rule = rules.find(r => r.id === item.ruleId);
      return {
        ...item,
        name: rule?.name || `Rule ${item.ruleId}`,
      };
    });
  }, [analytics, rules]);

  // Format percentage for display
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Determine trend icon and color
  const getTrendDisplay = (trend: number) => {
    if (trend > 0) {
      return {
        icon: <ArrowUpIcon className="h-4 w-4 text-green-500" />,
        color: 'text-green-500',
      };
    } else if (trend < 0) {
      return {
        icon: <ArrowDownIcon className="h-4 w-4 text-red-500" />,
        color: 'text-red-500',
      };
    }
    return {
      icon: null,
      color: 'text-gray-500',
    };
  };

  // Loading state
  if (isLoadingAnalytics || isLoadingRules || isLoadingStats || isLoadingAnalyticsData) {
    return <div className="text-center py-8">Loading analytics data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeRules || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Inactive Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.inactiveRules || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Jobs Processed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.jobsProcessed.toLocaleString() || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Click Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(stats?.ctaClickRate || 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Views and Clicks Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Views & Clicks by Rule</CardTitle>
            <CardDescription>
              Comparison of views and clicks across all marketing rules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analyticsData?.performanceByRule || []}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={70}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip formatter={(value) => value.toLocaleString()} />
                  <Bar dataKey="clicks" name="Clicks" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>
              Key metrics for the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Total Views</h3>
                <div className="flex items-center">
                  <span className="text-2xl font-bold mr-2">{analyticsData?.totalViews.toLocaleString() || 0}</span>
                  {analyticsData && (
                    <div className={`flex items-center ${analyticsData.viewsChangePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {analyticsData.viewsChangePercent >= 0 ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
                      <span className="text-sm">{formatPercentage(Math.abs(analyticsData.viewsChangePercent))}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Total Clicks</h3>
                <div className="flex items-center">
                  <span className="text-2xl font-bold mr-2">{analyticsData?.totalClicks.toLocaleString() || 0}</span>
                  {analyticsData && (
                    <div className={`flex items-center ${analyticsData.clicksChangePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {analyticsData.clicksChangePercent >= 0 ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
                      <span className="text-sm">{formatPercentage(Math.abs(analyticsData.clicksChangePercent))}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Click-Through Rate</h3>
                <div className="flex items-center">
                  <span className="text-2xl font-bold mr-2">{analyticsData ? formatPercentage(analyticsData.clickThroughRate) : '0%'}</span>
                  {analyticsData && (
                    <div className={`flex items-center ${analyticsData.ctrChangePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {analyticsData.ctrChangePercent >= 0 ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
                      <span className="text-sm">{formatPercentage(Math.abs(analyticsData.ctrChangePercent))}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Performance Metrics</CardTitle>
          <CardDescription>
            Performance breakdown for each marketing rule
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Rule Name</th>
                  <th className="text-right py-3 px-4">Views</th>
                  <th className="text-right py-3 px-4">Clicks</th>
                  <th className="text-right py-3 px-4">Click-Through Rate</th>
                  <th className="text-right py-3 px-4">Trend</th>
                </tr>
              </thead>
              <tbody>
                {analyticsWithNames.map((item, index) => {
                  const { icon, color } = getTrendDisplay(item.trend);
                  return (
                    <tr key={index} className="border-b">
                      <td className="py-3 px-4">{item.name}</td>
                      <td className="text-right py-3 px-4">{item.views.toLocaleString()}</td>
                      <td className="text-right py-3 px-4">{item.clicks.toLocaleString()}</td>
                      <td className="text-right py-3 px-4">{formatPercentage(item.clickThroughRate)}</td>
                      <td className="text-right py-3 px-4">
                        <div className={`flex items-center justify-end ${color}`}>
                          {icon}
                          <span className="ml-1">{formatPercentage(Math.abs(item.trend))}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketingRulesAnalytics;
