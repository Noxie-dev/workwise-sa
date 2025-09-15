import React, { lazy, Suspense } from 'react';
import CustomHelmet from '@/components/CustomHelmet';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load the CVBuilderHelpGuide component
const CVBuilderHelpGuide = lazy(() => import('@/components/resources/CVBuilderHelpGuide'));

// Loading fallback component
const GuideLoading = () => (
  <div className="space-y-6">
    <Skeleton className="h-8 w-1/3" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-5/6" />
    <div className="space-y-4 mt-8">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  </div>
);

/**
 * CV Builder Help page component
 */
const CVBuilderHelp: React.FC = () => {
  return (
    <>
      <CustomHelmet
        title="CV Builder Help Guide - WorkWise SA"
        description="Comprehensive guide to using the WorkWise SA CV Builder to create a professional CV for the South African job market."
      />

      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/" className="text-primary hover:text-primary/80">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/resources" className="text-primary hover:text-primary/80">Resources</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>CV Builder Help</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <h1 className="text-3xl font-bold mb-6">CV Builder Help Guide</h1>
          
          <Suspense fallback={<GuideLoading />}>
            <CVBuilderHelpGuide />
          </Suspense>
        </div>
      </main>
    </>
  );
};

export default CVBuilderHelp;
