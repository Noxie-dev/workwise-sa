# Job Posting System Enhancement

## Current Issues
1. Form validation needs improvement
2. Missing file upload for job requirements
3. No draft saving functionality
4. Limited job preview capabilities

## Enhanced Job Posting Form

### 1. Improved Validation Schema
```typescript
// client/src/schemas/jobPostingSchema.ts
import { z } from 'zod';

export const jobPostingSchema = z.object({
  // Basic Information
  title: z.string()
    .min(10, 'Job title must be at least 10 characters')
    .max(100, 'Job title cannot exceed 100 characters'),
  
  company: z.object({
    name: z.string().min(2, 'Company name is required'),
    logo: z.string().url().optional(),
    website: z.string().url().optional(),
    description: z.string().min(50, 'Company description must be at least 50 characters'),
  }),
  
  // Job Details
  description: z.string()
    .min(100, 'Job description must be at least 100 characters')
    .max(5000, 'Job description cannot exceed 5000 characters'),
  
  requirements: z.array(z.string().min(5)).min(3, 'At least 3 requirements are needed'),
  responsibilities: z.array(z.string().min(5)).min(3, 'At least 3 responsibilities are needed'),
  
  // Location & Remote
  location: z.object({
    city: z.string().min(2, 'City is required'),
    province: z.string().min(2, 'Province is required'),
    country: z.string().default('South Africa'),
    isRemote: z.boolean().default(false),
    isHybrid: z.boolean().default(false),
  }),
  
  // Employment Details
  employmentType: z.enum(['full-time', 'part-time', 'contract', 'internship', 'temporary']),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']),
  
  // Compensation
  salary: z.object({
    min: z.number().min(1000, 'Minimum salary must be at least R1,000'),
    max: z.number().min(1000, 'Maximum salary must be at least R1,000'),
    currency: z.string().default('ZAR'),
    period: z.enum(['hour', 'day', 'month', 'year']),
    negotiable: z.boolean().default(false),
  }).refine(data => data.max >= data.min, {
    message: 'Maximum salary must be greater than minimum salary',
    path: ['max'],
  }),
  
  // Application Details
  applicationDeadline: z.date().min(new Date(), 'Deadline must be in the future'),
  applicationEmail: z.string().email('Valid email is required'),
  applicationUrl: z.string().url().optional(),
  
  // Skills & Categories
  skills: z.array(z.string()).min(3, 'At least 3 skills are required'),
  category: z.string().min(1, 'Category is required'),
  
  // Additional
  benefits: z.array(z.string()).optional(),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    type: z.string(),
  })).optional(),
  
  // Meta
  featured: z.boolean().default(false),
  urgent: z.boolean().default(false),
  status: z.enum(['draft', 'published', 'closed']).default('draft'),
});

export type JobPostingFormData = z.infer<typeof jobPostingSchema>;
```

### 2. Enhanced Form Components
```typescript
// client/src/components/job-posting/JobPostingForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { jobPostingSchema } from '@/schemas/jobPostingSchema';

export const JobPostingForm = () => {
  const form = useForm<JobPostingFormData>({
    resolver: zodResolver(jobPostingSchema),
    mode: 'onChange',
    defaultValues: {
      status: 'draft',
      location: { country: 'South Africa' },
      salary: { currency: 'ZAR', period: 'month' },
    },
  });
  
  // Auto-save as draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (form.formState.isDirty) {
        saveDraft(form.getValues());
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [form.formState.isDirty]);
  
  return (
    <Form {...form}>
      <div className="space-y-8">
        <JobBasicInfoStep />
        <CompanyInfoStep />
        <JobDescriptionStep />
        <RequirementsStep />
        <LocationStep />
        <SalaryStep />
        <ApplicationStep />
        <SkillsStep />
        <PreviewStep />
      </div>
    </Form>
  );
};
```

### 3. Step Components with Enhanced Validation
```typescript
// client/src/components/job-posting/steps/JobDescriptionStep.tsx
export const JobDescriptionStep = () => {
  const { control, watch } = useFormContext<JobPostingFormData>();
  const description = watch('description');
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Description</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Provide a detailed description of the role..."
                  className="min-h-[200px]"
                />
              </FormControl>
              <FormDescription>
                Characters: {description?.length || 0}/5000
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name="responsibilities"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Key Responsibilities</FormLabel>
              <FormControl>
                <DynamicListInput
                  value={field.value || []}
                  onChange={field.onChange}
                  placeholder="Add a responsibility..."
                  minItems={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name="requirements"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Requirements</FormLabel>
              <FormControl>
                <DynamicListInput
                  value={field.value || []}
                  onChange={field.onChange}
                  placeholder="Add a requirement..."
                  minItems={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};
```

### 4. File Upload Component
```typescript
// client/src/components/job-posting/FileUploadZone.tsx
export const FileUploadZone = ({ onUpload, acceptedTypes, maxSize = 5 }) => {
  const [isDragging, setIsDragging] = useState(false);
  
  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer?.files || []);
    files.forEach(file => {
      if (file.size > maxSize * 1024 * 1024) {
        toast({ title: 'File too large', description: `${file.name} exceeds ${maxSize}MB limit` });
        return;
      }
      
      uploadFile(file).then(url => {
        onUpload({ name: file.name, url, type: file.type });
      });
    });
  }, [onUpload, maxSize]);
  
  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
        isDragging ? "border-primary bg-primary/5" : "border-gray-300"
      )}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={() => setIsDragging(true)}
      onDragLeave={() => setIsDragging(false)}
    >
      <Upload className="mx-auto h-12 w-12 text-gray-400" />
      <p className="mt-2 text-sm text-gray-600">
        Drag and drop files here, or click to select
      </p>
      <p className="text-xs text-gray-500">
        {acceptedTypes.join(', ')} up to {maxSize}MB
      </p>
    </div>
  );
};
```

## Implementation Timeline
- **Days 1-3**: Enhanced validation schema and form structure
- **Days 4-6**: Step components with improved UX
- **Days 7-9**: File upload and draft saving
- **Days 10-11**: Testing and refinement
