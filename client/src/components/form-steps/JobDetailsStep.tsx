import React, { useState } from 'react';
import { MapPin, DollarSign, Calendar, Sparkles, Loader2, Info } from 'lucide-react';
import { marked } from 'marked';

import { JobFormValues } from '@/constants/formConstants';
import { fetchLocationSuggestions } from '@/services/jobService';

import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui';

interface JobDetailsStepProps {
  formState: any;
  handleAIAssist: (type: string) => void;
  categories: Array<{
    id: string;
    name: string;
    group: string;
  }>;
  isLoadingCategories: boolean;
}

export const JobDetailsStep: React.FC<JobDetailsStepProps> = ({ 
  formState, 
  handleAIAssist,
  categories,
  isLoadingCategories
}) => {
  const { values, errors, touched, handleChange, handleBlur } = formState;
  const [locationSuggestions, setLocationSuggestions] = useState<Array<{id: string; description: string}>>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);

  // Group categories by their group property
  const groupedCategories = React.useMemo(() => {
    const grouped: { [key: string]: typeof categories } = {};
    categories?.forEach(category => {
      if (!grouped[category.group]) {
        grouped[category.group] = [];
      }
      grouped[category.group].push(category);
    });
    return grouped;
  }, [categories]);

  const debouncedFetchLocations = async (input: string) => {
    if (!input || input.length < 2) {
      setLocationSuggestions([]);
      return;
    }
    
    setIsLoadingLocations(true);
    const results = await fetchLocationSuggestions(input);
    setLocationSuggestions(results);
    setIsLoadingLocations(false);
  };
  
  const canShowAIDialog = values.title?.trim() && values.category;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <FormField 
          id="job-title" 
          label="Job Title" 
          error={touched.title && errors.title}
          required
          hint="Be specific with your job title to attract the right candidates"
        >
          <div className="flex items-center gap-2">
            <Input
              id="job-title"
              type="text"
              value={values.title || ""}
              onChange={(e) => handleChange("title", e.target.value)}
              onBlur={() => handleBlur("title")}
              placeholder="e.g. Retail Sales Assistant"
              className="flex-1"
              aria-required="true"
            />
            
            {/* AI Generation Dialog */}
            {canShowAIDialog ? (
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-1.5"
                    type="button"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span className="hidden sm:inline">AI Assist</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogTitle>AI Job Description Assistant</DialogTitle>
                  <DialogDescription>
                    Let AI help you create a compelling job description based on the information you've provided.
                  </DialogDescription>
                  
                  <div className="grid gap-4 py-4">
                    <p>Position: <strong>{values.title}</strong></p>
                    <p>Category: <strong>{values.category}</strong></p>
                    
                    <Tabs defaultValue="basic">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="basic">Basic</TabsTrigger>
                        <TabsTrigger value="detailed">Detailed</TabsTrigger>
                        <TabsTrigger value="custom">Custom</TabsTrigger>
                      </TabsList>
                      <TabsContent value="basic" className="p-4 border rounded-md mt-2">
                        <p>Generate a simple job description with standard responsibilities and requirements.</p>
                      </TabsContent>
                      <TabsContent value="detailed" className="p-4 border rounded-md mt-2">
                        <p>Generate a comprehensive job description with detailed responsibilities, requirements, and company information.</p>
                      </TabsContent>
                      <TabsContent value="custom" className="p-4 border rounded-md mt-2">
                        <Input 
                          placeholder="Enter specific details you'd like included in the job description..."
                          className="min-h-[100px]"
                        />
                      </TabsContent>
                    </Tabs>
                  </div>
                  
                  <DialogFooter>
                    <Button type="button" onClick={() => handleAIAssist("description")}>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Description
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : (
              <Button 
                variant="outline" 
                className="flex items-center gap-1.5"
                disabled
                title="Please enter a job title and select a category first"
                type="button"
              >
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">AI Assist</span>
              </Button>
            )}
          </div>
        </FormField>
        
        <FormField 
          id="job-category" 
          label="Job Category" 
          error={touched.category && errors.category}
          required
        >
          <Select
            value={values.category || ""}
            onValueChange={(value) => handleChange("category", value)}
            onOpenChange={() => handleBlur("category")}
          >
            <SelectTrigger id="job-category" className="w-full">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {isLoadingCategories ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading categories...
                </div>
              ) : (
                Object.entries(groupedCategories).map(([group, cats]) => (
                  <div key={group} className="py-1">
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase">
                      {group.replace('_', ' ')}
                    </div>
                    {cats.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                    {group !== Object.keys(groupedCategories).pop() && (
                      <div className="my-1 border-t border-gray-100" />
                    )}
                  </div>
                ))
              )}
            </SelectContent>
          </Select>
        </FormField>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <FormField 
          id="job-type" 
          label="Job Type" 
          error={touched.jobType && errors.jobType}
          required
        >
          <Select
            value={values.jobType || ""}
            onValueChange={(value) => handleChange("jobType", value)}
            onOpenChange={() => handleBlur("jobType")}
          >
            <SelectTrigger id="job-type" className="w-full">
              <SelectValue placeholder="Select job type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full-time">Full-time</SelectItem>
              <SelectItem value="part-time">Part-time</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="temporary">Temporary</SelectItem>
              <SelectItem value="internship">Internship</SelectItem>
              <SelectItem value="volunteer">Volunteer</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        
        <FormField 
          id="job-location" 
          label="Location" 
          error={touched.location && errors.location}
          required={!values.isRemote}
        >
          <div className="space-y-2">
            <div className="relative">
              <Input
                id="job-location"
                type="text"
                value={values.location || ""}
                onChange={(e) => {
                  handleChange("location", e.target.value);
                  debouncedFetchLocations(e.target.value);
                }}
                onBlur={() => {
                  setTimeout(() => {
                    setLocationSuggestions([]);
                    handleBlur("location");
                  }, 200);
                }}
                placeholder="e.g. Cape Town, Western Cape"
                className="w-full"
                disabled={values.isRemote}
              />
              {isLoadingLocations && (
                <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-gray-400" />
              )}
              
              {locationSuggestions.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow-lg max-h-60 overflow-auto">
                  {locationSuggestions.map((suggestion) => (
                    <li
                      key={suggestion.id}
                      className="cursor-pointer px-3 py-2 hover:bg-gray-100"
                      onClick={() => {
                        handleChange("location", suggestion.description);
                        setLocationSuggestions([]);
                      }}
                    >
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                        {suggestion.description}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="remote-option" 
                checked={values.isRemote || false}
                onCheckedChange={(checked) => {
                  handleChange("isRemote", checked);
                  if (checked) {
                    handleChange("location", "");
                  }
                }}
              />
              <label
                htmlFor="remote-option"
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                This position is remote
              </label>
            </div>
          </div>
        </FormField>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <FormField 
            id="application-deadline" 
            label="Application Deadline" 
            error={touched.applicationDeadline && errors.applicationDeadline}
          >
            <div className="relative">
              <Input
                id="application-deadline"
                type="date"
                value={values.applicationDeadline || ""}
                onChange={(e) => handleChange("applicationDeadline", e.target.value)}
                onBlur={() => handleBlur("applicationDeadline")}
                className="w-full"
                min={new Date().toISOString().split('T')[0]} // Today or later
              />
              <Calendar className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </FormField>
        </div>
        
        <div className="space-y-4">
          <FormField 
            id="salary-range" 
            label="Salary Range" 
            error={(touched.salaryMin || touched.salaryMax) && (errors.salaryMin || errors.salaryMax)}
            hint="Including salary info increases application rates"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <Input
                  id="salary-min"
                  type="number" 
                  value={values.salaryMin || ""}
                  onChange={(e) => handleChange("salaryMin", e.target.value)}
                  onBlur={() => handleBlur("salaryMin")}
                  className="w-full pl-7"
                  placeholder="Min"
                  min="0"
                  step="500"
                />
                <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-gray-500">
                  R
                </span>
              </div>
              
              <div className="relative">
                <Input
                  id="salary-max"
                  type="number" 
                  value={values.salaryMax || ""}
                  onChange={(e) => handleChange("salaryMax", e.target.value)}
                  onBlur={() => handleBlur("salaryMax")}
                  className="w-full pl-7"
                  placeholder="Max"
                  min={values.salaryMin || "0"}
                  step="500"
                />
                <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-gray-500">
                  R
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 mt-2">
              <Checkbox 
                id="salary-negotiable" 
                checked={values.isSalaryNegotiable || false}
                onCheckedChange={(checked) => handleChange("isSalaryNegotiable", checked)}
              />
              <label
                htmlFor="salary-negotiable"
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Salary negotiable
              </label>
            </div>
          </FormField>
        </div>
      </div>
    </div>
  );
};

interface FormFieldProps {
  id: string;
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
  hint?: string;
}

const FormField: React.FC<FormFieldProps> = ({ id, label, children, error, required = false, hint }) => (
  <div className="space-y-1.5">
    <div className="flex items-center gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {hint && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-gray-400 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">{hint}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
    {children}
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

export default JobDetailsStep;
