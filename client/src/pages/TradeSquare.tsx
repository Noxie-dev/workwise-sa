import { Helmet } from 'react-helmet-async';
import { Link } from 'wouter';
import { ArrowRight, GraduationCap, HardHat, Wrench } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ComingSoonState, ProductShell } from '@/components/brand/ProductShell';
import { talentSquare } from '@/config/brand';

const tradeCategories = ['Construction and built environment', 'Electrical and energy', 'Mechanical and manufacturing', 'Automotive and transport', 'Hospitality and services', 'Digital and technical trades'];

export default function TradeSquare() {
  return (
    <>
      <Helmet>
        <title>{talentSquare.products.tradeSquare.label} | {talentSquare.name}</title>
        <meta name="description" content="Explore a future home for trade skills, artisan pathways, learnerships, and work opportunities in South Africa." />
      </Helmet>
      <ProductShell
        eyebrow="Skills that build South Africa"
        title={talentSquare.products.tradeSquare.label}
        description="A future-facing space for artisans, practical skills, learnerships, and trade opportunities. Start with the TalentSquare tools already available today."
      >
        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-talent-ink/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-talent-ink"><HardHat className="h-5 w-5 text-talent-north-star" /> Trade pathways</CardTitle>
              <CardDescription>Browse the areas TradeSquare is being designed to support. Category-specific opportunities will appear only when verified data is available.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {tradeCategories.map(category => (
                <div key={category} className="rounded-lg border border-border bg-white p-4">
                  <Wrench className="h-5 w-5 text-talent-ink" />
                  <h2 className="mt-3 font-semibold text-talent-ink">{category}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Trade discovery is planned for this category.</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <div className="space-y-4">
            <Link href="/jobs" className="block rounded-lg border border-talent-ink bg-talent-ink p-5 text-white transition-transform hover:-translate-y-0.5">
              <div className="flex items-center justify-between"><BriefcaseLabel /><ArrowRight className="h-5 w-5" /></div>
              <p className="mt-3 text-sm text-white/80">Use Square Jobs to browse current opportunities while trade-specific filters are developed.</p>
            </Link>
            <Link href="/square-up" className="block rounded-lg border border-border bg-white p-5 transition-colors hover:border-talent-north-star">
              <div className="flex items-center justify-between text-talent-ink"><span className="flex items-center gap-2 font-semibold"><GraduationCap className="h-5 w-5" /> Build practical skills</span><ArrowRight className="h-5 w-5" /></div>
              <p className="mt-3 text-sm text-muted-foreground">Explore employability learning through SquareUp.</p>
            </Link>
            <Link href="/talent-passport" className="block rounded-lg border border-border bg-white p-5 transition-colors hover:border-talent-north-star">
              <div className="flex items-center justify-between text-talent-ink"><span className="font-semibold">Prepare your Talent Passport</span><ArrowRight className="h-5 w-5" /></div>
              <p className="mt-3 text-sm text-muted-foreground">Keep your experience and skills ready for future verified trade profiles.</p>
            </Link>
            <ComingSoonState title="Learnerships and verified trade profiles" description="These need dedicated data, qualification, verification, and employer workflows before launch." />
          </div>
        </div>
      </ProductShell>
    </>
  );
}

function BriefcaseLabel() {
  return <span className="flex items-center gap-2 font-semibold"><Wrench className="h-5 w-5 text-talent-north-star" /> Explore Square Jobs</span>;
}
