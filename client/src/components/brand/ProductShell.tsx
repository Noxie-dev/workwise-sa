import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ProductShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}

export function NorthStarSquare({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('inline-block h-4 w-4 shrink-0 rounded-[2px] bg-talent-north-star shadow-sm', className)}
    />
  );
}

export function ProductMark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-bold tracking-tight text-talent-ink', className)}>
      <NorthStarSquare />
      TalentSquare
    </span>
  );
}

export function ProductShell({ eyebrow, title, description, children, className }: ProductShellProps) {
  return (
    <main className={cn('min-h-[calc(100vh-12rem)] bg-gradient-to-b from-amber-50/70 via-background to-background', className)}>
      <section className="container mx-auto px-4 py-10 md:py-14">
        <div className="max-w-3xl">
          <div className="mb-4 flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.16em] text-talent-ink/70">
            <NorthStarSquare className="h-3 w-3" />
            {eyebrow}
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-talent-ink md:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">{description}</p>
        </div>
        <div className="mt-10">{children}</div>
      </section>
    </main>
  );
}

export function ComingSoonState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-talent-ink/25 bg-white/70 p-5">
      <div className="flex items-center gap-2 font-semibold text-talent-ink">
        <NorthStarSquare className="h-3 w-3" />
        {title}
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}
