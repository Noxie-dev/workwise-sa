import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MarketingRule } from '@/types/marketing-rules';
import marketingRuleService from '@/services/marketingRuleService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { MoreHorizontal, Plus, Search, Pencil, Trash } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MarketingRulesListProps {
  onSelectRule: (rule: MarketingRule) => void;
  onCreateRule: () => void;
  onEditRule: (rule: MarketingRule) => void;
}

const MarketingRulesList: React.FC<MarketingRulesListProps> = ({
  onSelectRule,
  onCreateRule,
  onEditRule,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [ruleToDelete, setRuleToDelete] = React.useState<string | null>(null);

  // Fetch marketing rules
  const { data: rules = [], isLoading, isError } = useQuery({
    queryKey: ['marketingRules'],
    queryFn: marketingRuleService.getRules,
  });

  // Toggle rule status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: marketingRuleService.toggleRuleStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketingRules'] });
      toast({
        title: 'Status updated',
        description: 'Rule status has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update rule status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  // Delete rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: marketingRuleService.deleteRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketingRules'] });
      toast({
        title: 'Rule deleted',
        description: 'Marketing rule has been deleted successfully.',
      });
      setRuleToDelete(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete rule: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  // Filter rules based on search query
  const filteredRules = React.useMemo(() => {
    if (!searchQuery.trim()) return rules;

    const query = searchQuery.toLowerCase();
    return rules.filter(rule =>
      rule.ruleName.toLowerCase().includes(query) ||
      rule.targetLocation.toLowerCase().includes(query) ||
      rule.targetJobType.toLowerCase().includes(query) ||
      rule.messageTemplate.toLowerCase().includes(query)
    );
  }, [rules, searchQuery]);

  // Handle toggle status
  const handleToggleStatus = (id: string) => {
    toggleStatusMutation.mutate(id);
  };

  // Handle delete rule
  const handleDeleteRule = () => {
    if (ruleToDelete) {
      deleteRuleMutation.mutate(ruleToDelete);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading marketing rules...</div>;
  }

  if (isError) {
    return (
      <div className="text-center py-8 text-destructive">
        Error loading marketing rules. Please try again.
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Marketing Rules List</CardTitle>
        <Button size="sm" onClick={onCreateRule} className="bg-green-600 hover:bg-green-700">
          <Plus className="mr-2 h-4 w-4" /> Create New Rule
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredRules.length === 0 ? (
            <div className="text-center py-12 border rounded-md bg-muted/20">
              {searchQuery ? 'No rules match your search' : 'No marketing rules found'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule Name</TableHead>
                  <TableHead>Targeting</TableHead>
                  <TableHead>CTA Preview</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRules.map((rule) => (
                  <TableRow
                    key={rule.id}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell className="font-medium">
                      {rule.ruleName}
                      <div className="text-xs text-muted-foreground">Created {rule.createdAt}</div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          Location: {rule.targetLocation}
                        </div>
                        <div className="text-sm">
                          Job Type: {rule.targetJobType}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      "{rule.ctaPreview || rule.messageTemplate}"
                    </TableCell>
                    <TableCell>
                      <Badge variant={rule.status === 'Active' ? 'default' : 'secondary'}>
                        {rule.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onEditRule(rule)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setRuleToDelete(rule.id!)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={!!ruleToDelete} onOpenChange={(open) => !open && setRuleToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the marketing rule.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteRule} className="bg-destructive text-destructive-foreground">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketingRulesList;
