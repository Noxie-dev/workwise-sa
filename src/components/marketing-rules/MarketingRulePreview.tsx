// src/components/marketing-rules/MarketingRulePreview.tsx
import React from 'react';
import { MarketingRule, JobListingExample } from '@/types/marketing-rules';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from 'lucide-react'; // Assuming Link icon for CTA

interface MarketingRulePreviewProps {
    ruleBeingEdited: MarketingRule | null; // The rule being edited (use data from form ideally)
    originalJob: JobListingExample | null | undefined;
    isLoadingJob: boolean;
}

const JobPreviewCard: React.FC<{ title: string, job: JobListingExample | null | undefined, cta?: { message: string, link: string } }> = ({ title, job, cta }) => {
     if (!job) return <Skeleton className="h-64 w-full" />; // Or some placeholder

    return (
        <Card className="flex-1 min-w-[300px]">
            <CardHeader className="pb-2">
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
                <h4 className="font-semibold">{job.title}</h4>
                <p><span className="font-medium">Company:</span> {job.company}</p>
                <p><span className="font-medium">Location:</span> {job.location}</p>
                <p><span className="font-medium">Job Type:</span> {job.jobType}</p>
                <p className="text-xs pt-2 border-t mt-2">{job.description}</p>

                {/* Conditional Contact/CTA Section */}
                {cta ? (
                    <div className="mt-3 pt-3 border-t border-green-200 bg-green-50 p-3 rounded">
                         <p className="font-semibold text-green-800">How to Apply:</p>
                         <p className="text-green-700">{cta.message}</p>
                         {cta.link && (
                             <a href={cta.link} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center text-primary hover:underline text-xs font-medium">
                                 <Link className="h-3 w-3 mr-1" /> Visit WorkwiseSA {/* Or use rule name/dynamic text */}
                             </a>
                         )}
                     </div>
                ) : job.contactInfo && (
                     <div className="mt-3 pt-3 border-t border-amber-200 bg-amber-50 p-3 rounded">
                         <p className="font-semibold text-amber-800">Contact Information:</p>
                         {job.contactInfo.email && <p className="text-amber-700 text-xs">Email: {job.contactInfo.email}</p>}
                         {job.contactInfo.phone && <p className="text-amber-700 text-xs">Phone: {job.contactInfo.phone}</p>}
                         {job.contactInfo.applyInstructions && <p className="text-amber-700 text-xs">{job.contactInfo.applyInstructions}</p>}
                     </div>
                 )}
            </CardContent>
        </Card>
    );
}


export const MarketingRulePreview: React.FC<MarketingRulePreviewProps> = ({ ruleBeingEdited, originalJob, isLoadingJob }) => {
    // Ideally, get live form data here instead of just `ruleBeingEdited` for instant preview
    const ctaData = ruleBeingEdited ? { message: ruleBeingEdited.messageTemplate, link: ruleBeingEdited.ctaLink } : undefined;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Marketing Rule Preview</CardTitle>
                <CardDescription>See how the rule affects a sample job listing.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4 justify-center md:justify-start">
                {isLoadingJob ? (
                    <>
                        <Skeleton className="h-72 w-full md:flex-1 min-w-[300px]" />
                        <Skeleton className="h-72 w-full md:flex-1 min-w-[300px]" />
                    </>
                ) : (
                    <>
                        <JobPreviewCard title="Original Job Listing" job={originalJob} />
                        <JobPreviewCard title="After Marketing Rule Applied" job={originalJob} cta={ctaData} />
                    </>
                )}
            </CardContent>
        </Card>
    );
};
