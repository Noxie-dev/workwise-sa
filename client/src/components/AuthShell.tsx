import type { ReactNode } from 'react';
import { Link } from 'wouter';
import {
  BadgeCheck,
  BriefcaseBusiness,
  FileText,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

type AuthShellProps = {
  children: ReactNode;
  cardMaxWidth?: 'md' | 'lg';
};

const featureItems = [
  {
    icon: Search,
    title: 'Matched jobs',
    detail: 'Find roles that fit your skills, location, and goals.',
  },
  {
    icon: FileText,
    title: 'CV tools',
    detail: 'Build, polish, and export job-ready CVs faster.',
  },
  {
    icon: BriefcaseBusiness,
    title: 'Applications',
    detail: 'Track saved jobs, applications, and next steps.',
  },
  {
    icon: Sparkles,
    title: 'AI guidance',
    detail: 'Get practical suggestions for summaries and cover letters.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure account',
    detail: 'Sign in with password, Google, or email link.',
  },
];

const cardWidth = {
  md: 'max-w-md',
  lg: 'max-w-lg',
};

const AuthShell = ({ children, cardMaxWidth = 'md' }: AuthShellProps) => {
  const scrollingItems = [...featureItems, ...featureItems];

  return (
    <main
      className="relative flex min-h-[calc(100vh-4rem)] flex-grow items-center justify-center overflow-hidden px-4 py-8 sm:py-10"
      style={{
        backgroundColor: '#f8fafc',
        backgroundImage:
          'linear-gradient(45deg, rgba(15, 23, 42, 0.055) 25%, transparent 25%), linear-gradient(-45deg, rgba(15, 23, 42, 0.055) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(15, 23, 42, 0.055) 75%), linear-gradient(-45deg, transparent 75%, rgba(15, 23, 42, 0.055) 75%)',
        backgroundPosition: '0 0, 0 12px, 12px -12px, -12px 0',
        backgroundSize: '24px 24px',
      }}
    >
      <style>
        {`
          @keyframes authFeatureFloat {
            0% { transform: translateY(0); }
            100% { transform: translateY(-50%); }
          }
        `}
      </style>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.14),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_30%)]" />

      <div className="relative z-10 grid w-full min-w-0 max-w-6xl grid-cols-1 items-center justify-items-center gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="flex w-full min-w-0 flex-col items-center">
          <Link
            href="/"
            className="mb-4 inline-flex items-center justify-center"
            aria-label="WorkWise SA home"
          >
            <img
              src="/images/header-logo.png"
              alt="WorkWise SA"
              className="h-24 w-auto object-contain sm:h-28"
            />
          </Link>
          <div className={`w-full max-w-[calc(100vw-2rem)] ${cardWidth[cardMaxWidth]}`}>
            {children}
          </div>
        </section>

        <aside className="pointer-events-none hidden lg:block">
          <div className="relative h-[460px] overflow-hidden rounded-lg border border-white/70 bg-white/75 p-3 shadow-xl shadow-slate-900/10 backdrop-blur">
            <div className="absolute inset-x-0 top-0 z-10 h-14 bg-gradient-to-b from-white via-white/80 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 z-10 h-14 bg-gradient-to-t from-white via-white/80 to-transparent" />
            <div
              className="space-y-3"
              style={{ animation: 'authFeatureFloat 22s linear infinite' }}
            >
              {scrollingItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={`${item.title}-${index}`}
                    className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h2 className="text-sm font-semibold text-slate-950">{item.title}</h2>
                          {index === 0 && <BadgeCheck className="h-4 w-4 text-emerald-600" />}
                        </div>
                        <p className="mt-1 text-sm leading-5 text-slate-600">{item.detail}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        <section className="w-full max-w-[calc(100vw-2rem)] overflow-hidden lg:hidden">
          <div className="flex w-full gap-3 overflow-hidden">
            {featureItems.slice(0, 3).map(item => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="min-w-[min(220px,82vw)] rounded-lg border border-white/80 bg-white/85 p-3 shadow-sm backdrop-blur"
                >
                  <div className="flex items-start gap-2">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <h2 className="text-sm font-semibold text-slate-950">{item.title}</h2>
                      <p className="mt-1 text-xs leading-5 text-slate-600">{item.detail}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
};

export default AuthShell;
