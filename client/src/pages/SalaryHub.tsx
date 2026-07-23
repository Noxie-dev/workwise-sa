import { Helmet } from 'react-helmet-async';
import { Calculator } from 'lucide-react';
import SalaryCalculator from '@/components/salary/SalaryCalculator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ComingSoonState, ProductShell } from '@/components/brand/ProductShell';
import { talentSquare } from '@/config/brand';

export default function SalaryHub() {
  return (
    <>
      <Helmet>
        <title>{talentSquare.products.salaryHub.label} | {talentSquare.name}</title>
        <meta name="description" content="Use TalentSquare salary tools to explore earnings, pay periods, and South African salary guidance." />
      </Helmet>
      <ProductShell
        eyebrow="Salary and earnings tools"
        title={talentSquare.products.salaryHub.label}
        description="Start with the existing South African salary calculator, then explore the modules planned to make pay decisions easier to understand."
      >
        <Card className="border-talent-ink/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-talent-ink"><Calculator className="h-5 w-5 text-talent-north-star" /> Salary calculator</CardTitle>
            <CardDescription>Estimates are for guidance only. They are not tax, payroll, legal, or financial advice.</CardDescription>
          </CardHeader>
          <CardContent><SalaryCalculator showHeader={false} /></CardContent>
        </Card>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <ComingSoonState title="Pay-period conversions" description="Hourly, weekly, monthly, and annual views will be added as clearly explained calculation tools." />
          <ComingSoonState title="Job and location comparisons" description="Comparison tools need validated salary data and transparent methodology before release." />
          <ComingSoonState title="Market guidance" description="South African labour-market and tax integrations will be introduced only with maintained data sources." />
        </div>
      </ProductShell>
    </>
  );
}
