import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ChevronLeft, PlusCircle, XCircle } from "lucide-react";

// Form schema
const experienceSchema = z.object({
  hasExperience: z.boolean().default(false),
  currentlyEmployed: z.boolean().optional(),
  jobExperiences: z.array(
    z.object({
      companyName: z.string().min(1, "Company name is required"),
      jobTitle: z.string().min(1, "Job title is required"),
      startDate: z.string().min(1, "Start date is required"),
      endDate: z.string().optional(),
      description: z.string().optional(),
    })
  ).optional(),
  volunteerExperience: z.string().optional(),
  skills: z.string().optional(),
});

type ExperienceValues = z.infer<typeof experienceSchema>;

interface ExperienceStepProps {
  initialData: any;
  onSubmit: (data: ExperienceValues) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

const ExperienceStep: React.FC<ExperienceStepProps> = ({
  initialData,
  onSubmit,
  onBack,
  isSubmitting,
}) => {
  const [jobExperiences, setJobExperiences] = useState<any[]>(
    initialData?.jobExperiences || []
  );

  const form = useForm<ExperienceValues>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      ...initialData,
      hasExperience: initialData?.hasExperience || false,
      currentlyEmployed: initialData?.currentlyEmployed || false,
      jobExperiences: initialData?.jobExperiences || [],
      volunteerExperience: initialData?.volunteerExperience || "",
      skills: initialData?.skills || "",
    },
  });

  const hasExperience = form.watch("hasExperience");
  const currentlyEmployed = form.watch("currentlyEmployed");

  const addJobExperience = () => {
    setJobExperiences([
      ...jobExperiences,
      {
        companyName: "",
        jobTitle: "",
        startDate: "",
        endDate: "",
        description: "",
      },
    ]);
  };

  const removeJobExperience = (index: number) => {
    const updatedExperiences = [...jobExperiences];
    updatedExperiences.splice(index, 1);
    setJobExperiences(updatedExperiences);
  };

  const handleSubmit = (data: ExperienceValues) => {
    // Include job experiences in the form data
    const formData = {
      ...data,
      jobExperiences: hasExperience ? jobExperiences : [],
    };
    onSubmit(formData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="hasExperience"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isSubmitting}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>I have work experience</FormLabel>
                <FormDescription>
                  Check this box if you have any previous work experience
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        {hasExperience && (
          <>
            <FormField
              control={form.control}
              name="currentlyEmployed"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>I am currently employed</FormLabel>
                    <FormDescription>
                      Check this box if you are currently working
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Job Experience</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addJobExperience}
                  disabled={isSubmitting}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Job
                </Button>
              </div>

              {jobExperiences.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No job experiences added yet. Click "Add Job" to add your work history.
                </p>
              )}

              {jobExperiences.map((job, index) => (
                <Card key={index} className="relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => removeJobExperience(index)}
                    disabled={isSubmitting}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                  <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <FormLabel htmlFor={`companyName-${index}`}>Company Name*</FormLabel>
                      <Input
                        id={`companyName-${index}`}
                        value={job.companyName}
                        onChange={(e) => {
                          const updatedExperiences = [...jobExperiences];
                          updatedExperiences[index].companyName = e.target.value;
                          setJobExperiences(updatedExperiences);
                        }}
                        placeholder="Company name"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <FormLabel htmlFor={`jobTitle-${index}`}>Job Title*</FormLabel>
                      <Input
                        id={`jobTitle-${index}`}
                        value={job.jobTitle}
                        onChange={(e) => {
                          const updatedExperiences = [...jobExperiences];
                          updatedExperiences[index].jobTitle = e.target.value;
                          setJobExperiences(updatedExperiences);
                        }}
                        placeholder="Job title"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <FormLabel htmlFor={`startDate-${index}`}>Start Date*</FormLabel>
                      <Input
                        id={`startDate-${index}`}
                        type="date"
                        value={job.startDate}
                        onChange={(e) => {
                          const updatedExperiences = [...jobExperiences];
                          updatedExperiences[index].startDate = e.target.value;
                          setJobExperiences(updatedExperiences);
                        }}
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <FormLabel htmlFor={`endDate-${index}`}>
                        End Date {index === 0 && currentlyEmployed && "(Current)"}
                      </FormLabel>
                      <Input
                        id={`endDate-${index}`}
                        type="date"
                        value={index === 0 && currentlyEmployed ? "" : job.endDate}
                        onChange={(e) => {
                          const updatedExperiences = [...jobExperiences];
                          updatedExperiences[index].endDate = e.target.value;
                          setJobExperiences(updatedExperiences);
                        }}
                        disabled={index === 0 && currentlyEmployed ? true : isSubmitting}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <FormLabel htmlFor={`description-${index}`}>Job Description</FormLabel>
                      <Textarea
                        id={`description-${index}`}
                        value={job.description}
                        onChange={(e) => {
                          const updatedExperiences = [...jobExperiences];
                          updatedExperiences[index].description = e.target.value;
                          setJobExperiences(updatedExperiences);
                        }}
                        placeholder="Describe your responsibilities and achievements..."
                        className="resize-none"
                        disabled={isSubmitting}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        <FormField
          control={form.control}
          name="volunteerExperience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Volunteer Experience</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe any volunteer work or community service..."
                  className="resize-none"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                Optional: Include any volunteer experience you have
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Next Step
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ExperienceStep;
