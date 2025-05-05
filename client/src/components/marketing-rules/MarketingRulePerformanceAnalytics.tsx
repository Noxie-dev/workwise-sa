// client/src/components/marketing-rules/MarketingRulePerformanceAnalytics.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { MarketingRuleAnalyticsData } from '@/types/marketing-rules';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { ArrowUp, ArrowDown, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import marketingRuleService from '@/services/marketingRuleService';

export const MarketingRulePerformanceAnalytics: React.FC = () => {
    const [period, setPeriod] = React.useState<string>('Last 7 Days');

    const { data, isLoading, isError } = useQuery({
        queryKey: ['marketingRuleAnalytics', period],
        queryFn: () => marketingRuleService.getMarketingAnalytics(),
    });

    if (isLoading) {
        return <AnalyticsLoadingSkeleton />;
    }

    if (isError || !data) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Analytics</CardTitle>
                    <CardDescription>Performance metrics for marketing rules</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-destructive">
                        Error loading analytics data. Please try again.
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Format data for recharts
    const chartData = data.performanceByRule.map(item => ({
        name: item.name.length > 15 ? item.name.substring(0, 12) + '...' : item.name,
        clicks: item.clicks
    }));

    // Sample data for line chart
    const lineChartData = [
        { name: 'Mon', views: 1200, clicks: 240 },
        { name: 'Tue', views: 1300, clicks: 290 },
        { name: 'Wed', views: 1400, clicks: 350 },
        { name: 'Thu', views: 1200, clicks: 310 },
        { name: 'Fri', views: 1500, clicks: 390 },
        { name: 'Sat', views: 1100, clicks: 250 },
        { name: 'Sun', views: 1000, clicks: 220 },
    ];

    // Sample data for conversion funnel
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
    const funnelData = [
        { name: 'Views', value: 4721 },
        { name: 'Clicks', value: 1109 },
        { name: 'Applications', value: 562 },
        { name: 'Hires', value: 89 },
    ];

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle className="text-lg font-medium">Marketing Rule Performance Analytics</CardTitle>
                    <CardDescription>Performance metrics for all marketing rules</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Last 7 Days">Last 7 Days</SelectItem>
                            <SelectItem value="Last 30 Days">Last 30 Days</SelectItem>
                            <SelectItem value="Last 90 Days">Last 90 Days</SelectItem>
                            <SelectItem value="Year to Date">Year to Date</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* KPI Cards */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 lg:grid-cols-3">
                    <StatCard
                        title="Total CTA Views"
                        value={data.totalViews.toLocaleString()}
                        changePercent={data.viewsChangePercent}
                        color="text-blue-600"
                    />
                    <StatCard
                        title="Total CTA Clicks"
                        value={data.totalClicks.toLocaleString()}
                        changePercent={data.clicksChangePercent}
                        color="text-green-600"
                    />
                    <StatCard
                        title="Click-Through Rate"
                        value={`${data.clickThroughRate.toFixed(1)}%`}
                        changePercent={data.ctrChangePercent}
                        color="text-purple-600"
                    />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Daily Performance Line Chart */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Daily Performance</CardTitle>
                            <CardDescription>Views and clicks over time</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={lineChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                        <YAxis tick={{ fontSize: 10 }} />
                                        <Tooltip contentStyle={{ fontSize: 12, padding: '4px 8px' }} />
                                        <Legend />
                                        <Line type="monotone" dataKey="views" stroke="#8884d8" activeDot={{ r: 8 }} />
                                        <Line type="monotone" dataKey="clicks" stroke="#82ca9d" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Conversion Funnel */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Conversion Funnel</CardTitle>
                            <CardDescription>From views to hires</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={funnelData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {funnelData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => value.toLocaleString()} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Click Performance Chart */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Click Performance by Rule</CardTitle>
                        <CardDescription>Number of clicks per marketing rule</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                                    <YAxis tick={{ fontSize: 10 }} />
                                    <Tooltip cursor={{ fill: 'rgba(200,200,200,0.2)' }} contentStyle={{ fontSize: 12, padding: '4px 8px' }}/>
                                    <Bar dataKey="clicks" fill="#8884d8" barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </CardContent>
        </Card>
    );
};

interface StatCardProps {
    title: string;
    value: string | number;
    changePercent: number;
    description?: string;
    color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, changePercent, description, color = "text-primary" }) => {
    const isNegative = changePercent < 0;

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="text-sm font-medium text-muted-foreground">{title}</div>
                <div className={`text-2xl font-bold mt-1 ${color}`}>{value}</div>
                {changePercent !== 0 && (
                    <div className={`text-xs flex items-center mt-1 ${isNegative ? 'text-red-500' : 'text-green-500'}`}>
                        {!isNegative && <ArrowUp className="h-3 w-3 mr-1" />}
                        {isNegative && <ArrowDown className="h-3 w-3 mr-1" />}
                        {Math.abs(changePercent).toFixed(1)}%
                        <span className="text-muted-foreground ml-1">from last period</span>
                    </div>
                )}
                {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
            </CardContent>
        </Card>
    );
};

const AnalyticsLoadingSkeleton: React.FC = () => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Marketing Rule Performance Analytics</CardTitle>
                <CardDescription>Loading analytics data...</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 lg:grid-cols-3">
                    <Skeleton className="h-[100px]" />
                    <Skeleton className="h-[100px]" />
                    <Skeleton className="h-[100px]" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Skeleton className="h-[300px]" />
                    <Skeleton className="h-[300px]" />
                </div>
                <Skeleton className="h-[300px]" />
            </CardContent>
        </Card>
    );
};

export default MarketingRulePerformanceAnalytics;
