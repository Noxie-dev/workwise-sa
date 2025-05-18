import React, { useState, useId } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  professionalIndustryAverages,
  lowLevelJobAverages,
  jobLevelDescriptions,
  MINIMUM_WAGE
} from '@/data/salaryData';

interface SalaryInputCardProps {
  amount: number | string;
  setAmount: (amount: number | string) => void;
  inputType: string;
  setInputType: (type: string) => void;
  hoursPerDay: number;
  setHoursPerDay: (hours: number) => void;
  daysPerWeek: number;
  setDaysPerWeek: (days: number) => void;
  weeksPerYear: number;
  setWeeksPerYear: (weeks: number) => void;
  calculationType: string;
  setCalculationType: (type: string) => void;
  industry: string;
  setIndustry: (industry: string) => void;
  experience: string;
  setExperience: (level: string) => void;
  applyIndustryAverage: () => void;
  jobLevel?: string;
  setJobLevel?: (level: string) => void;
}

const SalaryInputCard: React.FC<SalaryInputCardProps> = ({
  amount,
  setAmount,
  inputType,
  setInputType,
  hoursPerDay,
  setHoursPerDay,
  daysPerWeek,
  setDaysPerWeek,
  weeksPerYear,
  setWeeksPerYear,
  calculationType,
  setCalculationType,
  industry,
  setIndustry,
  experience,
  setExperience,
  applyIndustryAverage,
  jobLevel = 'professional',
  setJobLevel = () => {}
}) => {
  const amountId = useId();
  const hoursId = useId();
  const daysId = useId();
  const weeksId = useId();

  // Always use low-level job data for industry dropdown
  const industryData = lowLevelJobAverages;

  const [inputErrors, setInputErrors] = useState<Record<string, string | null>>({});

  const handleAmountChange = (value: string) => {
    const numValue = parseFloat(value);
    if (value === "" || (numValue >= 0 && !isNaN(numValue))) {
      setAmount(value === "" ? "" : numValue); // Allow empty to clear, then treat as 0 for calc
      setInputErrors(prev => ({ ...prev, amount: null }));
    } else {
      setInputErrors(prev => ({ ...prev, amount: "Please enter a valid positive number." }));
    }
  };

  const createNumericHandler = (setter: (val: number) => void, fieldName: string, min: number, max: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = parseInt(value);
    if (value === "") {
        setter(min); // Reset to default or min if cleared
        setInputErrors(prev => ({ ...prev, [fieldName]: null }));
    } else if (!isNaN(numValue) && numValue >= min && numValue <= max) {
        setter(numValue);
        setInputErrors(prev => ({ ...prev, [fieldName]: null }));
    } else {
        setInputErrors(prev => ({ ...prev, [fieldName]: `Value must be between ${min} and ${max}.` }));
    }
  };

  // Format currency for display
  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return 'ZAR 0.00';
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(numValue);
  };

  return (
    <Card className="md:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center"><Calculator className="mr-2 h-5 w-5" />Salary Input</CardTitle>
        <CardDescription>Enter your salary details below.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <div className="flex justify-between">
            <Label htmlFor={amountId}>Amount</Label>
            <span className="text-sm text-muted-foreground">
              {formatCurrency(parseFloat(amount as string) || 0)}
            </span>
          </div>
          <Input
            id={amountId}
            type="number"
            min="0"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            className={`flex-1 ${inputErrors.amount ? 'border-red-500' : ''}`}
            aria-invalid={!!inputErrors.amount}
            aria-describedby={inputErrors.amount ? `${amountId}-error` : undefined}
          />
          {inputErrors.amount && <p id={`${amountId}-error`} className="text-xs text-red-500 mt-1">{inputErrors.amount}</p>}
        </div>

        <div className="space-y-1">
          <Label>Payment Frequency</Label>
          <Select value={inputType} onValueChange={setInputType}>
            <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="hourly">Hourly Rate</SelectItem>
              <SelectItem value="daily">Daily Rate</SelectItem>
              <SelectItem value="weekly">Weekly Salary</SelectItem>
              <SelectItem value="fortnightly">Fortnightly Salary</SelectItem>
              <SelectItem value="monthly">Monthly Salary</SelectItem>
              <SelectItem value="annual">Annual Salary</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="advanced-calc-switch">Advanced Settings (for hourly/daily calc)</Label>
            <Switch
              id="advanced-calc-switch"
              checked={calculationType === "advanced"}
              onCheckedChange={(checked) => setCalculationType(checked ? "advanced" : "basic")}
            />
          </div>
        </div>

        {calculationType === "advanced" && (
          <div className="space-y-3 mt-3 p-3 border rounded-md">
            <div className="space-y-1">
              <Label htmlFor={hoursId}>Hours per day</Label>
              <Input
                id={hoursId} type="number" min="1" max="24" value={hoursPerDay}
                onChange={createNumericHandler(setHoursPerDay, 'hoursPerDay', 1, 24)}
                className={inputErrors.hoursPerDay ? 'border-red-500' : ''}
                aria-invalid={!!inputErrors.hoursPerDay}
                aria-describedby={inputErrors.hoursPerDay ? `${hoursId}-error` : undefined}
              />
              {inputErrors.hoursPerDay && <p id={`${hoursId}-error`} className="text-xs text-red-500 mt-1">{inputErrors.hoursPerDay}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor={daysId}>Days per week</Label>
              <Input
                id={daysId} type="number" min="1" max="7" value={daysPerWeek}
                onChange={createNumericHandler(setDaysPerWeek, 'daysPerWeek', 1, 7)}
                className={inputErrors.daysPerWeek ? 'border-red-500' : ''}
                aria-invalid={!!inputErrors.daysPerWeek}
                aria-describedby={inputErrors.daysPerWeek ? `${daysId}-error` : undefined}
              />
               {inputErrors.daysPerWeek && <p id={`${daysId}-error`} className="text-xs text-red-500 mt-1">{inputErrors.daysPerWeek}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor={weeksId}>Working weeks per year</Label>
              <Input
                id={weeksId} type="number" min="1" max="52" value={weeksPerYear}
                onChange={createNumericHandler(setWeeksPerYear, 'weeksPerYear', 1, 52)}
                className={inputErrors.weeksPerYear ? 'border-red-500' : ''}
                aria-invalid={!!inputErrors.weeksPerYear}
                aria-describedby={inputErrors.weeksPerYear ? `${weeksId}-error` : undefined}
              />
              {inputErrors.weeksPerYear && <p id={`${weeksId}-error`} className="text-xs text-red-500 mt-1">{inputErrors.weeksPerYear}</p>}
            </div>
          </div>
        )}

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="job-level">Job Level</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full p-0">
                    <HelpCircle className="h-4 w-4" />
                    <span className="sr-only">Job Level Info</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Professional jobs include corporate and skilled positions. Low-level jobs include entry-level, general worker, and service positions.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Select value={jobLevel} onValueChange={setJobLevel}>
            <SelectTrigger id="job-level"><SelectValue placeholder="Select job level" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professional Jobs</SelectItem>
              <SelectItem value="low-level">Low-Level Jobs</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Industry Benchmark</Label>
            {jobLevel === 'low-level' && (
              <div className="text-xs text-muted-foreground">
                Minimum Wage: {formatCurrency(MINIMUM_WAGE.monthly)} monthly
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
              <SelectContent>
                {Object.keys(industryData).map((ind) => (
                  <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={experience} onValueChange={setExperience}>
              <SelectTrigger><SelectValue placeholder="Experience level" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="entry">Entry Level</SelectItem>
                <SelectItem value="mid">Mid Level</SelectItem>
                <SelectItem value="senior">Senior Level</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {experience && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-xs text-muted-foreground mt-1 cursor-help">
                    {jobLevelDescriptions[experience as keyof typeof jobLevelDescriptions]}
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Experience levels vary by industry. These are general guidelines.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <Button
            variant="outline"
            className="w-full mt-2"
            onClick={applyIndustryAverage}
            disabled={!industry || !experience}
            title={!industry || !experience ? "Please select an industry and experience level" : ""}
          >
            Apply Industry Average
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalaryInputCard;
