import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'wouter';
import {
  ArrowRight,
  BookOpenCheck,
  BriefcaseBusiness,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  FileText,
  GraduationCap,
  HelpCircle,
  LifeBuoy,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
} from 'lucide-react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import SubmitFeedbackModal from '@/components/modals/SubmitFeedbackModal';

declare global {
  interface Window {
    analytics?: {
      page: (name: string) => void;
      track: (event: string, properties?: Record<string, any>) => void;
    };
  }
}

type ResourceCategory = 'All' | 'CV' | 'Interview' | 'Search' | 'Money' | 'Skills' | 'Support';

type Resource = {
  title: string;
  description: string;
  href: string;
  category: Exclude<ResourceCategory, 'All'>;
  level: string;
  time: string;
  action: string;
  icon: React.ComponentType<{ className?: string }>;
  tags: string[];
};

const categories: ResourceCategory[] = [
  'All',
  'CV',
  'Interview',
  'Search',
  'Money',
  'Skills',
  'Support',
];

const resources: Resource[] = [
  {
    title: 'Build or Improve Your CV',
    description:
      'Create a cleaner CV, improve weak sections, and use templates suited to South African entry-level roles.',
    href: '/cv-builder',
    category: 'CV',
    level: 'Start here',
    time: '15-25 min',
    action: 'Open CV Builder',
    icon: FileText,
    tags: ['cv', 'resume', 'templates', 'profile'],
  },
  {
    title: 'CV Builder Help Guide',
    description:
      'Step-by-step help for personal details, work history, education, skills, summaries, and troubleshooting.',
    href: '/resources/cv-builder-help',
    category: 'CV',
    level: 'Guide',
    time: '8 min',
    action: 'Read Guide',
    icon: BookOpenCheck,
    tags: ['cv help', 'summary', 'experience', 'education'],
  },
  {
    title: 'CV Templates',
    description:
      'Browse simple, readable CV formats for retail, admin, hospitality, security, drivers, and general workers.',
    href: '/resources/cv-templates',
    category: 'CV',
    level: 'Templates',
    time: '5 min',
    action: 'View Templates',
    icon: ClipboardCheck,
    tags: ['templates', 'retail', 'admin', 'security'],
  },
  {
    title: 'Interview Preparation',
    description:
      'Practice common questions, prepare stronger examples, and plan what to ask employers before you arrive.',
    href: '/resources/interview-tips',
    category: 'Interview',
    level: 'Practice',
    time: '10 min',
    action: 'Prepare Now',
    icon: MessageSquare,
    tags: ['interview', 'questions', 'answers'],
  },
  {
    title: 'Salary Guide',
    description:
      'Compare role expectations and salary ranges before applying, negotiating, or choosing between offers.',
    href: '/resources/salary-guide',
    category: 'Money',
    level: 'Calculator',
    time: '6 min',
    action: 'Check Salaries',
    icon: Calculator,
    tags: ['salary', 'pay', 'wages', 'money'],
  },
  {
    title: 'Find Better Matches',
    description:
      'Use job search filters, saved jobs, and clearer keywords to find roles that match your location and skills.',
    href: '/jobs',
    category: 'Search',
    level: 'Action',
    time: '5 min',
    action: 'Browse Jobs',
    icon: Compass,
    tags: ['jobs', 'search', 'location', 'filters'],
  },
  {
    title: 'Profile Readiness',
    description:
      'Make your WorkWise profile easier for employers to scan with better contact, skills, and experience details.',
    href: '/profile',
    category: 'Search',
    level: 'Checklist',
    time: '12 min',
    action: 'Update Profile',
    icon: UserRoundCheck,
    tags: ['profile', 'skills', 'experience'],
  },
  {
    title: 'WiseUp Learning',
    description:
      'Use short career learning content to build confidence, workplace habits, and job-search momentum.',
    href: '/wise-up',
    category: 'Skills',
    level: 'Learn',
    time: 'Ongoing',
    action: 'Open WiseUp',
    icon: GraduationCap,
    tags: ['learning', 'skills', 'workplace'],
  },
  {
    title: 'Account and Application Help',
    description:
      'Get help with sign-in, applications, profile issues, CV tools, employer workflows, or product feedback.',
    href: '/contact',
    category: 'Support',
    level: 'Support',
    time: '2 min',
    action: 'Get Help',
    icon: LifeBuoy,
    tags: ['support', 'account', 'help', 'feedback'],
  },
];

const readinessSteps = [
  'Your contact number and email are correct',
  'Your CV includes recent work, volunteering, or practical experience',
  'Your top skills match the jobs you are applying for',
  'You can explain why you want the role in one clear sentence',
  'You know your transport plan, shift availability, and salary expectation',
];

const pathways = [
  {
    title: 'Need a job quickly',
    description: 'Tighten your profile, search nearby roles, and apply with a focused CV.',
    steps: ['Update profile', 'Build CV', 'Browse jobs'],
    href: '/jobs',
    icon: BriefcaseBusiness,
  },
  {
    title: 'Got an interview',
    description: 'Prepare answers, documents, transport, and questions for the employer.',
    steps: ['Practice answers', 'Check salary range', 'Prepare documents'],
    href: '/resources/interview-tips',
    icon: ShieldCheck,
  },
  {
    title: 'Starting from scratch',
    description: 'Learn the basics, create your CV, and build confidence before applying.',
    steps: ['Read CV help', 'Use WiseUp', 'Create CV'],
    href: '/resources/cv-builder-help',
    icon: Sparkles,
  },
];

const Resources = () => {
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ResourceCategory>('All');

  useEffect(() => {
    window.analytics?.page('Resources Page View');
  }, []);

  const filteredResources = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return resources.filter(resource => {
      const matchesCategory = activeCategory === 'All' || resource.category === activeCategory;
      const searchableText = [
        resource.title,
        resource.description,
        resource.category,
        resource.level,
        ...resource.tags,
      ]
        .join(' ')
        .toLowerCase();

      return matchesCategory && (!normalizedQuery || searchableText.includes(normalizedQuery));
    });
  }, [activeCategory, query]);

  const trackResourceClick = (resourceTitle: string) => {
    window.analytics?.track('Resource Click', {
      resource: resourceTitle,
      category: activeCategory,
      search: query,
    });
  };

  const handleFeedbackClick = () => {
    window.analytics?.track('Resource Feedback Click');
    setIsFeedbackModalOpen(true);
  };

  return (
    <>
      <Helmet>
        <title>Career Resources & Support | WorkWise SA</title>
        <meta
          name="description"
          content="Practical career resources for South African job seekers: CV help, interview preparation, salary guidance, job-search tools, WiseUp learning, and support."
        />
      </Helmet>

      <main className="flex-grow bg-slate-50 py-8 text-slate-950 dark:bg-gray-950 dark:text-white">
        <div className="container mx-auto px-4">
          <Breadcrumb className="mb-5">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/" className="dark:text-blue-300">
                  Home
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="dark:text-gray-300">Resources</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <section className="mb-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:p-6">
            <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr] lg:items-end">
              <div>
                <Badge className="mb-3 bg-amber-100 text-amber-900 hover:bg-amber-100">
                  Career toolkit
                </Badge>
                <h1 className="text-3xl font-bold tracking-normal md:text-4xl">
                  Resources that help you take the next job-search step
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-gray-300 md:text-base">
                  Find practical help for CVs, interviews, salary decisions, job applications,
                  workplace skills, and account support. Start with a pathway or search the library.
                </p>
              </div>

              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700 dark:text-emerald-300" />
                  <div>
                    <h2 className="font-semibold text-emerald-950 dark:text-emerald-100">
                      Quick readiness check
                    </h2>
                    <p className="mt-1 text-sm text-emerald-900/80 dark:text-emerald-100/80">
                      Before applying, confirm your CV, contact details, role fit, and interview
                      basics are ready.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-8 grid gap-4 md:grid-cols-3">
            {pathways.map(pathway => {
              const Icon = pathway.icon;

              return (
                <Card key={pathway.title} className="rounded-lg border-slate-200">
                  <CardHeader>
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-sky-100 text-sky-800">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">{pathway.title}</CardTitle>
                    <CardDescription>{pathway.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 flex flex-wrap gap-2">
                      {pathway.steps.map(step => (
                        <Badge key={step} variant="outline" className="bg-white">
                          {step}
                        </Badge>
                      ))}
                    </div>
                    <Button asChild variant="outline" className="w-full justify-between">
                      <Link href={pathway.href}>
                        Start pathway
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </section>

          <section className="mb-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="search"
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder="Search CV help, interview tips, salary, support..."
                  className="h-11 pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <Button
                    key={category}
                    type="button"
                    variant={activeCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </section>

          <section className="mb-10">
            <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-2xl font-semibold">Resource Library</h2>
                <p className="text-sm text-slate-600 dark:text-gray-300">
                  {filteredResources.length} resource{filteredResources.length === 1 ? '' : 's'}{' '}
                  available
                </p>
              </div>
              {(query || activeCategory !== 'All') && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setQuery('');
                    setActiveCategory('All');
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>

            {filteredResources.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredResources.map(resource => {
                  const Icon = resource.icon;

                  return (
                    <Card key={resource.title} className="rounded-lg border-slate-200">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-rose-100 text-rose-800">
                            <Icon className="h-5 w-5" />
                          </div>
                          <Badge variant="secondary">{resource.category}</Badge>
                        </div>
                        <CardTitle className="text-lg">{resource.title}</CardTitle>
                        <CardDescription>{resource.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
                          <div className="rounded-md bg-slate-100 px-3 py-2 dark:bg-gray-800">
                            <p className="text-xs text-slate-500 dark:text-gray-400">Type</p>
                            <p className="font-medium">{resource.level}</p>
                          </div>
                          <div className="rounded-md bg-slate-100 px-3 py-2 dark:bg-gray-800">
                            <p className="text-xs text-slate-500 dark:text-gray-400">Time</p>
                            <p className="font-medium">{resource.time}</p>
                          </div>
                        </div>
                        <Button asChild className="w-full justify-between">
                          <Link
                            href={resource.href}
                            onClick={() => trackResourceClick(resource.title)}
                          >
                            {resource.action}
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-900">
                <HelpCircle className="mx-auto mb-3 h-10 w-10 text-slate-400" />
                <h3 className="text-lg font-semibold">No matching resources</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-gray-300">
                  Try a broader term like CV, interview, salary, jobs, skills, or support.
                </p>
              </div>
            )}
          </section>

          <section className="mb-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <Card className="rounded-lg border-slate-200">
              <CardHeader>
                <CardTitle>Application Readiness Checklist</CardTitle>
                <CardDescription>
                  Use this before you send applications or attend interviews.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {readinessSteps.map(step => (
                    <li key={step} className="flex gap-3 text-sm text-slate-700 dark:text-gray-200">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="rounded-lg border-slate-200">
              <CardHeader>
                <CardTitle>Need More Help?</CardTitle>
                <CardDescription>
                  Tell us where you are stuck, or go straight to support.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button asChild variant="outline" className="justify-between">
                    <Link href="/contact">
                      Contact support
                      <LifeBuoy className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-between" onClick={handleFeedbackClick}>
                    Submit feedback
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-5 rounded-lg bg-indigo-50 p-4 text-sm text-indigo-950 dark:bg-indigo-950/40 dark:text-indigo-100">
                  <p className="font-medium">For employers</p>
                  <p className="mt-1">
                    Employer tools live in their own workspace for posting jobs, reviewing
                    applications, and managing listings.
                  </p>
                  <Button asChild size="sm" className="mt-3">
                    <Link href="/employers/dashboard">Open employer dashboard</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        <SubmitFeedbackModal
          isOpen={isFeedbackModalOpen}
          onClose={() => setIsFeedbackModalOpen(false)}
        />
      </main>
    </>
  );
};

export default Resources;
