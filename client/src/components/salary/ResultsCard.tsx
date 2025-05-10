import React, { useId } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { HelpCircle, DollarSign, Download, Share2, Users } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Constants
const SA_CURRENCY = 'ZAR';
const SA_LOCALE = 'en-ZA';
const PIE_CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#FF7F50'];

// Helper function for currency formatting
const formatCurrency = (value: number, currency = SA_CURRENCY, locale = SA_LOCALE) => {
  if (typeof value !== 'number' || isNaN(value)) return new Intl.NumberFormat(locale, { style: 'currency', currency: currency }).format(0);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(value);
};

interface DeductionItemProps {
  label: string;
  value: string;
  isIncome?: boolean;
  isDeduction?: boolean;
  hasPopover?: boolean;
  popoverContent?: React.ReactNode;
  className?: string;
}

const DeductionItem: React.FC<DeductionItemProps> = ({
  label,
  value,
  isIncome = false,
  isDeduction = false,
  hasPopover = false,
  popoverContent = null,
  className = ""
}) => {
  const helpId = useId();
  return (
    <div className={`flex justify-between items-center text-sm ${className}`}>
      <div className="flex items-center">
        <span>{label}</span>
        {hasPopover && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="h-6 w-6 p-1 ml-1" aria-describedby={helpId}>
                <HelpCircle className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" id={helpId}>
              {popoverContent}
            </PopoverContent>
          </Popover>
        )}
      </div>
      <span className={`${isIncome ? "text-green-600 dark:text-green-400" : isDeduction ? "text-red-600 dark:text-red-400" : ""} font-medium`}>
        {isIncome ? "" : isDeduction ? "- " : ""}{value}
      </span>
    </div>
  );
};

interface ResultsCardProps {
  calculatedAmounts: {
    hourly: number;
    daily: number;
    weekly: number;
    fortnightly: number;
    monthly: number;
    annual: number;
  };
  taxDetails: {
    incomeTax: number;
    uif: number;
    pension: number;
    medical: number;
    groupLife: number;
    retirement: number;
    totalDeductions: number;
    netIncome: number;
    effectiveTaxRate: number;
    taxableIncomeAnnual: number;
    mtcAppliedMonthly: number;
    actualDeductibleRetirementFundsAnnual: number;
    monthlyGross: number;
    taxBracketInfo: any;
    pieChartData: Array<{name: string, value: number}>;
  };
  activeDeductions: Record<string, boolean>;
  setActiveDeductions: (deductions: Record<string, boolean>) => void;
  deductionRates: Record<string, number>;
  setDeductionRates: (rates: Record<string, number>) => void;
  medicalAidMembers: number;
  setMedicalAidMembers: (members: number) => void;
}

const ResultsCard: React.FC<ResultsCardProps> = ({
  calculatedAmounts,
  taxDetails,
  activeDeductions,
  setActiveDeductions,
  deductionRates,
  setDeductionRates,
  medicalAidMembers,
  setMedicalAidMembers
}) => {
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-2 shadow rounded-md border">
          <p className="font-medium">{payload[0].name}</p>
          <p>{formatCurrency(payload[0].value)}</p>
          {taxDetails.monthlyGross > 0 && <p className="text-xs text-muted-foreground">
            {(payload[0].value / taxDetails.monthlyGross * 100).toFixed(1)}% of gross
          </p>}
        </div>
      );
    }
    return null;
  };

  const medicalAidMembersId = useId();

  // Common deductions
  const commonDeductions = [
    { id: "pension", name: "Pension Fund", defaultRate: 0.075, mandatory: false },
    { id: "medical", name: "Medical Aid", defaultRate: 0.06, mandatory: false },
    { id: "groupLife", name: "Group Life Insurance", defaultRate: 0.01, mandatory: false },
    { id: "retirement", name: "Retirement Annuity", defaultRate: 0.05, mandatory: false },
  ];

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center"><DollarSign className="mr-2 h-5 w-5" />Salary Breakdown</CardTitle>
        <CardDescription>Your estimated income and deductions based on your input.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Conversion Results */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {['hourly', 'daily', 'weekly', 'fortnightly', 'monthly', 'annual'].map(period => (
            <div key={period} className="bg-muted/50 p-3 rounded-lg">
              <div className="text-sm text-muted-foreground capitalize">{period}</div>
              <div className="text-lg font-semibold">{formatCurrency(calculatedAmounts[period as keyof typeof calculatedAmounts])}</div>
            </div>
          ))}
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Monthly Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-1.5">
              <DeductionItem label="Gross Monthly Income" value={formatCurrency(taxDetails.monthlyGross)} isIncome />
              <Separator />

              <DeductionItem
                label="Income Tax (PAYE)" value={formatCurrency(taxDetails.incomeTax)} isDeduction
                hasPopover popoverContent={
                  <div className="space-y-2 text-sm">
                    <h4 className="font-medium">Income Tax (PAYE)</h4>
                    <p className="text-muted-foreground">Calculated on annual taxable income of <span className="font-semibold">{formatCurrency(taxDetails.taxableIncomeAnnual)}</span> using 2024/2025 SARS brackets.</p>
                    {taxDetails.taxBracketInfo?.rate && <p className="text-muted-foreground">Marginal tax rate: {(taxDetails.taxBracketInfo.rate * 100).toFixed(0)}%.</p>}
                    {taxDetails.mtcAppliedMonthly > 0 && <p className="text-muted-foreground">Medical Tax Credits of <span className="font-semibold">{formatCurrency(taxDetails.mtcAppliedMonthly)}</span> applied monthly.</p>}
                    {taxDetails.actualDeductibleRetirementFundsAnnual > 0 && <p className="text-muted-foreground">Retirement fund contributions of <span className="font-semibold">{formatCurrency(taxDetails.actualDeductibleRetirementFundsAnnual / 12)}</span> (monthly equivalent) were tax-deductible.</p>}
                    <p className="text-muted-foreground">Effective tax rate (on taxable income): {taxDetails.effectiveTaxRate.toFixed(1)}%</p>
                  </div>
                }
              />

              <DeductionItem
                label="UIF Contribution" value={formatCurrency(taxDetails.uif)} isDeduction
                hasPopover popoverContent={
                  <div className="space-y-2 text-sm">
                    <h4 className="font-medium">UIF Contribution</h4>
                    <p className="text-muted-foreground">1% of gross monthly income, capped at 1% of R17,712 (i.e., max R177.12 per month).</p>
                  </div>
                }
              />

              {commonDeductions.map(ded => {
                if (!activeDeductions[ded.id] || !taxDetails[ded.id as keyof typeof taxDetails] || taxDetails[ded.id as keyof typeof taxDetails] <= 0) return null;
                return (
                  <DeductionItem
                    key={ded.id}
                    label={`${ded.name} (${(deductionRates[ded.id] * 100).toFixed(1)}%)`}
                    value={formatCurrency(taxDetails[ded.id as keyof typeof taxDetails] as number)}
                    isDeduction
                    hasPopover popoverContent={
                      <div className="space-y-2 text-sm">
                        <h4 className="font-medium">{ded.name}</h4>
                        { ded.id === "pension" && <p className="text-muted-foreground">Employee contribution to a pension fund. Tax-deductible up to limits.</p> }
                        { ded.id === "medical" && <p className="text-muted-foreground">Contribution to a medical aid scheme. Not directly deductible, but MTCs apply.</p> }
                        { ded.id === "groupLife" && <p className="text-muted-foreground">Typically for death and disability cover.</p> }
                        { ded.id === "retirement" && <p className="text-muted-foreground">Personal retirement annuity contribution. Tax-deductible up to limits.</p> }
                        <div className="space-y-1 pt-2">
                          <Label htmlFor={`${ded.id}-rate-input`} className="text-xs">Adjust contribution (% of gross):</Label>
                          <Input
                            id={`${ded.id}-rate-input`}
                            type="number" min="0" max={ded.id === 'medical' ? "20" : "25"} step="0.1" // Max 25% for retirement for instance
                            value={(deductionRates[ded.id] * 100).toFixed(1)}
                            onChange={(e) => {
                                const rateVal = parseFloat(e.target.value);
                                if (!isNaN(rateVal)) {
                                    setDeductionRates(prev => ({...prev, [ded.id]: Math.min(Math.max(rateVal, 0), (ded.id === 'medical' ? 20 : 25)) / 100}));
                                }
                            }}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    }
                  />
                );
              })}

              <Separator />
              <DeductionItem label="Total Monthly Deductions" value={formatCurrency(taxDetails.totalDeductions)} isDeduction className="font-semibold" />
              <Separator />
              <DeductionItem label="Net Monthly Income (Take-Home)" value={formatCurrency(taxDetails.netIncome)} className="font-bold text-base text-green-600 dark:text-green-400" />
            </div>

            <div className="flex flex-col items-center space-y-2">
              <h4 className="text-sm font-medium text-center">Monthly Income Allocation</h4>
              {taxDetails.pieChartData && taxDetails.pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={230}>
                  <PieChart>
                    <Pie
                      data={taxDetails.pieChartData}
                      cx="50%" cy="50%" labelLine={false}
                      outerRadius={85} fill="#8884d8" dataKey="value"
                      label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {taxDetails.pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-muted-foreground text-sm">Enter an amount to see the breakdown.</p>}
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-medium mb-3">Customize Deductions & Credits</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {commonDeductions.map((deduction) => (
              <div key={deduction.id} className="flex items-center space-x-2 bg-muted/30 p-3 rounded-md">
                <Switch
                  id={`deduction-${deduction.id}`}
                  checked={activeDeductions[deduction.id]}
                  onCheckedChange={(checked) => setActiveDeductions(prev => ({...prev, [deduction.id]: checked }))}
                />
                <Label htmlFor={`deduction-${deduction.id}`} className="cursor-pointer flex-1">{deduction.name}</Label>
              </div>
            ))}
            {activeDeductions.medical && (
              <div className="sm:col-span-2 bg-muted/30 p-3 rounded-md space-y-2">
                 <Label htmlFor={medicalAidMembersId} className="flex items-center"><Users className="mr-2 h-4 w-4 text-blue-500" />Medical Aid Members (incl. yourself)</Label>
                 <Select
                    value={medicalAidMembers.toString()}
                    onValueChange={(val) => setMedicalAidMembers(parseInt(val) || 0)}
                  >
                   <SelectTrigger id={medicalAidMembersId}>
                     <SelectValue placeholder="Number of members" />
                   </SelectTrigger>
                   <SelectContent>
                     {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                       <SelectItem key={num} value={num.toString()}>
                         {num === 0 ? "None / Not claiming MTC" : `${num} member${num !== 1 ? 's' : ''}`}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
                 <p className="text-xs text-muted-foreground">Used for calculating Medical Tax Credits (MTCs).</p>
              </div>
            )}
          </div>
        </div>

        <Separator />

        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="outline" size="sm" className="gap-1" disabled> {/* onClick for future */}
            <Download size={16} /> Export Results
          </Button>
          <Button variant="outline" size="sm" className="gap-1" disabled> {/* onClick for future */}
            <Share2 size={16} /> Share
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResultsCard;
