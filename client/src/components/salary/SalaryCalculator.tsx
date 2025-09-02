import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tabs as TabsType } from '@radix-ui/react-tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Import custom hooks
import useSalaryConverter from './hooks/useSalaryConverter';
import useTaxCalculator from './hooks/useTaxCalculator';

// Import components
import SalaryInputCard from './SalaryInputCard';
import ResultsCard from './ResultsCard';

// Import centralized data
import {
  professionalIndustryAverages,
  lowLevelJobAverages,
  allIndustryAverages
} from '@/data/salaryData';

// --- Constants ---
const SA_CURRENCY = 'ZAR';
const SA_LOCALE = 'en-ZA';

// South African Income Tax Brackets for 2024/2025
const taxBrackets2024 = [
  { min: 0, max: 237100, rate: 0.18, baseAmount: 0 },
  { min: 237101, max: 370500, rate: 0.26, baseAmount: 42678 },
  { min: 370501, max: 512800, rate: 0.31, baseAmount: 77362 },
  { min: 512801, max: 673000, rate: 0.36, baseAmount: 121475 },
  { min: 673001, max: 857900, rate: 0.39, baseAmount: 179147 },
  { min: 857901, max: 1817000, rate: 0.41, baseAmount: 251258 },
  { min: 1817001, max: Infinity, rate: 0.45, baseAmount: 644489 }
];

// UIF
const UIF_RATE = 0.01; // 1%
const UIF_SALARY_CEILING_MONTHLY = 17712; // Employee contribution is 1% of remuneration up to this monthly amount
const UIF_MAX_MONTHLY_CONTRIBUTION = UIF_SALARY_CEILING_MONTHLY * UIF_RATE;

// Medical Tax Credits (MTC) for 2024/2025 (monthly)
const MTC_RATES = {
  mainMember: 364,
  firstDependant: 364,
  additionalDependant: 246,
};

// Common deductions
const commonDeductions = [
  { id: "pension", name: "Pension Fund", defaultRate: 0.075, mandatory: false },
  { id: "medical", name: "Medical Aid", defaultRate: 0.06, mandatory: false },
  { id: "groupLife", name: "Group Life Insurance", defaultRate: 0.01, mandatory: false },
  { id: "retirement", name: "Retirement Annuity", defaultRate: 0.05, mandatory: false },
];

const PIE_CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#FF7F50'];

// --- Helper Functions ---
const formatCurrency = (value: number, currency = SA_CURRENCY, locale = SA_LOCALE) => {
  if (typeof value !== 'number' || isNaN(value)) return new Intl.NumberFormat(locale, { style: 'currency', currency: currency }).format(0);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(value);
};

// Lazy load Industry Comparison Tab
const IndustryComparisonTabContent = lazy(() => import('./IndustryComparisonTabContent'));

// --- Main App Component ---
function SalaryCalculator() {
  const [amount, setAmount] = useState<number | string>(50000); // Default example amount
  const [inputType, setInputType] = useState('monthly'); // Default to monthly

  const [hoursPerDay, setHoursPerDay] = useState(8);
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [weeksPerYear, setWeeksPerYear] = useState(48); // Common working weeks
  const [calculationType, setCalculationType] = useState('basic'); // 'basic' or 'advanced'

  // Job level and industry selection
  const [jobLevel, setJobLevel] = useState('professional'); // 'professional' or 'entry-level'
  const [industry, setIndustry] = useState(Object.keys(lowLevelJobAverages)[0]); // Default to first entry-level job
  const [experience, setExperience] = useState('mid'); // Default to mid-level

  // Always use entry-level job data for industry dropdown
  const industryData = useMemo(() => lowLevelJobAverages, []);

  const initialDeductionRates = commonDeductions.reduce((acc, curr) => {
    acc[curr.id] = curr.defaultRate;
    return acc;
  }, {} as Record<string, number>);
  const [deductionRates, setDeductionRates] = useState(initialDeductionRates);

  const initialActiveDeductions = commonDeductions.reduce((acc, curr) => {
    acc[curr.id] = !curr.mandatory; // By default, enable non-mandatory ones for demo
    return acc;
  }, {} as Record<string, boolean>);
  const [activeDeductions, setActiveDeductions] = useState(initialActiveDeductions);
  const [medicalAidMembers, setMedicalAidMembers] = useState(1); // Default to 1 member for MTC

  // Import custom hooks
  const { calculatedAmounts } = useSalaryConverter(
    parseFloat(amount as string) || 0,
    inputType,
    calculationType === 'advanced' ? hoursPerDay : 8,
    calculationType === 'advanced' ? daysPerWeek : 5,
    calculationType === 'advanced' ? weeksPerYear : 52
  );

  const { taxDetails } = useTaxCalculator(
    calculatedAmounts.annual,
    activeDeductions,
    deductionRates,
    activeDeductions.medical ? medicalAidMembers : 0
  );

  const applyIndustryAverage = useCallback(() => {
    if (industry && experience && industryData[industry] && industryData[industry][experience]) {
      const averageSalary = industryData[industry][experience];
      setAmount(averageSalary);
      setInputType("monthly");
    }
  }, [industry, experience, industryData]);

  const industryComparisonData = useMemo(() => {
    if (!industry || !industryData[industry]) return [];

    const data = ['entry', 'mid', 'senior'].map(level => {
        const gross = industryData[industry][level];
        return {
            name: `${level.charAt(0).toUpperCase() + level.slice(1)} Level`,
            Gross: gross,
            Net: gross * 0.75, // Simplified estimate for demo
        };
    });

    data.unshift({
        name: "Your Salary",
        Gross: calculatedAmounts.monthly,
        Net: taxDetails.netIncome
    });
    return data;
  }, [industry, calculatedAmounts.monthly, taxDetails.netIncome, industryData]);

  // Effect to update active medical aid if members change
  useEffect(() => {
    if (medicalAidMembers > 0 && !activeDeductions.medical) {
      setActiveDeductions(prev => ({ ...prev, medical: true }));
    }
  }, [medicalAidMembers, activeDeductions.medical]);

  // Effect to reset medical aid members if medical aid is disabled
  useEffect(() => {
    if (!activeDeductions.medical && medicalAidMembers > 0) {
      setMedicalAidMembers(0);
    }
  }, [activeDeductions.medical, medicalAidMembers]);

  // No need to update industry when job level changes since we're only using entry-level jobs
  // This effect is kept for potential future changes
  useEffect(() => {
    // If the current industry doesn't exist in lowLevelJobAverages, reset to the first one
    if (!lowLevelJobAverages[industry]) {
      setIndustry(Object.keys(lowLevelJobAverages)[0]);
    }
  }, [industry]);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-[#163b6d]">South African Salary Calculator</h1>
        <p className="text-muted-foreground">Estimate your net pay, tax, and compare with industry benchmarks for all job levels (2024/2025 Tax Year).</p>
        <p className="text-sm text-muted-foreground mt-1">Now includes data for entry-level jobs, general workers, and service positions with minimum wage comparisons.</p>
      </header>

      <Tabs defaultValue="calculator" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-1/2 md:mx-auto">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="calculator">Salary Calculator</TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Calculate your salary breakdown and take-home pay</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="comparison">Industry Comparison</TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Compare your salary with industry averages</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TabsList>

        <TabsContent value="calculator" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* These components will be imported from separate files */}
            <SalaryInputCard
              amount={amount}
              setAmount={setAmount}
              inputType={inputType}
              setInputType={setInputType}
              hoursPerDay={hoursPerDay}
              setHoursPerDay={setHoursPerDay}
              daysPerWeek={daysPerWeek}
              setDaysPerWeek={setDaysPerWeek}
              weeksPerYear={weeksPerYear}
              setWeeksPerYear={setWeeksPerYear}
              calculationType={calculationType}
              setCalculationType={setCalculationType}
              industry={industry}
              setIndustry={setIndustry}
              experience={experience}
              setExperience={setExperience}
              applyIndustryAverage={applyIndustryAverage}
              jobLevel={jobLevel}
              setJobLevel={setJobLevel}
            />
            <ResultsCard
              calculatedAmounts={calculatedAmounts}
              taxDetails={taxDetails}
              activeDeductions={activeDeductions}
              setActiveDeductions={setActiveDeductions}
              deductionRates={deductionRates}
              setDeductionRates={setDeductionRates}
              medicalAidMembers={medicalAidMembers}
              setMedicalAidMembers={setMedicalAidMembers}
            />
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="mt-6">
          <Suspense fallback={<div className="text-center p-10"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>Loading Comparison...</div>}>
            <IndustryComparisonTabContent
              industry={industry}
              comparisonData={industryComparisonData}
              calculatedAmounts={calculatedAmounts}
              formatCurrency={formatCurrency}
              jobLevel={jobLevel}
            />
          </Suspense>
        </TabsContent>
      </Tabs>
      <footer className="text-center text-xs text-muted-foreground mt-8">
        <p>© {new Date().getFullYear()} Salary Calculator. For estimation purposes only. Consult a financial advisor for professional advice.</p>
        <p>Tax brackets and MTC rates for 2024/2025 tax year.</p>
      </footer>
    </div>
  );
}

export default SalaryCalculator;
