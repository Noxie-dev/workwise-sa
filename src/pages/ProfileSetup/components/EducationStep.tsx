import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ChevronLeft } from "lucide-react";

// Form schema
const educationSchema = z.object({
  highestEducation: z.string().min(1, "Please select your highest education level"),
  schoolName: z.string().min(2, "Please enter your school name"),
  yearCompleted: z.string().optional(),
  achievements: z.string().optional(),
  additionalCourses: z.string().optional(),
});

type EducationValues = z.infer<typeof educationSchema>;

interface EducationStepProps {
  initialData: any;
  onSubmit: (data: EducationValues) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

const EducationStep: React.FC<EducationStepProps> = ({
  initialData,
  onSubmit,
  onBack,
  isSubmitting,
}) => {
  const form = useForm<EducationValues>({
    resolver: zodResolver(educationSchema),
    defaultValues: initialData || {
      highestEducation: "",
      schoolName: "",
      yearCompleted: "",
      achievements: "",
      additionalCourses: "",
    },
  });

  // Generate years for the dropdown (from current year back to 1970)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1969 }, (_, i) => (currentYear - i).toString());

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="highestEducation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Highest Education Level*</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select education level" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="primary">Primary School</SelectItem>
                  <SelectItem value="secondary">Secondary School / High School</SelectItem>
                  <SelectItem value="matric">Matric / Grade 12</SelectItem>
                  <SelectItem value="certificate">Certificate</SelectItem>
                  <SelectItem value="diploma">Diploma</SelectItem>
                  <SelectItem value="degree">Bachelor's Degree</SelectItem>
                  <SelectItem value="honours">Honours Degree</SelectItem>
                  <SelectItem value="masters">Master's Degree</SelectItem>
                  <SelectItem value="doctorate">Doctorate / PhD</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="schoolName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>School/Institution Name*</FormLabel>
              <FormControl>
                <Input placeholder="Enter school or institution name" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="yearCompleted"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Year Completed</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="in-progress">Still Studying</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="achievements"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Achievements</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="List any academic achievements, awards, or distinctions..."
                  className="resize-none"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                Optional: Include any notable achievements from your education
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="additionalCourses"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Courses</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="List any additional courses, certifications, or training..."
                  className="resize-none"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                Optional: Include any additional courses or certifications you've completed
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

export default EducationStep;
