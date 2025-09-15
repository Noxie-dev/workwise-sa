// src/pages/MarketingRulesPage.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MarketingRule, MarketingRuleStats, MarketingRuleAnalyticsData, JobListingExample } from '@/types/marketing-rules';
import { fetchMarketingRules, saveMarketingRule, deleteMarketingRule, fetchMarketingRuleStats, fetchMarketingRuleAnalytics, fetchOriginalJobExample } from '@/services/marketingRuleService';

// Import shadcn/ui components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast"; // Assuming you have toast setup

// Import Custom Sub-components
import { JobDistributionWorkflow } from '@/components/marketing-rules/JobDistributionWorkflow';
import { MarketingRulesList } from '@/components/marketing-rules/MarketingRulesList';
import { EditMarketingRuleForm } from '@/components/marketing-rules/EditMarketingRuleForm';
import { MarketingRulePreview } from '@/components/marketing-rules/MarketingRulePreview';
import { MarketingRulePerformanceAnalytics } from '@/components/marketing-rules/MarketingRulePerformanceAnalytics';

// Import Icons
import { PlusCircle, FileCog, Trash2, BarChart2, CalendarDays } from 'lucide-react';

const MarketingRulesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedRule, setSelectedRule] = useState<MarketingRule | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [analyticsPeriod, setAnalyticsPeriod] = useState('Last 7 Days');

  // --- Data Fetching using React Query ---
  const { data: rules, isLoading: isLoadingRules, error: rulesError } = useQuery<MarketingRule[], Error>({
      queryKey: ['marketingRules'],
      queryFn: fetchMarketingRules,
  });

  const { data: stats, isLoading: isLoadingStats } = useQuery<MarketingRuleStats, Error>({
      queryKey: ['marketingRuleStats'],
      queryFn: fetchMarketingRuleStats,
  });

   const { data: analyticsData, isLoading: isLoadingAnalytics } = useQuery<MarketingRuleAnalyticsData, Error>({
      queryKey: ['marketingRuleAnalytics', analyticsPeriod],
      queryFn: () => fetchMarketingRuleAnalytics(analyticsPeriod),
      keepPreviousData: true, // Keep showing old data while new period loads
  });

  const { data: originalJobExample, isLoading: isLoadingJobExample } = useQuery<JobListingExample, Error>({
      // Fetch an example relevant to the selected rule or a default one
      queryKey: ['originalJobExample', selectedRule?.id ?? 'default'],
      queryFn: () => fetchOriginalJobExample(selectedRule ?? undefined),
  });

  // --- Mutations ---
  const mutationSave = useMutation({
      mutationFn: saveMarketingRule,
      onSuccess: (savedRule) => {
          queryClient.invalidateQueries({ queryKey: ['marketingRules'] });
          queryClient.invalidateQueries({ queryKey: ['marketingRuleStats'] });
          toast({ title: "Success", description: `Rule "${savedRule.ruleName}" saved.` });
          closeEditor();
      },
      onError: (error: Error) => {
          toast({ title: "Error", description: `Failed to save rule: ${error.message}`, variant: "destructive" });
      },
  });

  const mutationDelete = useMutation({
      mutationFn: deleteMarketingRule,
      onSuccess: (_, ruleId) => {
          queryClient.invalidateQueries({ queryKey: ['marketingRules'] });
          queryClient.invalidateQueries({ queryKey: ['marketingRuleStats'] });
          toast({ title: "Success", description: `Rule deleted.` });
          if (selectedRule?.id === ruleId) {
             closeEditor();
          }
      },
      onError: (error: Error) => {
          toast({ title: "Error", description: `Failed to delete rule: ${error.message}`, variant: "destructive" });
      },
  });

  // --- Event Handlers ---
  const handleEdit = (rule: MarketingRule) => {
    setSelectedRule(rule);
    setIsCreatingNew(false);
    // Scroll to editor/preview section if needed
    document.getElementById('edit-rule-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDelete = (ruleId: string) => {
    if (window.confirm("Are you sure you want to delete this rule?")) {
      mutationDelete.mutate(ruleId);
    }
  };

  const handleCreateNew = () => {
    setSelectedRule(null); // Clear selection
    setIsCreatingNew(true);
    document.getElementById('edit-rule-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSave = (formData: Omit<MarketingRule, 'id' | 'createdAt' | 'ctaPreview'>) => {
     const ruleToSave = selectedRule ? { ...selectedRule, ...formData } : formData;
     mutationSave.mutate(ruleToSave);
  };

  const closeEditor = () => {
    setSelectedRule(null);
    setIsCreatingNew(false);
  };

  const showEditor = selectedRule || isCreatingNew;

  // --- Rendering ---
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Marketing Rules Manager</h1>

      <JobDistributionWorkflow />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
           <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                 <CardTitle className="text-lg font-medium">Marketing Rules List</CardTitle>
                 <Button size="sm" onClick={handleCreateNew}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Create New Rule
                 </Button>
              </CardHeader>
              <CardContent>
                {isLoadingRules && <Skeleton className="h-40 w-full" />}
                {rulesError && <p className="text-red-600">Error loading rules: {rulesError.message}</p>}
                {!isLoadingRules && !rulesError && rules && (
                    <MarketingRulesList
                        rules={rules}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                )}
                 {!isLoadingRules && !rulesError && rules?.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No marketing rules found. Create one to get started!</p>
                )}
              </CardContent>
           </Card>
        </div>
        <div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Marketing Rules Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoadingStats && <Skeleton className="h-24 w-full" />}
              {!isLoadingStats && stats && (
                <>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Active Rules</span>
                      <span>{stats.activeRules}</span>
                    </div>
                    <Progress value={(stats.activeRules / (stats.activeRules + stats.inactiveRules)) * 100} className="h-2" />
                  </div>
                   <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Inactive Rules</span>
                      <span>{stats.inactiveRules}</span>
                    </div>
                    <Progress value={(stats.inactiveRules / (stats.activeRules + stats.inactiveRules)) * 100} className="h-2 bg-gray-300" />
                  </div>
                   <div className="flex justify-between text-sm pt-2 border-t mt-2">
                      <span>Jobs Processed</span>
                      <span className="font-semibold">{stats.jobsProcessed.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Overall CTA Click Rate</span>
                      <span className="font-semibold">{stats.ctaClickRate.toFixed(1)}%</span>
                    </div>
                </>
              )}
              {!isLoadingStats && !stats && !isLoadingRules && <p className="text-muted-foreground text-sm">No stats available.</p>}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* --- Editor/Preview/Analytics Section (Conditionally Rendered) --- */}
      {showEditor && (
          <div id="edit-rule-section" className="space-y-6 pt-6 border-t">
              <EditMarketingRuleForm
                  key={selectedRule?.id ?? 'new'} // Force re-render form when selection changes
                  initialData={selectedRule}
                  isSaving={mutationSave.isPending}
                  onSave={handleSave}
                  onCancel={closeEditor}
              />
              <MarketingRulePreview
                  // Pass form data if editing, or selected rule if viewing existing
                  // Need to get live form data for instant preview - requires lifting state or using form context
                  ruleBeingEdited={selectedRule} // Simplified: Use selected rule for preview structure
                  originalJob={originalJobExample}
                  isLoadingJob={isLoadingJobExample}
              />
          </div>
      )}

      {/* --- Analytics Section --- */}
       <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium flex items-center">
                <BarChart2 className="mr-2 h-5 w-5 text-muted-foreground" />
                Marketing Rule Performance Analytics
              </CardTitle>
               <Select value={analyticsPeriod} onValueChange={setAnalyticsPeriod}>
                  <SelectTrigger className="w-[180px] h-8 text-xs">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Last 7 Days">Last 7 Days</SelectItem>
                    <SelectItem value="Last 30 Days">Last 30 Days</SelectItem>
                    <SelectItem value="Last 90 Days">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>
          </CardHeader>
          <CardContent>
            {isLoadingAnalytics && <Skeleton className="h-64 w-full" />}
            {!isLoadingAnalytics && analyticsData && (
                <MarketingRulePerformanceAnalytics data={analyticsData} />
            )}
             {!isLoadingAnalytics && !analyticsData && (
                <p className="text-center text-muted-foreground py-4">No analytics data available for this period.</p>
            )}
          </CardContent>
       </Card>

    </div>
  );
};

export default MarketingRulesPage;
