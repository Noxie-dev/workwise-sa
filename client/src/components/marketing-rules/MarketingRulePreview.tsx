import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MarketingRule, JobListingExample } from '@/types/marketing-rules';
import { Badge } from '@/components/ui/badge';

interface MarketingRulePreviewProps {
  selectedRule: MarketingRule | null;
}

const MarketingRulePreview: React.FC<MarketingRulePreviewProps> = ({ selectedRule }) => {
  if (!selectedRule) {
    return null;
  }

  // Sample job listing data for preview
  const sampleJob: JobListingExample = {
    title: "General Worker",
    company: "ABC Manufacturing",
    location: "Johannesburg, Gauteng",
    jobType: "General Worker",
    description: "Entry-level position for a general worker. No experience required. Opportunity to learn and grow in a supportive environment.",
    contactInfo: {
      email: "jobs@abcmanufacturing.co.za",
      phone: "011-555-1234",
      applyInstructions: "Send CV to jobs@abcmanufacturing.co.za or call 011-555-1234"
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Marketing Rule Preview</CardTitle>
        <CardDescription>
          See how the rule affects a sample job listing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Original Job Listing */}
          <Card className="border-2 border-yellow-200">
            <CardHeader className="pb-2 bg-yellow-50">
              <CardTitle className="text-base">Original Job Listing</CardTitle>
              <CardDescription>Before marketing rule is applied</CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
              <h3 className="font-bold text-base">{sampleJob.title}</h3>
              <div className="mt-2">
                <p><span className="font-semibold">Company:</span> {sampleJob.company}</p>
                <p><span className="font-semibold">Location:</span> {sampleJob.location}</p>
                <p><span className="font-semibold">Job Type:</span> {sampleJob.jobType}</p>
              </div>
              <p className="mt-2">{sampleJob.description}</p>
              <div className="mt-4 border-t pt-2 bg-yellow-50 p-2 rounded">
                <p className="font-semibold">Contact Information:</p>
                <p>Email: {sampleJob.contactInfo.email}</p>
                <p>Phone: {sampleJob.contactInfo.phone}</p>
                <p>{sampleJob.contactInfo.applyInstructions}</p>
              </div>
            </CardContent>
          </Card>

          {/* After Marketing Rule Applied */}
          <Card className="border-2 border-green-200">
            <CardHeader className="pb-2 bg-green-50">
              <CardTitle className="text-base">After Marketing Rule Applied</CardTitle>
              <CardDescription>Contact info replaced with CTA</CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
              <h3 className="font-bold text-base">{sampleJob.title}</h3>
              <div className="mt-2">
                <p><span className="font-semibold">Company:</span> {sampleJob.company}</p>
                <p><span className="font-semibold">Location:</span> {sampleJob.location}</p>
                <p><span className="font-semibold">Job Type:</span> {sampleJob.jobType}</p>
              </div>
              <p className="mt-2">{sampleJob.description}</p>
              <div className="mt-4 border-t pt-2 bg-green-50 p-2 rounded">
                <p className="font-semibold">How to Apply:</p>
                <p className="text-blue-600 font-medium hover:text-yellow-600 cursor-pointer">
                  {selectedRule.ctaPreview || selectedRule.messageTemplate}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Links to: {selectedRule.ctaLink}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketingRulePreview;
