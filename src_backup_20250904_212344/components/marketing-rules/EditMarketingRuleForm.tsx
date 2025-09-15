// src/components/marketing-rules/EditMarketingRuleForm.tsx
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MarketingRule } from '@/types/marketing-rules';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X } from 'lucide-react';

// Define Zod Schema for validation
const ruleSchema = z.object({
  ruleName: z.string().min(3, { message: "Rule name must be at least 3 characters." }),
  status: z.enum(['Active', 'Inactive']),
  targetLocation: z.string().min(1, { message: "Target location is required." }),
  targetJobType: z.string().min(1, { message: "Target job type is required." }),
  // Make demographics optional in schema, handle array logic separately if needed
  targetDemographics: z.string().optional(),
  demographicTags: z.array(z.string()).optional(), // For multi-select/tag input simulation
  messageTemplate: z.string().min(10, { message: "Message template must be at least 10 characters." }),
  ctaLink: z.string().url({ message: "Please enter a valid URL." }),
});

type RuleFormData = z.infer<typeof ruleSchema>;

interface EditMarketingRuleFormProps {
    initialData: MarketingRule | null;
    isSaving: boolean;
    onSave: (data: RuleFormData) => void;
    onCancel: () => void;
}

// Mock data - replace with fetched data if dynamic
const MOCK_LOCATIONS = ['All Locations', 'Gauteng', 'Cape Town', 'Durban', 'Pretoria', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State', 'North West', 'Mpumalanga', 'Limpopo', 'Northern Cape'];
const MOCK_JOB_TYPES = ['All', 'General Worker', 'Construction Worker', 'Picker/Packer', 'Warehouse Assistant', 'Cashier', 'Cleaner', 'Security Guard', 'Admin Clerk', 'Retail', 'Hospitality', 'IT/Technology'];
const MOCK_DEMOGRAPHICS = ['Entry-level', 'No experience', 'Graduate', 'Junior', 'Mid-level', 'Senior'];

export const EditMarketingRuleForm: React.FC<EditMarketingRuleFormProps> = ({ initialData, isSaving, onSave, onCancel }) => {
    const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<RuleFormData>({
        resolver: zodResolver(ruleSchema),
        defaultValues: {
            ruleName: initialData?.ruleName || '',
            status: initialData?.status || 'Active',
            targetLocation: initialData?.targetLocation || 'All Locations',
            targetJobType: initialData?.targetJobType || 'All',
            targetDemographics: initialData?.targetDemographics || '', // Single string for now
            demographicTags: initialData?.demographicTags || [], // Array for multi-select simulation
            messageTemplate: initialData?.messageTemplate || '',
            ctaLink: initialData?.ctaLink || '',
        },
    });

    const onSubmit = (data: RuleFormData) => {
        // Map demographicTags back to single string if needed by backend, or keep as array
        const dataToSave = { ...data, targetDemographics: data.demographicTags?.join(', ') }; // Example mapping
        onSave(dataToSave);
    };

    // Watch tags for display
    const currentTags = watch('demographicTags') || [];

    // Simulate adding/removing tags (replace with a proper TagInput component if available)
    const handleAddTag = (tag: string) => {
        if (!currentTags.includes(tag)) {
            setValue('demographicTags', [...currentTags, tag]);
             // Also update the single string field if needed for compatibility
             setValue('targetDemographics', [...currentTags, tag].join(', '));
        }
    };
    const handleRemoveTag = (tagToRemove: string) => {
        const updatedTags = currentTags.filter(tag => tag !== tagToRemove);
         setValue('demographicTags', updatedTags);
         setValue('targetDemographics', updatedTags.join(', '));
    };


    return (
        <Card>
            <CardHeader>
                <CardTitle>{initialData ? 'Edit Marketing Rule' : 'Create New Marketing Rule'}</CardTitle>
                 <CardDescription>Define targeting criteria and the call-to-action message.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <Label htmlFor="ruleName">Rule Name</Label>
                            <Input id="ruleName" {...register('ruleName')} placeholder="e.g., Gauteng Tech Roles" />
                            {errors.ruleName && <p className="text-sm text-red-600 mt-1">{errors.ruleName.message}</p>}
                        </div>
                        <div className="flex items-center space-x-2 pt-6">
                             <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <Switch
                                        id="status"
                                        checked={field.value === 'Active'}
                                        onCheckedChange={(checked) => field.onChange(checked ? 'Active' : 'Inactive')}
                                    />
                                )}
                            />
                            <Label htmlFor="status">Status: {watch('status')}</Label>
                         </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <Label htmlFor="targetLocation">Targeted Location</Label>
                             <Controller
                                name="targetLocation"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger id="targetLocation">
                                            <SelectValue placeholder="Select location" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {MOCK_LOCATIONS.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                             {errors.targetLocation && <p className="text-sm text-red-600 mt-1">{errors.targetLocation.message}</p>}
                        </div>
                         <div>
                            <Label htmlFor="targetJobType">Targeted Job Type</Label>
                              <Controller
                                name="targetJobType"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger id="targetJobType">
                                            <SelectValue placeholder="Select job type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {MOCK_JOB_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                             {errors.targetJobType && <p className="text-sm text-red-600 mt-1">{errors.targetJobType.message}</p>}
                        </div>
                    </div>

                    <div>
                         <Label>Targeted Demographics (Optional)</Label>
                         <div className="flex flex-wrap gap-2 mt-1 mb-2">
                              {/* Simulate Tag Input */}
                             {MOCK_DEMOGRAPHICS.map(demo => (
                                 <Button
                                     key={demo}
                                     type="button"
                                     variant={currentTags.includes(demo) ? "default" : "outline"}
                                     size="sm"
                                     onClick={() => currentTags.includes(demo) ? handleRemoveTag(demo) : handleAddTag(demo)}
                                     className="h-7 px-2 py-1 text-xs"
                                 >
                                     {demo}
                                      {currentTags.includes(demo) && <X className="ml-1 h-3 w-3"/>}
                                 </Button>
                             ))}
                         </div>
                           {/* Hidden input to store the array */}
                           <input type="hidden" {...register('demographicTags')} />
                         {/* Optional: Display selected tags clearly */}
                         {/* <div className="flex flex-wrap gap-1 mt-1">
                            {currentTags.map(tag => (
                                <Badge key={tag} variant="secondary">
                                    {tag}
                                    <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-1 appearance-none border-none bg-transparent cursor-pointer"><X className="h-3 w-3"/></button>
                                </Badge>
                            ))}
                         </div> */}
                    </div>

                    <div>
                        <Label htmlFor="messageTemplate">Message Template (CTA)</Label>
                        <Textarea
                            id="messageTemplate"
                            {...register('messageTemplate')}
                            placeholder="e.g., Apply now for exclusive access!"
                            rows={3}
                        />
                        <p className="text-xs text-muted-foreground mt-1">This message will replace contact information in job listings.</p>
                         {errors.messageTemplate && <p className="text-sm text-red-600 mt-1">{errors.messageTemplate.message}</p>}
                    </div>

                     <div>
                        <Label htmlFor="ctaLink">CTA Link</Label>
                        <Input
                            id="ctaLink"
                            {...register('ctaLink')}
                            type="url"
                            placeholder="https://www.yourwebsite.com/apply-here"
                        />
                         {errors.ctaLink && <p className="text-sm text-red-600 mt-1">{errors.ctaLink.message}</p>}
                    </div>

                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                     <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>Cancel</Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
};
