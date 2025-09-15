import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Button from "@/components/ui/button";
import Form from "@/components/ui/form";
import FormControl from "@/components/ui/form/FormControl";
import FormDescription from "@/components/ui/form/FormDescription";
import FormField from "@/components/ui/form/FormField";
import FormItem from "@/components/ui/form/FormItem";
import FormLabel from "@/components/ui/form/FormLabel";
import FormMessage from "@/components/ui/form/FormMessage";
import Input from "@/components/ui/input";
import Checkbox from "@/components/ui/checkbox";
import Badge from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, ChevronLeft, Upload, FileText, AlertCircle, FileSearch, Info, XCircle } from "lucide-react";
import { scanCV } from "@/services/profileService";

// Form schema
const skillsSchema = z.object({
  languages: z.array(z.string()).min(1, "Please select at least one language"),
  selectedSkills: z.array(z.string()).min(1, "Please select at least one skill"),
  customSkills: z.string().optional(),
  hasDriversLicense: z.boolean().optional(),
  hasOwnTransport: z.boolean().optional(),
  willingToRelocate: z.boolean().optional(),
});

type SkillsValues = z.infer<typeof skillsSchema>;

interface SkillsCvStepProps {
  initialData: any;
  onSubmit: (data: SkillsValues) => void;
  onBack: () => void;
  isSubmitting: boolean;
  cvFile: File | null;
  cvFileName: string | null;
  onCvUpload: (file: File, name: string) => void;
  onScanComplete: (data: any) => void;
}

const SkillsCvStep: React.FC<SkillsCvStepProps> = ({
  initialData,
  onSubmit,
  onBack,
  isSubmitting,
  cvFile,
  cvFileName,
  onCvUpload,
  onScanComplete,
}) => {
  const [customSkill, setCustomSkill] = useState("");
  const [customSkills, setCustomSkills] = useState<string[]>(
    initialData?.customSkills ? initialData.customSkills.split(",").map((s: string) => s.trim()) : []
  );
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [showScanDialog, setShowScanDialog] = useState(false);

  const form = useForm<SkillsValues>({
    resolver: zodResolver(skillsSchema),
    defaultValues: {
      ...initialData,
      languages: initialData?.languages || [],
      selectedSkills: initialData?.selectedSkills || [],
      customSkills: initialData?.customSkills || "",
      hasDriversLicense: initialData?.hasDriversLicense || false,
      hasOwnTransport: initialData?.hasOwnTransport || false,
      willingToRelocate: initialData?.willingToRelocate || false,
    },
  });

  // Common skills for entry-level jobs
  const commonSkills = [
    "Customer Service",
    "Communication",
    "Time Management",
    "Problem Solving",
    "Teamwork",
    "Cash Handling",
    "Computer Basics",
    "Microsoft Office",
    "Inventory Management",
    "Sales",
    "Food Service",
    "Cleaning",
    "Organization",
    "Attention to Detail",
    "Reliability"
  ];
  
  // Common languages in South Africa
  const languages = [
    "English",
    "Afrikaans",
    "Zulu (isiZulu)",
    "Xhosa (isiXhosa)",
    "Sotho (Sesotho)",
    "Tswana (Setswana)",
    "Tsonga (Xitsonga)",
    "Swati (siSwati)",
    "Venda (Tshivenda)",
    "Ndebele (isiNdebele)",
    "Other"
  ];

  const addCustomSkill = () => {
    if (customSkill.trim() && !customSkills.includes(customSkill.trim())) {
      setCustomSkills([...customSkills, customSkill.trim()]);
      setCustomSkill("");
    }
  };

  const removeCustomSkill = (skill: string) => {
    setCustomSkills(customSkills.filter((s) => s !== skill));
  };

  const handleCvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCvUpload(file, file.name);
    }
  };

  const handleScanCv = async () => {
    if (!cvFile) return;

    setIsScanning(true);
    setScanError(null);
    setShowScanDialog(true);

    try {
      const scanResults = await scanCV(cvFile);
      onScanComplete(scanResults);
      setShowScanDialog(false);
    } catch (error: any) {
      setScanError(error.message || "Failed to scan CV. Please try again or fill in the form manually.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = (data: SkillsValues) => {
    // Include custom skills in the form data
    const formData = {
      ...data,
      customSkills: customSkills.join(", "),
    };
    onSubmit(formData);
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <h3 className="text-lg font-medium">Upload Your CV</h3>
              <p className="text-sm text-muted-foreground">
                Upload your CV to automatically fill in your skills and experience
              </p>

              <div className="flex items-center space-x-4 mt-2">
                <div className="flex-1">
                  <label
                    htmlFor="cv-upload"
                    className="cursor-pointer flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-md hover:border-primary transition-colors"
                  >
                    <div className="flex flex-col items-center space-y-2 py-4">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {cvFileName ? cvFileName : "Click to upload CV"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        PDF, DOC, or DOCX (Max 5MB)
                      </span>
                    </div>
                    <input
                      id="cv-upload"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="sr-only"
                      onChange={handleCvUpload}
                      disabled={isSubmitting}
                    />
                  </label>
                </div>

                {cvFile && (
                  <Button
                    type="button"
                    onClick={handleScanCv}
                    disabled={isSubmitting || isScanning}
                    className="flex-shrink-0"
                  >
                    {isScanning ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileSearch className="mr-2 h-4 w-4" />
                    )}
                    Scan CV
                  </Button>
                )}
              </div>

              {cvFile && (
                <div className="flex items-center mt-2">
                  <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {cvFileName}
                  </span>
                </div>
              )}
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>CV Scanning</AlertTitle>
              <AlertDescription>
                Our AI will extract information from your CV to help you complete your profile faster.
                You can still edit all fields after scanning.
              </AlertDescription>
            </Alert>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Languages</h3>
            <FormField
              control={form.control}
              name="languages"
              render={() => (
                <FormItem>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {languages.map((language) => (
                      <FormField
                        key={language}
                        control={form.control}
                        name="languages"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={language}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(language)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, language])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== language
                                          )
                                        );
                                  }}
                                  disabled={isSubmitting}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {language}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Skills</h3>
            <FormField
              control={form.control}
              name="selectedSkills"
              render={() => (
                <FormItem>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {commonSkills.map((skill) => (
                      <FormField
                        key={skill}
                        control={form.control}
                        name="selectedSkills"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={skill}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(skill)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, skill])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== skill
                                          )
                                        );
                                  }}
                                  disabled={isSubmitting}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {skill}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Add Custom Skills</FormLabel>
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter a skill"
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomSkill();
                    }
                  }}
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  onClick={addCustomSkill}
                  disabled={!customSkill.trim() || isSubmitting}
                >
                  Add
                </Button>
              </div>
              <FormDescription>
                Press Enter or click Add to add a custom skill
              </FormDescription>

              {customSkills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {customSkills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeCustomSkill(skill)}
                        className="text-muted-foreground hover:text-foreground"
                        disabled={isSubmitting}
                      >
                        <XCircle className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Additional Information</h3>
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="hasDriversLicense"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>I have a driver's license</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hasOwnTransport"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>I have my own transport</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="willingToRelocate"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>I am willing to relocate for work</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Complete Profile
            </Button>
          </div>
        </form>
      </Form>

      <Dialog open={showScanDialog} onOpenChange={setShowScanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scanning Your CV</DialogTitle>
          </DialogHeader>
          {isScanning ? (
            <div className="flex flex-col items-center justify-center py-6">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-center">
                Our AI is analyzing your CV to extract relevant information...
              </p>
            </div>
          ) : scanError ? (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Scan Failed</AlertTitle>
                <AlertDescription>{scanError}</AlertDescription>
              </Alert>
              <DialogFooter>
                <Button onClick={() => setShowScanDialog(false)}>Close</Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6">
              <Info className="h-12 w-12 text-primary mb-4" />
              <p className="text-center">
                CV scan complete! The information has been added to your profile.
              </p>
              <DialogFooter className="mt-4">
                <Button onClick={() => setShowScanDialog(false)}>Continue</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SkillsCvStep;
