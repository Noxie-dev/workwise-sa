// client/src/components/marketing-rules/EditMarketingRuleForm.tsx
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MarketingRule } from '@/types/marketing-rules';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from 'lucide-react';

// Mock data for dropdowns
const MOCK_LOCATIONS = [
  'All Locations', 'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 
  'Free State', 'North West', 'Mpumalanga', 'Limpopo', 'Northern Cape',
  'Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein'
];

const MOCK_JOB_TYPES = [
  'All', 'General Worker', 'Construction Worker', 'Picker/Packer', 'Warehouse Assistant',
  'Cashier', 'Cleaner', 'Security Guard', 'Admin Clerk', 'Retail', 'Hospitality',
  'Manufacturing', 'IT/Technology', 'Healthcare', 'Education', 'Transport/Logistics'
];

const MOCK_DEMOGRAPHICS = [
  'Entry-level', 'No experience', 'Graduate', 'Junior', 'Matric', 'Certificate',
  'Diploma', 'Youth', 'Women', 'Disabled'
];

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

export const EditMarketingRuleForm: React.FC<EditMarketingRuleFormProps> = ({ 
    initialData, 
    isSaving, 
    onSave, 
    onCancel 
}) => {
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
            ctaLink: initialData?.ctaLink || 'https://www.workwisesa.co.za/',
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

    const handleRemoveTag = (tag: string) => {
        const newTags = currentTags.filter(t => t !== tag);
        setValue('demographicTags', newTags);
        // Also update the single string field if needed for compatibility
        setValue('targetDemographics', newTags.join(', '));
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
                            <Label htmlFor="status">
                                {watch('status') === 'Active' ? 'Active' : 'Inactive'}
                            </Label>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="targetLocation">Target Location</Label>
                            <Controller
                                name="targetLocation"
                                control={control}
                                render={({ field }) => (
                                    <Select 
                                        value={field.value} 
                                        onValueChange={field.onChange}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a location" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {MOCK_LOCATIONS.map(location => (
                                                <SelectItem key={location} value={location}>
                                                    {location}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.targetLocation && <p className="text-sm text-red-600 mt-1">{errors.targetLocation.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="targetJobType">Target Job Type</Label>
                            <Controller
                                name="targetJobType"
                                control={control}
                                render={({ field }) => (
                                    <Select 
                                        value={field.value} 
                                        onValueChange={field.onChange}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a job type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {MOCK_JOB_TYPES.map(jobType => (
                                                <SelectItem key={jobType} value={jobType}>
                                                    {jobType}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.targetJobType && <p className="text-sm text-red-600 mt-1">{errors.targetJobType.message}</p>}
                        </div>
                    </div>

                    <div>
                        <Label>Targeted Demographics (Optional)</Label>
                        <div className="flex flex-wrap gap-2 mt-2 mb-3">
                            {currentTags.map(tag => (
                                <Badge key={tag} variant="secondary" className="px-3 py-1">
                                    {tag}
                                    <X 
                                        className="ml-1 h-3 w-3 cursor-pointer" 
                                        onClick={() => handleRemoveTag(tag)}
                                    />
                                </Badge>
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {MOCK_DEMOGRAPHICS.filter(tag => !currentTags.includes(tag)).map(tag => (
                                <Button 
                                    key={tag} 
                                    type="button"
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleAddTag(tag)}
                                    className="mb-1"
                                >
                                    {tag}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="messageTemplate">Message Template</Label>
                        <Textarea 
                            id="messageTemplate" 
                            {...register('messageTemplate')} 
                            placeholder="e.g., Apply now for exclusive access to Gauteng tech jobs!"
                            className="min-h-[80px]"
                        />
                        {errors.messageTemplate && <p className="text-sm text-red-600 mt-1">{errors.messageTemplate.message}</p>}
                    </div>

                    <div>
                        <Label htmlFor="ctaLink">CTA Link</Label>
                        <Input 
                            id="ctaLink" 
                            {...register('ctaLink')} 
                            placeholder="https://www.workwisesa.co.za/jobs/tech-gauteng"
                        />
                        {errors.ctaLink && <p className="text-sm text-red-600 mt-1">{errors.ctaLink.message}</p>}
                    </div>

                    <div className="flex justify-end space-x-2 pt-2">
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? 'Saving...' : initialData ? 'Update Rule' : 'Create Rule'}
                        </Button>
                    </div>
                </CardContent>
            </form>
        </Card>
    );
};

export default EditMarketingRuleForm;
