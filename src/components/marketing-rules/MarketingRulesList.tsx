// src/components/marketing-rules/MarketingRulesList.tsx
import React from 'react';
import { MarketingRule } from '@/types/marketing-rules';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from 'lucide-react';
import { cn } from "@/lib/utils"; // Assuming you have this utility from shadcn

interface MarketingRulesListProps {
    rules: MarketingRule[];
    onEdit: (rule: MarketingRule) => void;
    onDelete: (ruleId: string) => void;
}

export const MarketingRulesList: React.FC<MarketingRulesListProps> = ({ rules, onEdit, onDelete }) => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Rule Name</TableHead>
                    <TableHead>Targeting</TableHead>
                    <TableHead>CTA Preview</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {rules.map((rule) => (
                    <TableRow key={rule.id}>
                        <TableCell className="font-medium">
                            {rule.ruleName}
                            <div className="text-xs text-muted-foreground">Created {rule.createdAt}</div>
                        </TableCell>
                        <TableCell>
                            <div className="text-sm">Location: {rule.targetLocation}</div>
                            <div className="text-sm">Job Type: {rule.targetJobType}</div>
                            {rule.targetDemographics && <div className="text-sm">Demographics: {rule.targetDemographics}</div>}
                        </TableCell>
                        <TableCell className="text-xs italic text-muted-foreground">{rule.ctaPreview}</TableCell>
                        <TableCell>
                            <Badge variant={rule.status === 'Active' ? 'default' : 'outline'}
                                   className={cn(rule.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800')}>
                                {rule.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => onEdit(rule)} className="mr-1 h-8 w-8">
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit Rule</span>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => onDelete(rule.id)} className="h-8 w-8 text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                                 <span className="sr-only">Delete Rule</span>
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};
