import { Helmet } from 'react-helmet-async';
import { Link } from 'wouter';
import { BadgeCheck, BriefcaseBusiness, FileText, GraduationCap, IdCard, Wrench } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductShell, ComingSoonState } from '@/components/brand/ProductShell';
import { talentSquare } from '@/config/brand';

const existingWorkflows = [
  { title: 'Profile and contact details', description: 'Keep your professional basics current.', href: '/profile-setup', icon: IdCard },
  { title: 'CV and experience', description: 'Build, edit, or download your CV using the existing CV Builder.', href: '/cv-builder', icon: FileText },
  { title: 'Skills and qualifications', description: 'Add skills, education, and work history in profile setup.', href: '/profile-setup', icon: GraduationCap },
  { title: 'Application readiness', description: 'Review your profile before applying through Square Jobs.', href: '/jobs', icon: BriefcaseBusiness },
];

export default function TalentPassport() {
  return (
    <>
      <Helmet>
        <title>{talentSquare.products.passport.label} | {talentSquare.name}</title>
        <meta name="description" content="Build the professional record that helps you prepare for opportunities on TalentSquare." />
      </Helmet>
      <ProductShell
        eyebrow="Your professional record"
        title={talentSquare.products.passport.label}
        description="Bring together the profile, CV, skills, and experience you already manage on TalentSquare—then see what is still needed to be ready for your next opportunity."
      >
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-talent-ink/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-talent-ink"><BadgeCheck className="h-5 w-5 text-talent-north-star" /> Passport readiness</CardTitle>
              <CardDescription>Complete the existing essentials first. Detailed readiness scoring will be introduced when the supporting data model is available.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {existingWorkflows.map(({ title, description, href, icon: Icon }) => (
                <Link key={title} href={href} className="rounded-lg border border-border p-4 transition-colors hover:border-talent-north-star hover:bg-amber-50/50">
                  <Icon className="h-5 w-5 text-talent-ink" />
                  <h2 className="mt-3 font-semibold text-talent-ink">{title}</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
                </Link>
              ))}
            </CardContent>
          </Card>
          <div className="grid gap-4">
            <ComingSoonState title="Verification" description="Verification states will require a reviewed credential and document workflow before they are shown here." />
            <ComingSoonState title="Licences and certificates" description="Store and validate supporting credentials once the secure document model is available." />
            <ComingSoonState title="Shareable profile" description="A shareable candidate profile will be added with privacy controls and explicit candidate consent." />
            <ComingSoonState title="Documents" description="Existing CV upload remains available in profile setup; broader document management is planned." />
          </div>
        </div>
      </ProductShell>
    </>
  );
}
