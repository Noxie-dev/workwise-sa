import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, AlertCircle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  professionalIndustryAverages,
  lowLevelJobAverages,
  jobCategoryInfo,
  MINIMUM_WAGE,
  regionalVariations
} from '@/data/salaryData';

interface IndustryComparisonTabContentProps {
  industry: string;
  comparisonData: Array<{
    name: string;
    Gross: number;
    Net: number;
  }>;
  calculatedAmounts: {
    monthly: number;
    [key: string]: number;
  };
  formatCurrency: (value: number) => string;
  jobLevel?: string;
}

const IndustryComparisonTabContent: React.FC<IndustryComparisonTabContentProps> = ({
  industry,
  comparisonData,
  calculatedAmounts,
  formatCurrency,
  jobLevel = 'professional'
}) => {
  // Always use entry-level job data for industry dropdown
  const industryData = lowLevelJobAverages;
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-2 shadow rounded-md border">
          <p className="font-medium">{label}</p>
          {payload.find(p => p.dataKey === "Gross") && <p className="text-sm" style={{color: payload.find(p => p.dataKey === "Gross").fill}}>Gross: {formatCurrency(payload.find(p => p.dataKey === "Gross").value)}</p>}
          {payload.find(p => p.dataKey === "Net") && <p className="text-sm" style={{color: payload.find(p => p.dataKey === "Net").fill}}>Net: {formatCurrency(payload.find(p => p.dataKey === "Net").value)}</p>}
        </div>
      );
    }
    return null;
  };

  const yourPositionValue = useMemo(() => {
    if (!industry || !industryData[industry] || !calculatedAmounts.monthly) return 0;
    const { entry, senior } = industryData[industry];
    if (senior === entry) return calculatedAmounts.monthly >= entry ? 100 : 0; // Handle edge case
    const progress = ((calculatedAmounts.monthly - entry) / (senior - entry)) * 100;
    return Math.min(100, Math.max(0, progress));
  }, [industry, calculatedAmounts.monthly, industryData]);

  // Calculate percentage relative to minimum wage (for entry-level jobs)
  const minimumWagePercentage = useMemo(() => {
    if (!calculatedAmounts.monthly) return 0;
    return (calculatedAmounts.monthly / MINIMUM_WAGE.monthly) * 100;
  }, [calculatedAmounts.monthly]);

  // Get job category info if available
  const categoryInfo = useMemo(() => {
    if (jobCategoryInfo[industry]) {
      return jobCategoryInfo[industry];
    }
    return null;
  }, [industry]);

  if (!industryData[industry]) {
      return <div className="p-4 text-muted-foreground">Please select an industry in the 'Salary Input' section to see comparisons.</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Entry-Level Salary Comparison: {industry}
          </CardTitle>
          <CardDescription>
            Compare your GROSS monthly salary ({formatCurrency(calculatedAmounts.monthly)}) with {industry} averages.
            Minimum wage in South Africa is {formatCurrency(MINIMUM_WAGE.monthly)} monthly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {categoryInfo && (
            <div className="bg-muted/30 p-3 rounded-md text-sm space-y-2 mb-4">
              <h4 className="font-medium">About {industry} Jobs:</h4>
              <p>{categoryInfo.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                <div>
                  <span className="font-medium">Typical Requirements:</span> {categoryInfo.qualifications}
                </div>
                <div>
                  <span className="font-medium">Market Outlook:</span> {categoryInfo.growth}
                </div>
                <div>
                  <span className="font-medium">Common Benefits:</span> {categoryInfo.benefits}
                </div>
              </div>
            </div>
          )}

          {comparisonData && comparisonData.length > 0 ? (
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 5, right: 0, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => new Intl.NumberFormat('en-ZA', { notation: 'compact', compactDisplay: 'short' }).format(value)} />
                  <RechartsTooltip content={<CustomBarTooltip />} />
                  <Legend />
                  <ReferenceLine
                    y={MINIMUM_WAGE.monthly}
                    stroke="red"
                    strokeDasharray="3 3"
                    label={{ value: 'Minimum Wage', position: 'insideBottomRight', fill: 'red', fontSize: 12 }}
                  />
                  <Bar dataKey="Gross" fill="#8884d8" />
                  <Bar dataKey="Net" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-muted-foreground">No comparison data available for the selected criteria or your current salary.</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">How You Compare (Gross Monthly)</h3>
              <Table>
                <TableHeader><TableRow><TableHead>Level</TableHead><TableHead>Avg. Gross</TableHead><TableHead>Difference</TableHead></TableRow></TableHeader>
                <TableBody>
                  {['entry', 'mid', 'senior'].map(level => {
                    const avgSalary = industryData[industry][level as keyof typeof industryData[typeof industry]];
                    const diff = calculatedAmounts.monthly - avgSalary;
                    return (
                      <TableRow key={level}>
                        <TableCell className="font-medium capitalize">{level} Level</TableCell>
                        <TableCell>{formatCurrency(avgSalary)}</TableCell>
                        <TableCell>
                          <Badge variant={diff >= 0 ? "default" : "destructive"}>
                            {diff >= 0 ? `+${formatCurrency(diff)}` : `-${formatCurrency(Math.abs(diff))}`}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow>
                    <TableCell className="font-medium">Minimum Wage</TableCell>
                    <TableCell>{formatCurrency(MINIMUM_WAGE.monthly)}</TableCell>
                    <TableCell>
                      <Badge variant={calculatedAmounts.monthly >= MINIMUM_WAGE.monthly ? "default" : "destructive"}>
                        {calculatedAmounts.monthly >= MINIMUM_WAGE.monthly
                          ? `+${formatCurrency(calculatedAmounts.monthly - MINIMUM_WAGE.monthly)}`
                          : `-${formatCurrency(MINIMUM_WAGE.monthly - calculatedAmounts.monthly)}`}
                      </Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <div className="mt-4 text-sm">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center cursor-help">
                        <Info className="h-4 w-4 mr-1 text-blue-500" />
                        <span>Regional variations may apply</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Salaries for entry-level jobs can vary significantly by province:</p>
                      <ul className="list-disc pl-4 mt-1">
                        {Object.entries(regionalVariations).map(([region, multiplier]) => (
                          <li key={region}>{region}: {(multiplier * 100).toFixed(0)}% of Gauteng rates</li>
                        ))}
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Your Gross Salary Position within {industry}</h3>
              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Entry: {formatCurrency(industryData[industry].entry)}</span>
                    <span>Senior: {formatCurrency(industryData[industry].senior)}</span>
                  </div>
                  <Progress value={yourPositionValue} className="h-4" />
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    Your gross salary is approximately at the {yourPositionValue.toFixed(0)}th percentile between entry and senior levels.
                  </p>
                </div>

                <div className="space-y-1 mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Minimum Wage</span>
                    <span>{minimumWagePercentage.toFixed(0)}% of Minimum Wage</span>
                  </div>
                  <Progress
                    value={Math.min(100, minimumWagePercentage)}
                    className="h-4"
                    color={minimumWagePercentage < 100 ? "bg-red-500" : ""}
                  />
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    Your salary is {minimumWagePercentage < 100 ? 'below' : 'above'} the South African minimum wage.
                  </p>
                </div>

                <div className="text-sm p-3 bg-muted/30 rounded-md">
                  <AlertCircle className="inline h-4 w-4 mr-1 mb-0.5 text-blue-500" />
                  This is a general comparison. Actual roles, responsibilities, location, and company size greatly influence salaries.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IndustryComparisonTabContent;
