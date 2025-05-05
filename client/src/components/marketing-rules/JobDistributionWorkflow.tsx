// client/src/components/marketing-rules/JobDistributionWorkflow.tsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Filter, MessageSquare, Share2 } from 'lucide-react';

export const JobDistributionWorkflow: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <WorkflowCard
        icon={<Database className="h-6 w-6 text-blue-500" />}
        title="Job Intake"
        count="1,247"
        description="Jobs collected from various sources"
      />

      <WorkflowCard
        icon={<Filter className="h-6 w-6 text-indigo-500" />}
        title="Rules Applied"
        count="3"
        description="Active marketing rules"
      />

      <WorkflowCard
        icon={<MessageSquare className="h-6 w-6 text-purple-500" />}
        title="CTA Injection"
        count="4,721"
        description="Total CTA impressions"
      />

      <WorkflowCard
        icon={<Share2 className="h-6 w-6 text-green-500" />}
        title="Distribution"
        count="23.5%"
        description="Average click-through rate"
      />
    </div>
  );
};

interface WorkflowCardProps {
  icon: React.ReactNode;
  title: string;
  count: string;
  description: string;
}

const WorkflowCard: React.FC<WorkflowCardProps> = ({ icon, title, count, description }) => {
  return (
    <Card className="border-t-4 border-t-primary">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-sm text-muted-foreground">{title}</h3>
          <div className="p-2 bg-muted rounded-full">{icon}</div>
        </div>
        <div className="text-2xl font-bold mb-1">{count}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};

export default JobDistributionWorkflow;
