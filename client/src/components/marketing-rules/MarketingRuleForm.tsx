import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MarketingRuleSchema } from '@/services/marketingRuleService';
import { MarketingRule } from '@/types/marketing-rules';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MarketingRuleFormProps {
  initialData?: MarketingRule;
  onSubmit: (data: MarketingRule) => void;
  onCancel: () => void;
}

const MarketingRuleForm: React.FC<MarketingRuleFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const [demographics, setDemographics] = React.useState<string[]>(
    initialData?.demographicTags || []
  );
  const [newDemographic, setNewDemographic] = React.useState('');

  const form = useForm<MarketingRule>({
    resolver: zodResolver(MarketingRuleSchema),
    defaultValues: initialData || {
      ruleName: '',
      status: 'Inactive',
      targetLocation: 'All',
      targetJobType: 'All',
      targetDemographics: '',
      demographicTags: [],
      messageTemplate: '',
      ctaLink: 'https://www.workwisesa.co.za/',
      ctaPreview: '',
      createdAt: new Date().toISOString(),
    },
  });

  const addDemographic = () => {
    if (newDemographic.trim() && !demographics.includes(newDemographic.trim())) {
      const updatedDemographics = [...demographics, newDemographic.trim()];
      setDemographics(updatedDemographics);
      form.setValue('demographicTags', updatedDemographics);
      form.setValue('targetDemographics', updatedDemographics.join(', '));
      setNewDemographic('');
    }
  };

  const removeDemographic = (item: string) => {
    const updatedDemographics = demographics.filter(d => d !== item);
    setDemographics(updatedDemographics);
    form.setValue('demographicTags', updatedDemographics);
    form.setValue('targetDemographics', updatedDemographics.join(', '));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addDemographic();
    }
  };

  const handleSubmit = (data: MarketingRule) => {
    // Ensure demographics are included in the submission
    const formData = {
      ...data,
      demographicTags: demographics,
      targetDemographics: demographics.join(', '),
      // Set ctaPreview to messageTemplate if not provided
      ctaPreview: data.messageTemplate,
    };
    onSubmit(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? 'Edit Marketing Rule' : 'Create New Marketing Rule'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Rule Name */}
              <FormField
                control={form.control}
                name="ruleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rule Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter rule name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active Status</FormLabel>
                      <FormDescription>
                        Enable or disable this marketing rule
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value === 'Active'}
                        onCheckedChange={(checked) => {
                          field.onChange(checked ? 'Active' : 'Inactive');
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Tabs defaultValue="targeting">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="targeting">Targeting</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>

              <TabsContent value="targeting" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Targeted Location */}
                  <FormField
                    control={form.control}
                    name="targetLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Targeted Location</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="All">All Locations</SelectItem>
                            <SelectItem value="Gauteng">Gauteng</SelectItem>
                            <SelectItem value="Western Cape">Western Cape</SelectItem>
                            <SelectItem value="Cape Town">Cape Town</SelectItem>
                            <SelectItem value="Durban">Durban</SelectItem>
                            <SelectItem value="Johannesburg">Johannesburg</SelectItem>
                            <SelectItem value="Pretoria">Pretoria</SelectItem>
                            <SelectItem value="Eastern Cape">Eastern Cape</SelectItem>
                            <SelectItem value="Free State">Free State</SelectItem>
                            <SelectItem value="KwaZulu-Natal">KwaZulu-Natal</SelectItem>
                            <SelectItem value="Limpopo">Limpopo</SelectItem>
                            <SelectItem value="Mpumalanga">Mpumalanga</SelectItem>
                            <SelectItem value="North West">North West</SelectItem>
                            <SelectItem value="Northern Cape">Northern Cape</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Targeted Job Type */}
                  <FormField
                    control={form.control}
                    name="targetJobType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Targeted Job Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select job type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="All">All Job Types</SelectItem>
                            <SelectItem value="General Worker">General Worker</SelectItem>
                            <SelectItem value="Construction Worker">Construction Worker</SelectItem>
                            <SelectItem value="Picker/Packer">Picker/Packer</SelectItem>
                            <SelectItem value="Warehouse Assistant">Warehouse Assistant</SelectItem>
                            <SelectItem value="Cashier">Cashier</SelectItem>
                            <SelectItem value="Cleaner">Cleaner</SelectItem>
                            <SelectItem value="Security">Security Guard</SelectItem>
                            <SelectItem value="Admin Clerk">Admin Clerk</SelectItem>
                            <SelectItem value="Retail">Retail</SelectItem>
                            <SelectItem value="IT/Technology">IT/Technology</SelectItem>
                            <SelectItem value="Healthcare">Healthcare</SelectItem>
                            <SelectItem value="Hospitality">Hospitality</SelectItem>
                            <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Targeted Demographics */}
                <FormItem>
                  <FormLabel>Targeted Demographics (Optional)</FormLabel>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {demographics.map((item, index) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1">
                        {item}
                        <button
                          type="button"
                          onClick={() => removeDemographic(item)}
                          className="ml-2 text-muted-foreground hover:text-foreground"
                        >
                          <X size={14} />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add demographic (e.g., Entry-level, Graduate)"
                      value={newDemographic}
                      onChange={(e) => setNewDemographic(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" onClick={addDemographic}>
                      Add
                    </Button>
                  </div>
                  <FormDescription>
                    Enter demographics to target specific groups (press Enter or click Add)
                  </FormDescription>
                </FormItem>
              </TabsContent>

              <TabsContent value="content" className="space-y-4 pt-4">
                {/* Message Template */}
                <FormField
                  control={form.control}
                  name="messageTemplate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message Template (CTA)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter call-to-action message"
                          className="resize-none min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        This message will replace contact information in job listings
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* CTA Link */}
                <FormField
                  control={form.control}
                  name="ctaLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CTA Link</FormLabel>
                      <FormControl>
                        <Input placeholder="https://www.workwisesa.co.za/" {...field} />
                      </FormControl>
                      <FormDescription>
                        The URL where users will be directed when clicking the CTA
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4 pt-4">
                <div className="text-center py-8 text-muted-foreground">
                  Advanced settings coming soon
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-4 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                {initialData ? 'Update Rule' : 'Create Rule'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default MarketingRuleForm;
