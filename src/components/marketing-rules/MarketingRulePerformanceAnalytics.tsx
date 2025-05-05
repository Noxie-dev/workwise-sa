// src/components/marketing-rules/MarketingRulePerformanceAnalytics.tsx
import React from 'react';
import { MarketingRuleAnalyticsData } from '@/types/marketing-rules';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'; // Import recharts
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown } from 'lucide-react';

interface MarketingRulePerformanceAnalyticsProps {
    data: MarketingRuleAnalyticsData;
}

const StatCard: React.FC<{ title: string, value: string | number, changePercent?: number, description?: string }> = ({ title, value, changePercent, description }) => {
    const isPositive = changePercent !== undefined && changePercent >= 0;
    const isNegative = changePercent !== undefined && changePercent < 0;
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardDescription>{title}</CardDescription>
                <CardTitle className="text-2xl">{typeof value === 'number' ? value.toLocaleString() : value}</CardTitle>
            </CardHeader>
            <CardContent>
                {changePercent !== undefined && (
                    <div className={cn("text-xs flex items-center", isPositive ? "text-green-600" : "text-red-600")}>
                       {isPositive && <ArrowUp className="h-3 w-3 mr-1" />}
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

export const MarketingRulePerformanceAnalytics: React.FC<MarketingRulePerformanceAnalyticsProps> = ({ data }) => {
    // Format data for recharts (optional: truncate long names)
    const chartData = data.performanceByRule.map(item => ({
        name: item.name.length > 15 ? item.name.substring(0, 12) + '...' : item.name, // Truncate long names
        clicks: item.clicks
    }));

    return (
        <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard title="Total CTA Views" value={data.totalViews} changePercent={data.viewsChangePercent} />
                <StatCard title="Total CTA Clicks" value={data.totalClicks} changePercent={data.clicksChangePercent} />
                <StatCard title="Click-Through Rate" value={`${data.clickThroughRate.toFixed(1)}%`} changePercent={data.ctrChangePercent} />
            </div>

            {/* Click Performance Chart */}
             <div>
                <h4 className="text-md font-semibold mb-2">Click Performance by Rule</h4>
                 <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip cursor={{ fill: 'rgba(200,200,200,0.2)' }} contentStyle={{ fontSize: 12, padding: '4px 8px' }}/>
                        <Bar dataKey="clicks" fill="#8884d8" barSize={30} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

             {/* Conversion Funnel Placeholder */}
             <div>
                <h4 className="text-md font-semibold mb-2">Conversion Funnel Analysis</h4>
                 <div className="text-center text-muted-foreground p-8 border rounded-lg">
                     (Conversion Funnel Chart/Data Area - Implementation TBD)
                 </div>
             </div>
        </div>
    );
};
