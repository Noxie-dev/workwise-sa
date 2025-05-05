// src/components/marketing-rules/JobDistributionWorkflow.tsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Database, Filter, MessageSquare, Share2 } from 'lucide-react';

export const JobDistributionWorkflow: React.FC = () => {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Job Distribution Workflow</CardTitle>
        <CardDescription>How marketing rules are applied to job listings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-2">
          <WorkflowStep 
            icon={<Database className="h-8 w-8 text-blue-500" />}
            title="Job Ingestion"
            description="Jobs are collected from various sources"
          />
          
          <ArrowRight className="hidden md:block h-6 w-6 text-muted-foreground" />
          <div className="md:hidden h-6 flex items-center justify-center">
            <ArrowRight className="h-6 w-6 text-muted-foreground transform rotate-90" />
          </div>
          
          <WorkflowStep 
            icon={<Filter className="h-8 w-8 text-indigo-500" />}
            title="Rule Matching"
            description="Jobs are matched against marketing rules"
          />
          
          <ArrowRight className="hidden md:block h-6 w-6 text-muted-foreground" />
          <div className="md:hidden h-6 flex items-center justify-center">
            <ArrowRight className="h-6 w-6 text-muted-foreground transform rotate-90" />
          </div>
          
          <WorkflowStep 
            icon={<MessageSquare className="h-8 w-8 text-purple-500" />}
            title="CTA Injection"
            description="Custom messages are added to job listings"
          />
          
          <ArrowRight className="hidden md:block h-6 w-6 text-muted-foreground" />
          <div className="md:hidden h-6 flex items-center justify-center">
            <ArrowRight className="h-6 w-6 text-muted-foreground transform rotate-90" />
          </div>
          
          <WorkflowStep 
            icon={<Share2 className="h-8 w-8 text-green-500" />}
            title="Distribution"
            description="Enhanced jobs are published to users"
          />
        </div>
      </CardContent>
    </Card>
  );
};

interface WorkflowStepProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const WorkflowStep: React.FC<WorkflowStepProps> = ({ icon, title, description }) => {
  return (
    <div className="flex flex-col items-center text-center max-w-[150px]">
      <div className="mb-2 p-3 bg-muted rounded-full">{icon}</div>
      <h3 className="font-medium text-sm">{title}</h3>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
};
