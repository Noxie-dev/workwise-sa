import React from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import ComingSoon from '@/components/ComingSoon';

/**
 * BlogWisePage component
 * 
 * Displays a coming soon message for the Blog Wise feature
 */
const BlogWisePage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Blog Wise - WorkWise SA</title>
        <meta name="description" content="Explore the latest job market trends, career advice, and industry insights on WorkWise SA's Blog Wise." />
      </Helmet>

      <main className="flex-grow bg-light py-8">
        <div className="container mx-auto px-4">
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Blog Wise</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Blog Wise</h1>
            <p className="text-muted max-w-2xl mx-auto">
              Stay informed with the latest job market trends, career advice, and industry insights.
            </p>
          </div>

          <ComingSoon 
            title="Blog Wise Coming Soon" 
            description="Our blog section is currently under development. Check back soon for valuable insights, job market trends, and career advice tailored for the South African job market."
          />
        </div>
      </main>
    </>
  );
};

export default BlogWisePage;
