import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MarketingRule, JobListingExample } from '@/types/marketing-rules';
import marketingRuleService from '@/services/marketingRuleService';
import MarketingRulesList from '@/components/marketing-rules/MarketingRulesList';
import MarketingRuleForm from '@/components/marketing-rules/MarketingRuleForm';
import MarketingRulePreview from '@/components/marketing-rules/MarketingRulePreview';
import MarketingRulePerformanceAnalytics from '@/components/marketing-rules/MarketingRulePerformanceAnalytics';
import JobDistributionWorkflow from '@/components/marketing-rules/JobDistributionWorkflow';
import AdminLayout from '@/components/marketing-rules/AdminLayout';

const MarketingRulesPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('rules');
  const [selectedRule, setSelectedRule] = useState<MarketingRule | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Fetch a job example for preview
  const { data: originalJobExample, isLoading: isLoadingJobExample } = useQuery({
    queryKey: ['jobExample', selectedRule?.id],
    queryFn: () => {
      // Sample job listing data for preview
      const sampleJob: JobListingExample = {
        title: "Junior Software Developer",
        company: "TechInnovate Solutions",
        location: "Johannesburg, Gauteng",
        jobType: "IT/Technology",
        description: "Entry-level position for a passionate developer. Knowledge of HTML, CSS, and JavaScript preferred. Opportunity to learn and grow in a supportive environment.",
        contactInfo: {
          email: "recruitment@techinnovate.co.za",
          phone: "011-555-9876",
          applyInstructions: "Send CV to jobs@techinnovate.co.za by August 15th"
        }
      };
      return Promise.resolve(sampleJob);
    },
    enabled: !!selectedRule,
  });

  // Save rule mutation (handles both create and update)
  const mutationSave = useMutation({
    mutationFn: (ruleData: Omit<MarketingRule, 'id' | 'createdAt' | 'ctaPreview'> | MarketingRule) => {
      if ('id' in ruleData) {
        // Update existing rule
        return marketingRuleService.updateRule(ruleData.id, ruleData);
      } else {
        // Create new rule
        return marketingRuleService.createRule(ruleData);
      }
    },
    onSuccess: (savedRule) => {
      queryClient.invalidateQueries({ queryKey: ['marketingRules'] });
      toast({
        title: 'Success',
        description: `Marketing rule ${selectedRule ? 'updated' : 'created'} successfully.`,
      });
      setSelectedRule(savedRule);
      setIsCreatingNew(false);
      setActiveTab('rules');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to save rule: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  // Delete rule mutation
  const mutationDelete = useMutation({
    mutationFn: marketingRuleService.deleteRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketingRules'] });
      toast({
        title: 'Rule deleted',
        description: 'Marketing rule has been deleted successfully.',
      });
      setSelectedRule(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete rule: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  // Handle rule selection
  const handleSelectRule = (rule: MarketingRule) => {
    setSelectedRule(rule);
    setIsCreatingNew(false);
  };

  // Handle edit rule
  const handleEdit = (rule: MarketingRule) => {
    setSelectedRule(rule);
    setIsCreatingNew(false);
    document.getElementById('edit-rule-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle delete rule
  const handleDelete = (ruleId: string) => {
    if (window.confirm("Are you sure you want to delete this rule?")) {
      mutationDelete.mutate(ruleId);
    }
  };

  // Handle create new rule
  const handleCreateNew = () => {
    setSelectedRule(null); // Clear selection
    setIsCreatingNew(true);
    document.getElementById('edit-rule-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle save rule
  const handleSave = (formData: Omit<MarketingRule, 'id' | 'createdAt' | 'ctaPreview'>) => {
     const ruleToSave = selectedRule ? { ...selectedRule, ...formData } : formData;
     mutationSave.mutate(ruleToSave);
  };

  // Handle close editor
  const closeEditor = () => {
    setSelectedRule(null);
    setIsCreatingNew(false);
  };

  const showEditor = selectedRule || isCreatingNew;

  return (
    <AdminLayout>
      <Helmet>
        <title>Marketing Rules Manager | WorkWise SA</title>
        <meta name="description" content="Manage marketing rules for job listings on WorkWise SA" />
      </Helmet>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Marketing Rules Manager</h1>
        <p className="text-muted-foreground mt-2">
          Create and manage rules to add call-to-action messages to job listings for specific locations and job types.
        </p>
      </div>

      {/* Workflow Diagram */}
      <JobDistributionWorkflow />

      {/* Main Content */}
      <div className="space-y-6">
        <MarketingRulesList
          onSelectRule={handleSelectRule}
          onCreateRule={handleCreateNew}
          onEditRule={handleEdit}
        />

        {/* --- Editor/Preview Section (Conditionally Rendered) --- */}
        {showEditor && (
          <div id="edit-rule-section" className="space-y-6">
            <MarketingRuleForm
              initialData={selectedRule || undefined}
              onSubmit={handleSave}
              onCancel={closeEditor}
            />
            <MarketingRulePreview
              selectedRule={selectedRule}
            />
          </div>
        )}

        {/* Analytics Section */}
        <MarketingRulePerformanceAnalytics />
      </div>
    </AdminLayout>
  );
};

export default MarketingRulesPage;
