import React, { useId, useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { HelpCircle, Download, Share2, Users, Copy, Mail, Printer, FileText } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

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

// Function to export salary breakdown as CSV
const exportSalaryBreakdownCSV = (taxDetails: any, calculatedAmounts: any) => {
  // Create CSV content
  let csvContent = 'Salary Breakdown\n\n';

  // Add period conversions
  csvContent += 'Period Conversions\n';
  csvContent += 'Period,Amount\n';
  Object.entries(calculatedAmounts).forEach(([period, amount]) => {
    csvContent += `${period},${amount}\n`;
  });

  // Add monthly breakdown
  csvContent += '\nMonthly Breakdown\n';
  csvContent += 'Item,Amount\n';
  csvContent += `Gross Monthly Income,${taxDetails.monthlyGross}\n`;
  csvContent += `Income Tax (PAYE),${taxDetails.incomeTax}\n`;
  csvContent += `UIF Contribution,${taxDetails.uif}\n`;

  if (taxDetails.pension > 0) csvContent += `Pension Fund,${taxDetails.pension}\n`;
  if (taxDetails.medical > 0) csvContent += `Medical Aid,${taxDetails.medical}\n`;
  if (taxDetails.groupLife > 0) csvContent += `Group Life Insurance,${taxDetails.groupLife}\n`;
  if (taxDetails.retirement > 0) csvContent += `Retirement Annuity,${taxDetails.retirement}\n`;

  csvContent += `Total Monthly Deductions,${taxDetails.totalDeductions}\n`;
  csvContent += `Net Monthly Income (Take-Home),${taxDetails.netIncome}\n`;

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'salary-breakdown.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return true;
};

// Function to generate a printable HTML version of the salary breakdown
const generatePrintableHTML = (taxDetails: any, calculatedAmounts: any, includePieChart: boolean = false) => {
  // Create pie chart SVG if requested
  let pieChartSvg = '';

  if (includePieChart && taxDetails.pieChartData && taxDetails.pieChartData.length > 0) {
    // Create a simple SVG pie chart
    const total = taxDetails.pieChartData.reduce((sum: number, item: any) => sum + item.value, 0);
    let startAngle = 0;

    const pieChartParts = taxDetails.pieChartData.map((item: any, index: number) => {
      const percentage = item.value / total;
      const angle = percentage * 360;
      const endAngle = startAngle + angle;

      // Calculate SVG arc path
      const startRadians = (startAngle - 90) * Math.PI / 180;
      const endRadians = (endAngle - 90) * Math.PI / 180;

      const x1 = 100 + 80 * Math.cos(startRadians);
      const y1 = 100 + 80 * Math.sin(startRadians);
      const x2 = 100 + 80 * Math.cos(endRadians);
      const y2 = 100 + 80 * Math.sin(endRadians);

      const largeArcFlag = angle > 180 ? 1 : 0;

      const pathData = `M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

      const color = PIE_CHART_COLORS[index % PIE_CHART_COLORS.length];
      const path = `<path d="${pathData}" fill="${color}" stroke="white" stroke-width="1" />`;

      // Add text label
      const labelRadians = (startAngle + angle/2 - 90) * Math.PI / 180;
      const labelDistance = 60; // Slightly inside the pie
      const labelX = 100 + labelDistance * Math.cos(labelRadians);
      const labelY = 100 + labelDistance * Math.sin(labelRadians);

      const label = `<text x="${labelX}" y="${labelY}" text-anchor="middle" fill="white" font-size="8" font-weight="bold">${(percentage * 100).toFixed(0)}%</text>`;

      startAngle = endAngle;
      return path + label;
    }).join('');

    // Create legend
    const legendItems = taxDetails.pieChartData.map((item: any, index: number) => {
      const color = PIE_CHART_COLORS[index % PIE_CHART_COLORS.length];
      return `
        <div style="display: flex; align-items: center; margin-bottom: 5px;">
          <div style="width: 12px; height: 12px; background-color: ${color}; margin-right: 8px;"></div>
          <div>${item.name}: ${formatCurrency(item.value)} (${(item.value / total * 100).toFixed(1)}%)</div>
        </div>
      `;
    }).join('');

    pieChartSvg = `
      <h2>Monthly Income Allocation</h2>
      <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: 30px;">
        <svg width="200" height="200" viewBox="0 0 200 200">
          ${pieChartParts}
        </svg>
        <div style="margin-top: 20px; width: 100%;">
          ${legendItems}
        </div>
      </div>
    `;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Salary Breakdown</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #163b6d; }
        h2 { color: #163b6d; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
        .amount { text-align: right; }
        .total { font-weight: bold; }
        .net { color: #16a34a; font-weight: bold; }
        .deduction { color: #dc2626; }
        .footer { margin-top: 50px; font-size: 12px; color: #666; text-align: center; }
      </style>
    </head>
    <body>
      <h1>Salary Breakdown</h1>

      <h2>Period Conversions</h2>
      <table>
        <tr>
          <th>Period</th>
          <th class="amount">Amount</th>
        </tr>
        ${Object.entries(calculatedAmounts).map(([period, amount]) => `
          <tr>
            <td>${period.charAt(0).toUpperCase() + period.slice(1)}</td>
            <td class="amount">${formatCurrency(amount as number)}</td>
          </tr>
        `).join('')}
      </table>

      <h2>Monthly Breakdown</h2>
      <table>
        <tr>
          <th>Item</th>
          <th class="amount">Amount</th>
        </tr>
        <tr>
          <td>Gross Monthly Income</td>
          <td class="amount total">${formatCurrency(taxDetails.monthlyGross)}</td>
        </tr>
        <tr>
          <td>Income Tax (PAYE)</td>
          <td class="amount deduction">- ${formatCurrency(taxDetails.incomeTax)}</td>
        </tr>
        <tr>
          <td>UIF Contribution</td>
          <td class="amount deduction">- ${formatCurrency(taxDetails.uif)}</td>
        </tr>
        ${taxDetails.pension > 0 ? `
          <tr>
            <td>Pension Fund</td>
            <td class="amount deduction">- ${formatCurrency(taxDetails.pension)}</td>
          </tr>
        ` : ''}
        ${taxDetails.medical > 0 ? `
          <tr>
            <td>Medical Aid</td>
            <td class="amount deduction">- ${formatCurrency(taxDetails.medical)}</td>
          </tr>
        ` : ''}
        ${taxDetails.groupLife > 0 ? `
          <tr>
            <td>Group Life Insurance</td>
            <td class="amount deduction">- ${formatCurrency(taxDetails.groupLife)}</td>
          </tr>
        ` : ''}
        ${taxDetails.retirement > 0 ? `
          <tr>
            <td>Retirement Annuity</td>
            <td class="amount deduction">- ${formatCurrency(taxDetails.retirement)}</td>
          </tr>
        ` : ''}
        <tr>
          <td>Total Monthly Deductions</td>
          <td class="amount deduction total">- ${formatCurrency(taxDetails.totalDeductions)}</td>
        </tr>
        <tr>
          <td>Net Monthly Income (Take-Home)</td>
          <td class="amount net">${formatCurrency(taxDetails.netIncome)}</td>
        </tr>
      </table>

      ${pieChartSvg}

      <div class="footer">
        <p>Generated by WorkWise.SA Salary Calculator</p>
        <p>For estimation purposes only. Consult a financial advisor for professional advice.</p>
        <p>Tax brackets and MTC rates for 2024/2025 tax year.</p>
      </div>
    </body>
    </html>
  `;

  return html;
};

// Function to print the salary breakdown
const printSalaryBreakdown = (taxDetails: any, calculatedAmounts: any, includePieChart: boolean = false) => {
  const html = generatePrintableHTML(taxDetails, calculatedAmounts, includePieChart);

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }

  return true;
};

// Function to export salary breakdown as PDF
const exportSalaryBreakdownPDF = (taxDetails: any, calculatedAmounts: any) => {
  // We'll use the browser's print to PDF functionality
  const html = generatePrintableHTML(taxDetails, calculatedAmounts, true); // Include pie chart

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();

    // Add a message to guide the user to save as PDF
    const message = document.createElement('div');
    message.style.position = 'fixed';
    message.style.top = '0';
    message.style.left = '0';
    message.style.right = '0';
    message.style.padding = '10px';
    message.style.backgroundColor = '#163b6d';
    message.style.color = 'white';
    message.style.textAlign = 'center';
    message.style.zIndex = '9999';
    message.innerHTML = 'To save as PDF, select "Save as PDF" in the print dialog (Ctrl+P or ⌘+P)';

    printWindow.document.body.insertBefore(message, printWindow.document.body.firstChild);

    // Focus and trigger print dialog
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      // Remove the message after print dialog is shown
      setTimeout(() => {
        if (message.parentNode) {
          message.parentNode.removeChild(message);
        }
      }, 100);
    }, 500);
  }

  return true;
};

// Function to copy a shareable summary to clipboard
const copySalaryBreakdownToClipboard = (taxDetails: any) => {
  const text = `
Salary Breakdown Summary:
- Gross Monthly: ${formatCurrency(taxDetails.monthlyGross)}
- Total Deductions: ${formatCurrency(taxDetails.totalDeductions)}
- Net Monthly (Take-Home): ${formatCurrency(taxDetails.netIncome)}
- Effective Tax Rate: ${taxDetails.effectiveTaxRate.toFixed(1)}%

Generated with WorkWise.SA Salary Calculator
  `.trim();

  navigator.clipboard.writeText(text)
    .then(() => {
      toast({
        title: "Copied to clipboard",
        description: "Salary breakdown summary has been copied to your clipboard.",
      });
      return true;
    })
    .catch(err => {
      console.error('Failed to copy text: ', err);
      return false;
    });
};

// Function to share via email
const shareSalaryBreakdownViaEmail = (taxDetails: any) => {
  const subject = 'Salary Breakdown from WorkWise.SA';
  const body = `
Salary Breakdown Summary:

- Gross Monthly: ${formatCurrency(taxDetails.monthlyGross)}
- Total Deductions: ${formatCurrency(taxDetails.totalDeductions)}
- Net Monthly (Take-Home): ${formatCurrency(taxDetails.netIncome)}
- Effective Tax Rate: ${taxDetails.effectiveTaxRate.toFixed(1)}%

Generated with WorkWise.SA Salary Calculator
  `.trim();

  const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(mailtoLink, '_blank');

  return true;
};

// Easing functions for smoother animations
const easingFunctions = {
  // Cubic easing in/out - acceleration until halfway, then deceleration
  easeInOutCubic: (t: number): number => {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  },

  // Exponential easing in/out - accelerating until halfway, then decelerating
  easeInOutExpo: (t: number): number => {
    return t === 0
      ? 0
      : t === 1
      ? 1
      : t < 0.5
      ? Math.pow(2, 20 * t - 10) / 2
      : (2 - Math.pow(2, -20 * t + 10)) / 2;
  },

  // Smooth spring-like effect with slight bounce
  elasticOut: (t: number): number => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
      ? 0
      : t === 1
      ? 1
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }
};

// Helper function for animating number increment with smoother animation
const useAnimatedCounter = (targetValue: number, duration: number = 1000, delay: number = 0) => {
  const [count, setCount] = useState(0);
  const previousValue = useRef(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const delayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // Clear any existing delay timeout
    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current);
    }

    // Set initial value to previous target or 0
    setCount(previousValue.current);

    // Start animation after delay
    delayTimeoutRef.current = setTimeout(() => {
      startTimeRef.current = null;

      const animate = (timestamp: number) => {
        if (!startTimeRef.current) startTimeRef.current = timestamp;
        const elapsed = timestamp - startTimeRef.current;

        if (elapsed < duration) {
          // Calculate the current count based on elapsed time with easing
          const linearProgress = elapsed / duration;

          // Custom combined easing for ultra-smooth animation
          // First 80% uses cubic easing for smooth acceleration/deceleration
          // Last 20% uses elastic for a subtle spring effect at the end
          let easedProgress;
          if (linearProgress < 0.8) {
            // Normalize progress to 0-1 range for the first 80%
            const normalizedProgress = linearProgress / 0.8;
            easedProgress = easingFunctions.easeInOutCubic(normalizedProgress) * 0.8;
          } else {
            // Normalize progress to 0-1 range for the last 20%
            const normalizedProgress = (linearProgress - 0.8) / 0.2;
            // Start from 80% and add the remaining 20% with elastic easing
            easedProgress = 0.8 + (easingFunctions.elasticOut(normalizedProgress) * 0.2);
          }

          const currentCount = previousValue.current + (targetValue - previousValue.current) * easedProgress;
          setCount(currentCount);
          animationRef.current = requestAnimationFrame(animate);
        } else {
          // Animation complete
          setCount(targetValue);
          previousValue.current = targetValue;
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    }, delay);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current);
      }
    };
  }, [targetValue, duration, delay]);

  return count;
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
    <div className={`flex justify-between items-center text-base ${className}`}>
      <div className="flex items-center">
        <span>{label}</span>
        {hasPopover && (
          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-6 w-6 p-1 ml-1 hover:bg-blue-100 dark:hover:bg-blue-900 transition-all duration-200 relative"
                  aria-describedby={helpId}
                >
                  <div className="absolute inset-0 rounded-full bg-blue-300 dark:bg-blue-700 opacity-30 blur-sm animate-pulse"></div>
                  <HelpCircle className="h-5 w-5 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 relative z-10" />
                  <span className="sr-only">More information</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent
                className="w-80 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 shadow-lg shadow-blue-100 dark:shadow-blue-900/20"
                id={helpId}
              >
                {popoverContent}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
  // State for export confirmation modal
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<'csv' | 'pdf' | 'print' | null>(null);

  // Animated monthly salary with 3.5 second delay and 2.5 second animation
  const animatedMonthlySalary = useAnimatedCounter(
    taxDetails.netIncome || 0,
    2500, // 2.5 second animation duration for smoother counting
    3500  // 3.5 second delay
  );

  // Handle export action
  const handleExport = (type: 'csv' | 'pdf' | 'print') => {
    setExportType(type);
    setExportModalOpen(true);
  };

  // Confirm export action
  const confirmExport = () => {
    setExportModalOpen(false);

    switch(exportType) {
      case 'csv':
        exportSalaryBreakdownCSV(taxDetails, calculatedAmounts);
        break;
      case 'pdf':
        exportSalaryBreakdownPDF(taxDetails, calculatedAmounts);
        break;
      case 'print':
        printSalaryBreakdown(taxDetails, calculatedAmounts);
        break;
    }
  };

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
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="flex items-center text-[#163b6d]">
            <img src="/images/coin-icon.png" alt="Coin" className="mr-4 h-12 w-12" />
            Salary Breakdown
          </CardTitle>
          <CardDescription>Your estimated income and deductions based on your input.</CardDescription>
        </div>
        <div className="mt-4 md:mt-0">
          <div className="font-bold text-2xl flex flex-col items-end">
            <span className="text-base text-gray-500 mb-1">Monthly Take-Home</span>
            <span className="text-4xl text-green-600 dark:text-green-400">{formatCurrency(animatedMonthlySalary)}</span>
          </div>
        </div>
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
          <h3 className="text-xl font-medium text-[#163b6d]">Monthly Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-2">
              <DeductionItem label="Gross Monthly Income" value={formatCurrency(taxDetails.monthlyGross)} isIncome className="text-base" />
              <Separator />

              <DeductionItem
                label="Income Tax (PAYE)" value={formatCurrency(taxDetails.incomeTax)} isDeduction
                className="text-base"
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
                className="text-base"
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
                    className="text-base"
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
              <DeductionItem label="Total Monthly Deductions" value={formatCurrency(taxDetails.totalDeductions)} isDeduction className="font-semibold text-lg" />
              <Separator />
              <DeductionItem label="Net Monthly Income (Take-Home)" value={formatCurrency(taxDetails.netIncome)} className="font-bold text-lg text-green-600 dark:text-green-400" />
            </div>

            <div className="flex flex-col space-y-4 bg-muted/30 p-4 rounded-lg">
              <h4 className="text-xl font-medium text-[#163b6d] text-center">Monthly Summary</h4>
              <div className="space-y-3">
                <div className="flex flex-col items-center">
                  <span className="text-base text-muted-foreground">Net Income</span>
                  <span className="text-3xl font-bold text-green-600 dark:text-green-400">{formatCurrency(taxDetails.netIncome)}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-base text-muted-foreground">Deductions</span>
                  <span className="text-3xl font-bold text-red-600 dark:text-red-400">- {formatCurrency(taxDetails.totalDeductions)}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-base text-muted-foreground">Gross</span>
                  <span className="text-3xl font-bold text-[#163b6d]">{formatCurrency(taxDetails.monthlyGross)}</span>
                </div>
              </div>
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Download size={16} /> Export Results
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <Download className="mr-2 h-4 w-4" />
                <span>Download as CSV</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <FileText className="mr-2 h-4 w-4" />
                <span>Download as PDF</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('print')}>
                <Printer className="mr-2 h-4 w-4" />
                <span>Print</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Share2 size={16} /> Share
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => copySalaryBreakdownToClipboard(taxDetails)}>
                <Copy className="mr-2 h-4 w-4" />
                <span>Copy to Clipboard</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => shareSalaryBreakdownViaEmail(taxDetails)}>
                <Mail className="mr-2 h-4 w-4" />
                <span>Share via Email</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export Confirmation Modal */}
          <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Confirm Export</DialogTitle>
                <DialogDescription>
                  Review your salary breakdown before exporting
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="rounded-md bg-muted p-4">
                  <h3 className="font-medium mb-2">Monthly Summary</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Gross Monthly:</span>
                      <span className="font-medium">{formatCurrency(taxDetails.monthlyGross)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Deductions:</span>
                      <span className="font-medium text-red-600">- {formatCurrency(taxDetails.totalDeductions)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Net Monthly (Take-Home):</span>
                      <span className="font-medium text-green-600">{formatCurrency(taxDetails.netIncome)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Effective Tax Rate:</span>
                      <span className="font-medium">{taxDetails.effectiveTaxRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                {/* Mini Pie Chart Preview */}
                {taxDetails.pieChartData && taxDetails.pieChartData.length > 0 && (
                  <div className="rounded-md bg-muted p-4">
                    <h3 className="font-medium mb-2">Income Allocation</h3>
                    <div className="h-[150px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={taxDetails.pieChartData}
                            cx="50%" cy="50%"
                            outerRadius={60}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {taxDetails.pieChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip content={<CustomPieTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="sm:justify-between">
                <Button variant="outline" onClick={() => setExportModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={confirmExport}>
                  {exportType === 'csv' ? 'Download CSV' :
                   exportType === 'pdf' ? 'Download PDF' :
                   'Print'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Separator className="my-6" />

        {/* New Card Section for Monthly Income Allocation */}
        <div className="bg-muted/20 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-[#163b6d] mb-4">Monthly Income Allocation</h3>
          <div className="flex flex-col items-center">
            {taxDetails.pieChartData && taxDetails.pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={taxDetails.pieChartData}
                    cx="50%" cy="50%" labelLine={false}
                    outerRadius={100} fill="#8884d8" dataKey="value"
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
      </CardContent>
    </Card>
  );
};

export default ResultsCard;
