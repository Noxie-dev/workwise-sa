import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'wouter';
import {
  Banknote,
  BarChart3,
  BriefcaseBusiness,
  Calculator,
  CheckCircle2,
  FileDown,
  MapPin,
  Scale,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import SalaryCalculator from '@/components/salary/SalaryCalculator';
import {
  allIndustryAverages,
  lowLevelJobAverages,
  MINIMUM_WAGE,
  professionalIndustryAverages,
  regionalVariations,
} from '@/data/salaryData';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(value);

const marketRoles = Object.keys(allIndustryAverages);

const SalaryOfferCheck = () => {
  const [role, setRole] = React.useState('Retail Assistant');
  const [province, setProvince] = React.useState('Gauteng');
  const [monthlyOffer, setMonthlyOffer] = React.useState(6500);

  const benchmark = allIndustryAverages[role as keyof typeof allIndustryAverages];
  const regionalMultiplier = regionalVariations[province as keyof typeof regionalVariations] ?? 1;
  const entryBenchmark = benchmark.entry * regionalMultiplier;
  const midBenchmark = benchmark.mid * regionalMultiplier;
  const seniorBenchmark = benchmark.senior * regionalMultiplier;
  const floorGap = monthlyOffer - MINIMUM_WAGE.monthly;
  const marketPosition =
    monthlyOffer < entryBenchmark * 0.9
      ? 'Below typical entry range'
      : monthlyOffer > seniorBenchmark * 1.08
        ? 'Above typical senior range'
        : monthlyOffer >= midBenchmark
          ? 'Competitive for this market'
          : 'Within early-career range';
  const marketPositionTone =
    monthlyOffer < entryBenchmark * 0.9
      ? 'border-amber-300 bg-amber-50 text-amber-900'
      : 'border-emerald-300 bg-emerald-50 text-emerald-900';

  return (
    <Card className="overflow-hidden border-[#163b6d]/15 shadow-md">
      <CardHeader className="bg-[#f7fafc]">
        <CardTitle className="flex items-center gap-2 text-xl text-[#163b6d]">
          <Scale className="h-5 w-5 text-[#f2c94c]" />
          ZAR Offer Check
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Compare a monthly offer against role benchmarks, province differences, and the 2026
          national minimum wage.
        </p>
      </CardHeader>
      <CardContent className="grid gap-6 pt-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="salary-role">Role or sector</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="salary-role">
                <SelectValue placeholder="Choose a role" />
              </SelectTrigger>
              <SelectContent>
                {marketRoles.map(option => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="salary-province">Province</Label>
              <Select value={province} onValueChange={setProvince}>
                <SelectTrigger id="salary-province">
                  <SelectValue placeholder="Choose province" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(regionalVariations).map(option => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthly-offer">Monthly gross offer</Label>
              <Input
                id="monthly-offer"
                min="0"
                type="number"
                value={monthlyOffer}
                onChange={event => setMonthlyOffer(Number(event.target.value) || 0)}
              />
            </div>
          </div>

          <div className="rounded-md border border-[#163b6d]/15 bg-white p-4 text-sm text-muted-foreground">
            Minimum wage reference: {formatCurrency(MINIMUM_WAGE.hourly)} per hour, about{' '}
            {formatCurrency(MINIMUM_WAGE.monthly)} per month for 45 ordinary hours a week.
          </div>
        </div>

        <div className="space-y-4">
          <div className={`rounded-md border p-4 ${marketPositionTone}`}>
            <div className="text-sm font-semibold">Offer signal</div>
            <div className="mt-1 text-2xl font-bold">{marketPosition}</div>
            <p className="mt-2 text-sm">
              This offer is {formatCurrency(Math.abs(floorGap))} {floorGap >= 0 ? 'above' : 'below'}{' '}
              the 2026 monthly minimum wage reference.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ['Entry', entryBenchmark],
              ['Mid', midBenchmark],
              ['Senior', seniorBenchmark],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border border-border bg-white p-4">
                <div className="text-xs font-semibold uppercase text-muted-foreground">{label}</div>
                <div className="mt-1 text-lg font-bold text-[#163b6d]">
                  {formatCurrency(value as number)}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-md bg-[#163b6d] p-4 text-white">
            <div className="text-sm text-white/75">Annual gross equivalent</div>
            <div className="text-2xl font-bold">{formatCurrency(monthlyOffer * 12)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Use a more compatible approach for the page
const SalaryGuide: React.FC = () => {
  const entryRoleCount = Object.keys(lowLevelJobAverages).length;
  const professionalRoleCount = Object.keys(professionalIndustryAverages).length;

  return (
    <>
      <Helmet>
        <title>Salary Guide, ZAR Offer Check & Calculator - WorkWise SA</title>
        <meta
          name="description"
          content="Check ZAR salary offers, minimum wage references, take-home pay, and industry benchmarks across South Africa."
        />
      </Helmet>

      <main className="flex-grow bg-slate-50">
        <section className="border-b bg-white">
          <div className="container mx-auto grid gap-8 px-4 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-md bg-[#f2c94c]/20 px-3 py-2 text-sm font-semibold text-[#163b6d]">
                <Banknote className="h-4 w-4" />
                South African salary planning in ZAR
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-[#163b6d] md:text-5xl">
                Salary Guide & Calculator
              </h1>
              <p className="mt-5 text-lg leading-8 text-slate-700">
                Benchmark monthly pay, check whether an offer clears South Africa's minimum wage
                floor, and estimate take-home pay using 2026/2027 tax references.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button asChild className="bg-[#163b6d] hover:bg-[#102a47]">
                  <a href="#offer-check">
                    <Scale className="mr-2 h-4 w-4" />
                    Check an Offer
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <a href="#calculator">
                    <Calculator className="mr-2 h-4 w-4" />
                    Open Calculator
                  </a>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  icon: BriefcaseBusiness,
                  label: 'Benchmarked roles',
                  value: `${entryRoleCount + professionalRoleCount}`,
                  note: 'Entry-level and professional categories',
                },
                {
                  icon: MapPin,
                  label: 'Province adjustment',
                  value: '9',
                  note: 'Regional market multipliers',
                },
                {
                  icon: TrendingUp,
                  label: '2026 wage floor',
                  value: formatCurrency(MINIMUM_WAGE.hourly),
                  note: 'National minimum hourly rate',
                },
                {
                  icon: FileDown,
                  label: 'Exportable results',
                  value: 'CSV/PDF',
                  note: 'From the take-home calculator',
                },
              ].map(item => (
                <div
                  key={item.label}
                  className="rounded-md border border-[#163b6d]/15 bg-white p-5 shadow-sm"
                >
                  <item.icon className="h-5 w-5 text-[#f2c94c]" />
                  <div className="mt-4 text-2xl font-bold text-[#163b6d]">{item.value}</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{item.label}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{item.note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto space-y-8 px-4 py-8">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              'Know the gross monthly number before comparing jobs.',
              'Check province-adjusted benchmarks before negotiating.',
              'Use take-home pay, not only gross pay, for budgeting.',
            ].map(tip => (
              <div key={tip} className="flex items-start gap-3 rounded-md bg-white p-4 shadow-sm">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-emerald-600" />
                <p className="text-sm font-medium text-slate-700">{tip}</p>
              </div>
            ))}
          </div>

          <section id="offer-check" className="scroll-mt-28">
            <SalaryOfferCheck />
          </section>

          <section id="calculator" className="scroll-mt-28 rounded-md bg-white shadow-sm">
            <div className="border-b px-6 py-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#163b6d]">
                <BarChart3 className="h-4 w-4" />
                Take-home and benchmark calculator
              </div>
            </div>
            <SalaryCalculator />
          </section>

          <div className="rounded-md border border-slate-200 bg-white p-5 text-sm text-muted-foreground">
            Figures are estimates for planning and negotiation. Tax references are based on SARS
            2026/2027 individual tax tables, and wage floor references use the national minimum wage
            effective from 1 March 2026. For payroll, legal, or tax decisions, verify with SARS, the
            Department of Employment and Labour, or a qualified advisor.
            <Link href="/resources" className="ml-1 font-semibold text-[#163b6d] hover:underline">
              View more resources.
            </Link>
          </div>
        </section>
      </main>
    </>
  );
};

export default SalaryGuide;
