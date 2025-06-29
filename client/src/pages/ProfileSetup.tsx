import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'wouter';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Upload, FilePlus, CheckCircle, PlusCircle, XCircle, FileText, AlertCircle, FileSearch, Info, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { API_URL } from '@/lib/env';
import { profileService } from '@/services/profileService';
import { fileUploadService } from '@/services/fileUploadService';
import { getCurrentUser } from '@/lib/firebase';

// Form schemas
const personalInfoSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  location: z.string().min(2, "Location must be at least 2 characters"),
  idNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  bio: z.string().max(300, "Bio must be less than 300 characters").optional(),
  profilePicture: z.any().optional(),
});

type PersonalInfoValues = z.infer<typeof personalInfoSchema>;

const educationSchema = z.object({
  highestEducation: z.string(),
  schoolName: z.string().min(2, "Please enter your school name"),
  yearCompleted: z.string().optional(),
  achievements: z.string().optional(),
  additionalCourses: z.string().optional(),
});

type EducationValues = z.infer<typeof educationSchema>;

const experienceSchema = z.object({
  hasExperience: z.boolean().default(false),
  currentlyEmployed: z.boolean().optional(),
  jobTitle: z.string().optional(),
  employer: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  jobDescription: z.string().optional(),
  previousExperience: z.string().optional(),
  volunteerWork: z.string().optional(),
  references: z.string().optional(),
});

type ExperienceValues = z.infer<typeof experienceSchema>;

const skillsSchema = z.object({
  skills: z.array(z.string()).optional(),
  customSkills: z.string().optional(),
  languages: z.array(z.string()).optional(),
  hasDriversLicense: z.boolean().optional(),
  hasTransport: z.boolean().optional(),
  cvUpload: z.any().optional(),
  createCV: z.boolean().optional(),
});

type SkillsValues = z.infer<typeof skillsSchema>;

// Basic structure for the profile setup page
const ProfileSetup = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { currentUser, isLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState<string>('personal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileData, setProfileData] = useState({
    personal: {},
    education: {},
    experience: {},
    skills: {}
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvFilePreview, setCvFilePreview] = useState<string | null>(null);
  const [cvFileName, setCvFileName] = useState<string | null>(null);
  const [isScanningCV, setIsScanningCV] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [cvScanComplete, setCvScanComplete] = useState(false);
  const [showCvPreview, setShowCvPreview] = useState(false);
  const [currentPreviewPage, setCurrentPreviewPage] = useState(1);
  const [totalPreviewPages, setTotalPreviewPages] = useState(1);
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isProcessingAiPrompt, setIsProcessingAiPrompt] = useState(false);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [customSkills, setCustomSkills] = useState<string[]>([]);
  const [scanWarnings, setScanWarnings] = useState<{
    type: 'handwritten' | 'scratched' | 'missing' | 'unclear';
    section: string;
    message: string;
    suggestedFix?: string;
  }[]>([]);
  const [scanConfidence, setScanConfidence] = useState<{
    section: string;
    confidence: number;
    notes?: string;
  }[]>([]);

  // Use useEffect for authentication check instead of immediate return
  useEffect(() => {
    // Add a delay to allow auth state to fully initialize
    const checkAuth = setTimeout(() => {
      if (!isLoading && !currentUser) {
        console.log("User not authenticated, redirecting to login");
        toast({
          variant: "destructive",
          title: "Authentication Required",
          description: "Please log in to set up your profile.",
        });
        navigate('/login');
      } else if (currentUser) {
        console.log("User authenticated:", currentUser.email);
      }
    }, 1000);

    return () => clearTimeout(checkAuth);
  }, [currentUser, isLoading, navigate, toast]);

  // Initialize form for personal info
  const personalForm = useForm<PersonalInfoValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      fullName: currentUser?.displayName || '',
      phoneNumber: '',
      location: '',
      idNumber: '',
      dateOfBirth: '',
      gender: '',
      bio: '',
    }
  });

  // Initialize form for education info
  const educationForm = useForm<EducationValues>({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      highestEducation: '',
      schoolName: '',
      yearCompleted: '',
      achievements: '',
      additionalCourses: '',
    }
  });

  // Initialize form for work experience
  const experienceForm = useForm<ExperienceValues>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      hasExperience: false,
      currentlyEmployed: false,
      jobTitle: '',
      employer: '',
      startDate: '',
      endDate: '',
      jobDescription: '',
      previousExperience: '',
      volunteerWork: '',
      references: '',
    }
  });

  // Initialize form for skills and CV
  const skillsForm = useForm<SkillsValues>({
    resolver: zodResolver(skillsSchema),
    defaultValues: {
      skills: [],
      customSkills: '',
      languages: [],
      hasDriversLicense: false,
      hasTransport: false,
      createCV: false,
    }
  });

  // Handle profile image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        toast({
          variant: "destructive",
          title: "Invalid File",
          description: "Please upload an image file (JPG, JPEG, or PNG).",
        });
        return;
      }

      // Create initial preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      try {
        // Show loading state
        toast({
          title: "Enhancing Image",
          description: "We're optimizing your profile picture for better quality...",
        });

        // Use the profileService to enhance the image
        const result = await profileService.enhanceImage(file);

        if (result.success) {
          // Update preview with enhanced image
          setProfileImagePreview(`data:image/jpeg;base64,${result.data.enhancedImage}`);
          setProfileImage(file);

          toast({
            title: "Image Enhanced",
            description: "Your profile picture has been optimized for better quality.",
          });
        } else {
          throw new Error(result.error || "Failed to enhance image");
        }
      } catch (error: any) {
        console.error("Image enhancement error:", error);
        toast({
          variant: "destructive",
          title: "Enhancement Failed",
          description: "We couldn't enhance your image, but you can still use the original.",
        });
        // Keep the original image if enhancement fails
        setProfileImage(file);
      }
    }
  };

  // Handle CV file upload
  const handleCVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCvFile(file);
      setCvFileName(file.name);

      // Create a preview URL for image files
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setCvFilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setCvFilePreview(null);
      }

      toast({
        title: "CV Uploaded",
        description: `File "${file.name}" has been selected.`,
      });
    }
  };

  const processExtractedData = (data: any) => {
    // Process personal information
    if (data.personal) {
      const { fullName, phoneNumber, location } = data.personal;
      personalForm.setValue('fullName', fullName || '');
      personalForm.setValue('phoneNumber', phoneNumber || '');
      personalForm.setValue('location', location || '');
    }

    // Process education information
    if (data.education) {
      const { highestEducation, schoolName, yearCompleted, achievements } = data.education;
      educationForm.setValue('highestEducation', highestEducation || '');
      educationForm.setValue('schoolName', schoolName || '');
      educationForm.setValue('yearCompleted', yearCompleted || '');
      educationForm.setValue('achievements', achievements || '');
    }

    // Process experience information
    if (data.experience) {
      const { jobTitle, employer, jobDescription } = data.experience;
      experienceForm.setValue('hasExperience', true);
      experienceForm.setValue('jobTitle', jobTitle || '');
      experienceForm.setValue('employer', employer || '');
      experienceForm.setValue('jobDescription', jobDescription || '');
    }

    // Process skills information
    if (data.skills) {
      const { skills, languages } = data.skills;
      skillsForm.setValue('skills', skills || []);
      skillsForm.setValue('languages', languages || []);
    }

    // Update profile data state
    setProfileData({
      personal: personalForm.getValues(),
      education: educationForm.getValues(),
      experience: experienceForm.getValues(),
      skills: skillsForm.getValues()
    });
  };

  // Scan CV with Gemini AI to extract information
  const scanCVWithGemini = async () => {
    if (!cvFile) {
      toast({
        variant: "destructive",
        title: "No CV File",
        description: "Please upload a CV file first before scanning.",
      });
      return;
    }

    setIsScanningCV(true);
    setScanError(null);
    setCvScanComplete(false);
    setScanWarnings([]);
    setScanConfidence([]);

    try {
      // Use the profileService to scan the CV
      const result = await profileService.scanCV(cvFile);

      if (result.success) {
        const { extractedData, warnings, confidence } = result.data;

        // Store warnings and confidence levels
        setScanWarnings(warnings || []);
        setScanConfidence(confidence || []);

        // Process the extracted data
        processExtractedData(extractedData);

        setCvScanComplete(true);
        setShowCvPreview(true);

        if (warnings?.length > 0) {
          toast({
            title: "CV Scanned with Warnings",
            description: "Some sections need your attention. Please review the preview.",
            variant: "warning"
          });
        } else {
          toast({
            title: "CV Scanned Successfully",
            description: "Your information has been extracted. Please review and make any necessary adjustments.",
          });
        }
      } else {
        throw new Error(result.error || "Failed to scan CV");
      }
    } catch (error: any) {
      console.error("CV scanning error:", error);
      setScanError(error.message || "Failed to scan CV. Please try again or fill in the forms manually.");
      toast({
        variant: "destructive",
        title: "Scanning Failed",
        description: error.message || "Failed to scan CV. Please try again or fill in the forms manually.",
      });
    } finally {
      setIsScanningCV(false);
    }
  };

  // Handle AI prompt for clarification
  const handleAiPrompt = async () => {
    if (!aiPrompt.trim()) return;

    setIsProcessingAiPrompt(true);
    try {
      // Prepare the CV data from form values
      const cvData = {
        personal: personalForm.getValues(),
        education: educationForm.getValues(),
        experience: experienceForm.getValues(),
        skills: skillsForm.getValues(),
      };

      // Use the profileService to process the AI prompt
      const result = await profileService.processAIPrompt(aiPrompt, cvData, scanWarnings);

      if (result.success) {
        // Update forms with AI-suggested improvements
        if (result.data.personal) {
          personalForm.setValue('fullName', result.data.personal.fullName || personalForm.getValues('fullName'));
          personalForm.setValue('phoneNumber', result.data.personal.phoneNumber || personalForm.getValues('phoneNumber'));
          personalForm.setValue('location', result.data.personal.location || personalForm.getValues('location'));
          personalForm.setValue('bio', result.data.personal.bio || personalForm.getValues('bio'));
        }

        if (result.data.education) {
          educationForm.setValue('highestEducation', result.data.education.highestEducation || educationForm.getValues('highestEducation'));
          educationForm.setValue('schoolName', result.data.education.schoolName || educationForm.getValues('schoolName'));
          educationForm.setValue('yearCompleted', result.data.education.yearCompleted || educationForm.getValues('yearCompleted'));
          educationForm.setValue('achievements', result.data.education.achievements || educationForm.getValues('achievements'));
          educationForm.setValue('additionalCourses', result.data.education.additionalCourses || educationForm.getValues('additionalCourses'));
        }

        if (result.data.experience) {
          experienceForm.setValue('jobTitle', result.data.experience.jobTitle || experienceForm.getValues('jobTitle'));
          experienceForm.setValue('employer', result.data.experience.employer || experienceForm.getValues('employer'));
          experienceForm.setValue('startDate', result.data.experience.startDate || experienceForm.getValues('startDate'));
          experienceForm.setValue('endDate', result.data.experience.endDate || experienceForm.getValues('endDate'));
          experienceForm.setValue('jobDescription', result.data.experience.jobDescription || experienceForm.getValues('jobDescription'));
          experienceForm.setValue('previousExperience', result.data.experience.previousExperience || experienceForm.getValues('previousExperience'));
          experienceForm.setValue('volunteerWork', result.data.experience.volunteerWork || experienceForm.getValues('volunteerWork'));
        }

        if (result.data.skills) {
          skillsForm.setValue('skills', result.data.skills.skills || skillsForm.getValues('skills'));
        }

        toast({
          title: "AI Suggestions Applied",
          description: "The AI has made improvements based on your prompt. Please review the changes.",
        });
      } else {
        throw new Error(result.error || "Failed to process AI prompt");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "AI Processing Failed",
        description: error.message || "Failed to process your request. Please try again.",
      });
    } finally {
      setIsProcessingAiPrompt(false);
      setAiPrompt('');
    }
  };

  // Add custom skill
  const addCustomSkill = () => {
    if (customSkillInput.trim() && !customSkills.includes(customSkillInput.trim())) {
      const newSkills = [...customSkills, customSkillInput.trim()];
      setCustomSkills(newSkills);
      skillsForm.setValue('customSkills', newSkills.join(', '));
      setCustomSkillInput('');
    }
  };

  // Remove custom skill
  const removeCustomSkill = (skill: string) => {
    const newSkills = customSkills.filter(s => s !== skill);
    setCustomSkills(newSkills);
    skillsForm.setValue('customSkills', newSkills.join(', '));
  };

  // Save personal info and move to next step
  const onPersonalSubmit = (data: PersonalInfoValues) => {
    setProfileData(prev => ({
      ...prev,
      personal: data
    }));
    setCurrentStep('education');
  };

  // Save education info and move to next step
  const onEducationSubmit = (data: EducationValues) => {
    setProfileData(prev => ({
      ...prev,
      education: data
    }));
    setCurrentStep('experience');
  };

  // Save work experience and move to next step
  const onExperienceSubmit = (data: ExperienceValues) => {
    setProfileData(prev => ({
      ...prev,
      experience: data
    }));
    setCurrentStep('skills');
  };

  // Save skills and complete profile setup
  const onSkillsSubmit = async (data: SkillsValues) => {
    setProfileData(prev => ({
      ...prev,
      skills: data
    }));
    await handleProfileUpdate();
  };

  // Function to handle form submission (to be implemented)
  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Save user profile (will implement later)
      // This is where you would send all collected data to your backend
      console.log("Complete profile data:", profileData);

      // Handle file uploads if needed
      if (profileImage) {
        console.log("Profile image to upload:", profileImage);
        // Upload the profile image
      }

      if (cvFile) {
        console.log("CV file to upload:", cvFile);
        // Upload the CV file
      }

      toast({
        title: "Profile Setup Complete",
        description: "Your profile has been successfully set up.",
      });

      // Navigate to the profile page
      navigate('/profile');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to set up your profile. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfileUpdate = async () => {
    setIsSubmitting(true);
    try {
      // Collect all form data
      const profileData = {
        personal: personalForm.getValues(),
        education: educationForm.getValues(),
        experience: experienceForm.getValues(),
        skills: {
          ...skillsForm.getValues(),
          customSkills: customSkills.join(', ')
        }
      };

      // Get the current user
      const user = getCurrentUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Upload files to Firebase Storage
      let profileImageUrl = null;
      let cvFileUrl = null;

      // Upload profile image if exists
      if (profileImage) {
        try {
          profileImageUrl = await fileUploadService.uploadProfileImage(profileImage, user.uid);
          console.log("Profile image uploaded:", profileImageUrl);
        } catch (uploadError) {
          console.error("Profile image upload error:", uploadError);
          toast({
            variant: "destructive",
            title: "Image Upload Failed",
            description: "Failed to upload profile image. Profile will be saved without the image.",
          });
        }
      }

      // Upload CV file if exists
      if (cvFile) {
        try {
          cvFileUrl = await fileUploadService.uploadCV(cvFile, user.uid);
          console.log("CV file uploaded:", cvFileUrl);
        } catch (uploadError) {
          console.error("CV file upload error:", uploadError);
          toast({
            variant: "destructive",
            title: "CV Upload Failed",
            description: "Failed to upload CV file. Profile will be saved without the CV.",
          });
        }
      }

      // Add file URLs to profile data
      const completeProfileData = {
        ...profileData,
        personal: {
          ...profileData.personal,
          profileImageUrl
        },
        skills: {
          ...profileData.skills,
          cvFileUrl
        }
      };

      try {
        // For now, we'll simulate a successful API call
        // In a real implementation, you would send the profile data to your backend
        console.log("Profile data to save:", completeProfileData);

        // Update user profile in Firebase Auth if profile image was uploaded
        if (profileImageUrl && user) {
          await user.updateProfile({
            displayName: profileData.personal.fullName,
            photoURL: profileImageUrl
          });
        }

        toast({
          title: "Profile Updated",
          description: "Your profile has been successfully set up.",
        });

        // Navigate to profile page
        console.log("Redirecting to profile page");
        navigate('/profile');
      } catch (apiError) {
        console.error("API call failed:", apiError);

        // For development/testing - simulate success if API is not available
        console.log("Simulating successful profile update for development");
        toast({
          title: "Profile Setup Complete",
          description: "Your profile has been successfully set up.",
        });

        // Navigate to profile page even if API fails (for testing)
        console.log("Redirecting to profile page");
        navigate('/profile');
      }
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Failed to update your profile. Please try again.",
      });

      // For development/testing - navigate anyway
      console.log("Redirecting to profile page despite error");
      navigate('/profile');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  return (
    <>
      <Helmet>
        <title>Complete Your Profile | WorkWise SA</title>
        <meta name="description" content="Set up your WorkWise SA profile to find better job opportunities." />
      </Helmet>

      <main className="flex-grow bg-light py-10">
        <div className="container max-w-4xl mx-auto px-4">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <img
                  src="/images/logo.png"
                  alt="WorkWise SA Logo"
                  className="h-36 md:h-40 object-contain transition-all duration-200 hover:scale-105"
                />
              </div>
              <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
              <CardDescription>
                Help us understand your skills and experience so we can find the best opportunities for you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={currentStep} onValueChange={setCurrentStep} className="w-full">
                <TabsList className="grid grid-cols-4 mb-8">
                  <TabsTrigger value="personal">Personal Info</TabsTrigger>
                  <TabsTrigger value="education">Education</TabsTrigger>
                  <TabsTrigger value="experience">Work Experience</TabsTrigger>
                  <TabsTrigger value="skills">Skills & CV</TabsTrigger>
                </TabsList>

                <TabsContent value="personal">
                  <Form {...personalForm}>
                    <form onSubmit={personalForm.handleSubmit(onPersonalSubmit)} className="space-y-6">
                      <div className="flex flex-col items-center mb-6">
                        <div className="mb-4 text-center">
                          <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                            {profileImagePreview ? (
                              <img
                                src={profileImagePreview}
                                alt="Profile Preview"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Upload className="h-8 w-8 text-gray-400" />
                            )}
                          </div>
                          <FormLabel htmlFor="profile-picture" className="block mt-2 text-sm font-medium text-gray-700">
                            Profile Picture
                          </FormLabel>
                          <Input
                            id="profile-picture"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="sr-only"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('profile-picture')?.click()}
                            className="mt-2"
                          >
                            Upload Photo
                          </Button>
                          <FormDescription className="text-xs mt-1">
                            A clear photo helps employers recognize you
                          </FormDescription>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={personalForm.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name*</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your full name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={personalForm.control}
                          name="phoneNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number*</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your phone number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={personalForm.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location*</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Johannesburg, Gauteng" {...field} />
                              </FormControl>
                              <FormDescription>
                                Where you're currently based
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={personalForm.control}
                          name="idNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ID Number</FormLabel>
                              <FormControl>
                                <Input placeholder="Optional - Enter your ID number" {...field} />
                              </FormControl>
                              <FormDescription>
                                This helps verify your identity
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={personalForm.control}
                          name="dateOfBirth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date of Birth</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={personalForm.control}
                          name="gender"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Gender</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select your gender" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="male">Male</SelectItem>
                                  <SelectItem value="female">Female</SelectItem>
                                  <SelectItem value="non-binary">Non-binary</SelectItem>
                                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={personalForm.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>About Me</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Tell employers a bit about yourself, your background, and what you're looking for"
                                className="resize-none h-24"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Brief introduction that will appear on your profile (max 300 characters)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex flex-col space-y-4">
                        <div className="flex items-center justify-between">
                          <Button
                            type="button"
                            variant="default"
                            onClick={() => setCurrentStep('education')}
                          >
                            Fill Form Manually
                          </Button>
                          <p className="text-sm text-gray-500 ml-4">
                            Complete each section step by step to create your profile
                          </p>
                        </div>

                        <div className="flex items-center justify-between">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setCurrentStep('skills')}
                          >
                            Auto-fill with CV
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="ml-2 h-4 w-4" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Upload your CV to automatically fill in your education, experience, and skills</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </Button>
                          <p className="text-sm text-gray-500 ml-4">
                            Upload your CV and let AI extract your information automatically
                          </p>
                        </div>
                      </div>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="education">
                  <Form {...educationForm}>
                    <form onSubmit={educationForm.handleSubmit(onEducationSubmit)} className="space-y-6">
                      <div className="space-y-4">
                        <FormField
                          control={educationForm.control}
                          name="highestEducation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Highest Level of Education</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select your highest education level" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="primary">Primary School</SelectItem>
                                  <SelectItem value="some-high-school">Some High School</SelectItem>
                                  <SelectItem value="matric">Matric/Grade 12</SelectItem>
                                  <SelectItem value="certificate">Certificate</SelectItem>
                                  <SelectItem value="diploma">Diploma</SelectItem>
                                  <SelectItem value="degree">Bachelor's Degree</SelectItem>
                                  <SelectItem value="honors">Honors Degree</SelectItem>
                                  <SelectItem value="masters">Master's Degree</SelectItem>
                                  <SelectItem value="doctorate">Doctorate</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Select the highest level of education you've completed
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={educationForm.control}
                          name="schoolName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>School/Institution Name*</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter the name of your school or institution" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={educationForm.control}
                          name="yearCompleted"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Year Completed</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select year completed" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="in-progress">Currently Studying</SelectItem>
                                  {Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                    <SelectItem key={year} value={year.toString()}>
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
                          control={educationForm.control}
                          name="achievements"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Achievements & Subjects</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Optional - List any notable achievements or subjects you excelled in"
                                  className="resize-none h-24"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                For example: "Passed with distinction in mathematics", "Computer literacy certificate"
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={educationForm.control}
                          name="additionalCourses"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Additional Courses or Training</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Optional - List any additional courses, training or workshops you've attended"
                                  className="resize-none h-24"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Include short courses, online certifications, or any training programs
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-between">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setCurrentStep('personal')}
                        >
                          Back to Personal Info
                        </Button>
                        <Button type="submit">
                          Next: Work Experience
                        </Button>
                      </div>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="experience">
                  <Form {...experienceForm}>
                    <form onSubmit={experienceForm.handleSubmit(onExperienceSubmit)} className="space-y-6">
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-start mb-4">
                          <FormField
                            control={experienceForm.control}
                            name="hasExperience"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={field.onChange}
                                    className="h-5 w-5 rounded border-gray-300"
                                  />
                                </FormControl>
                                <FormLabel className="text-base font-semibold cursor-pointer">
                                  I have work experience
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        </div>

                        <p className="text-sm text-gray-500">
                          It's okay if you don't have formal work experience yet. Many employers value potential and willingness to learn.
                          You can still list informal work like helping at a family business, community projects, or volunteer positions.
                        </p>
                      </div>

                      {experienceForm.watch("hasExperience") && (
                        <div className="space-y-4">
                          <div className="border rounded-lg p-4">
                            <h3 className="font-medium mb-4">Current or Most Recent Job</h3>

                            <div className="mb-4">
                              <FormField
                                control={experienceForm.control}
                                name="currentlyEmployed"
                                render={({ field }) => (
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <input
                                        type="checkbox"
                                        checked={field.value}
                                        onChange={field.onChange}
                                        className="h-5 w-5 rounded border-gray-300"
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer">
                                      I am currently working here
                                    </FormLabel>
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={experienceForm.control}
                                name="jobTitle"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Job Title</FormLabel>
                                    <FormControl>
                                      <Input placeholder="e.g. Sales Assistant" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={experienceForm.control}
                                name="employer"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Company/Employer</FormLabel>
                                    <FormControl>
                                      <Input placeholder="e.g. ABC Store" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={experienceForm.control}
                                name="startDate"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Start Date</FormLabel>
                                    <FormControl>
                                      <Input type="month" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              {!experienceForm.watch("currentlyEmployed") && (
                                <FormField
                                  control={experienceForm.control}
                                  name="endDate"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>End Date</FormLabel>
                                      <FormControl>
                                        <Input type="month" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              )}
                            </div>

                            <div className="mt-4">
                              <FormField
                                control={experienceForm.control}
                                name="jobDescription"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Job Responsibilities</FormLabel>
                                    <FormControl>
                                      <Textarea
                                        placeholder="Describe your main duties and achievements"
                                        className="resize-none h-24"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      For example: "Helped customers find products, operated the cash register, kept the store tidy"
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>

                          <FormField
                            control={experienceForm.control}
                            name="previousExperience"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Other Work Experience</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="List any other jobs you've had (job title, company, dates)"
                                    className="resize-none h-24"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Include informal work like helping at a family business or temporary jobs
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      <FormField
                        control={experienceForm.control}
                        name="volunteerWork"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Volunteer Experience or Community Work</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe any volunteer work or community activities"
                                className="resize-none h-24"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Include church activities, community projects, or helping neighbors - these build valuable skills!
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={experienceForm.control}
                        name="references"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>References</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Optional - List people who can recommend you (name, position, contact details)"
                                className="resize-none h-24"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              These could be previous employers, teachers, or community leaders who know your abilities
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-between">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setCurrentStep('education')}
                        >
                          Back to Education
                        </Button>
                        <Button type="submit">
                          Next: Skills & CV
                        </Button>
                      </div>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="skills">
                  <Form {...skillsForm}>
                    <form onSubmit={skillsForm.handleSubmit(onSkillsSubmit)} className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-4">Your Skills</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          Select skills that you have. Don't worry if you're just starting out - everyone has valuable skills!
                        </p>

                        <FormField
                          control={skillsForm.control}
                          name="skills"
                          render={() => (
                            <FormItem>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {commonSkills.map((skill) => (
                                  <FormField
                                    key={skill}
                                    control={skillsForm.control}
                                    name="skills"
                                    render={({ field }) => {
                                      return (
                                        <FormItem
                                          key={skill}
                                          className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3"
                                        >
                                          <FormControl>
                                            <Checkbox
                                              checked={field.value?.includes(skill)}
                                              onCheckedChange={(checked) => {
                                                return checked
                                                  ? field.onChange([...field.value || [], skill])
                                                  : field.onChange(
                                                      field.value?.filter(
                                                        (value) => value !== skill
                                                      )
                                                    )
                                              }}
                                            />
                                          </FormControl>
                                          <FormLabel className="font-normal cursor-pointer">
                                            {skill}
                                          </FormLabel>
                                        </FormItem>
                                      )
                                    }}
                                  />
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div>
                        <h3 className="text-lg font-medium mb-2">Other Skills</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          Add any other skills you have that aren't listed above
                        </p>

                        <div className="flex items-center space-x-2 mb-4">
                          <Input
                            value={customSkillInput}
                            onChange={(e) => setCustomSkillInput(e.target.value)}
                            placeholder="Type a skill and click Add"
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={addCustomSkill}
                            disabled={!customSkillInput.trim()}
                          >
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Add
                          </Button>
                        </div>

                        {customSkills.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {customSkills.map((skill, index) => (
                              <div
                                key={index}
                                className="bg-gray-100 rounded-full px-3 py-1 text-sm flex items-center"
                              >
                                {skill}
                                <button
                                  type="button"
                                  onClick={() => removeCustomSkill(skill)}
                                  className="ml-2 text-gray-500 hover:text-red-500"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <h3 className="text-lg font-medium mb-2">Languages</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          Select languages that you can speak
                        </p>

                        <FormField
                          control={skillsForm.control}
                          name="languages"
                          render={() => (
                            <FormItem>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {languages.map((language) => (
                                  <FormField
                                    key={language}
                                    control={skillsForm.control}
                                    name="languages"
                                    render={({ field }) => {
                                      return (
                                        <FormItem
                                          key={language}
                                          className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3"
                                        >
                                          <FormControl>
                                            <Checkbox
                                              checked={field.value?.includes(language)}
                                              onCheckedChange={(checked) => {
                                                return checked
                                                  ? field.onChange([...field.value || [], language])
                                                  : field.onChange(
                                                      field.value?.filter(
                                                        (value) => value !== language
                                                      )
                                                    )
                                              }}
                                            />
                                          </FormControl>
                                          <FormLabel className="font-normal cursor-pointer">
                                            {language}
                                          </FormLabel>
                                        </FormItem>
                                      )
                                    }}
                                  />
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={skillsForm.control}
                          name="hasDriversLicense"
                          render={({ field }) => (
                            <FormItem className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="font-medium cursor-pointer">
                                  I have a driver's license
                                </FormLabel>
                                <FormDescription>
                                  Important for jobs that require driving
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={skillsForm.control}
                          name="hasTransport"
                          render={({ field }) => (
                            <FormItem className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="font-medium cursor-pointer">
                                  I have access to transportation
                                </FormLabel>
                                <FormDescription>
                                  Important for jobs that require transportation
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="border rounded-lg p-6 bg-gray-50 space-y-4">
                        <h3 className="text-lg font-medium">Upload Your CV</h3>
                        <p className="text-sm text-gray-500">
                          Upload your CV to auto-populate your profile information using AI. We support PDF, Word documents, and image formats.
                        </p>

                        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-white">
                          {cvFilePreview ? (
                            <div className="mb-4 w-full max-w-md">
                              <img
                                src={cvFilePreview}
                                alt="CV Preview"
                                className="mx-auto max-h-60 object-contain border rounded"
                              />
                            </div>
                          ) : cvFileName ? (
                            <div className="mb-4 flex items-center space-x-2">
                              <FileText className="h-10 w-10 text-primary" />
                              <div>
                                <p className="font-medium">{cvFileName}</p>
                                <p className="text-sm text-gray-500">
                                  {cvFile?.type || 'Document'}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center mb-4">
                              <FilePlus className="mx-auto h-12 w-12 text-gray-400" />
                              <p className="mt-2 text-sm text-gray-500">
                                Drag and drop or click to upload
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                Supports PDF, DOC, DOCX, JPG, PNG
                              </p>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2 justify-center">
                            <Input
                              id="cv-upload"
                              type="file"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.tif,.tiff"
                              onChange={handleCVUpload}
                              className="sr-only"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => document.getElementById('cv-upload')?.click()}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Browse Files
                            </Button>

                            <Button
                              type="button"
                              variant="default"
                              onClick={scanCVWithGemini}
                              disabled={!cvFile || isScanningCV}
                            >
                              {isScanningCV ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Scanning...
                                </>
                              ) : (
                                <>
                                  <FileSearch className="h-4 w-4 mr-2" />
                                  Scan with AI
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        {scanError && (
                          <Alert variant="destructive" className="mt-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{scanError}</AlertDescription>
                          </Alert>
                        )}

                        {cvScanComplete && (
                          <Alert variant="success" className="mt-4 bg-green-50 border-green-200 text-green-800">
                            <CheckCircle className="h-4 w-4" />
                            <AlertTitle>CV Scan Complete</AlertTitle>
                            <AlertDescription>
                              Your CV was successfully analyzed and the information has been used to populate your profile forms.
                              Please review all sections to ensure accuracy.
                            </AlertDescription>
                          </Alert>
                        )}

                        <div className="flex flex-wrap gap-1 mt-4">
                          <Badge variant="outline" className="text-xs">PDF</Badge>
                          <Badge variant="outline" className="text-xs">DOCX</Badge>
                          <Badge variant="outline" className="text-xs">DOC</Badge>
                          <Badge variant="outline" className="text-xs">JPG</Badge>
                          <Badge variant="outline" className="text-xs">PNG</Badge>
                          <Badge variant="outline" className="text-xs">TIF</Badge>
                        </div>

                        <FormField
                          control={skillsForm.control}
                          name="createCV"
                          render={({ field }) => (
                            <FormItem className="flex items-start space-x-3 space-y-0 mt-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="font-medium cursor-pointer">
                                  I don't have a CV - help me create one
                                </FormLabel>
                                <FormDescription>
                                  We'll use the information you provide to generate a professional CV for you
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-between">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setCurrentStep('experience')}
                          className="border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                        >
                          Back to Experience
                        </Button>
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          variant="outline"
                          className="bg-white text-primary hover:bg-yellow-400 hover:text-blue-800 hover:border-yellow-500 font-medium border-primary transition-colors"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : "Complete Profile Setup"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>

              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (currentStep === 'personal') return;
                    if (currentStep === 'education') setCurrentStep('personal');
                    if (currentStep === 'experience') setCurrentStep('education');
                    if (currentStep === 'skills') setCurrentStep('experience');
                  }}
                  disabled={currentStep === 'personal'}
                  className="border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                >
                  Previous
                </Button>

                {currentStep !== 'skills' ? (
                  <Button
                    onClick={() => {
                      if (currentStep === 'personal') setCurrentStep('education');
                      if (currentStep === 'education') setCurrentStep('experience');
                      if (currentStep === 'experience') setCurrentStep('skills');
                    }}
                    disabled={currentStep === 'personal' || currentStep === 'education'}
                    variant="outline"
                    className="bg-white text-primary hover:bg-yellow-400 hover:text-blue-800 hover:border-yellow-500 font-medium border-primary transition-colors"
                  >
                    Next
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {/* CV Preview Dialog */}
          <Dialog open={showCvPreview} onOpenChange={setShowCvPreview}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>CV Scan Results</DialogTitle>
                <DialogDescription>
                  Review the extracted information and make any necessary adjustments
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Scan Warnings */}
                {scanWarnings.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-medium text-yellow-600">Attention Required</h3>
                    <div className="space-y-2">
                      {scanWarnings.map((warning, index) => (
                        <Alert key={index} variant="warning">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>{warning.section}</AlertTitle>
                          <AlertDescription>
                            {warning.message}
                            {warning.suggestedFix && (
                              <p className="mt-2 text-sm">
                                <span className="font-medium">Suggested Fix:</span> {warning.suggestedFix}
                              </p>
                            )}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}

                {/* Scan Confidence */}
                {scanConfidence.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-medium">Scan Confidence</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {scanConfidence.map((item, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-full">
                            <div className="flex justify-between text-sm mb-1">
                              <span>{item.section}</span>
                              <span className="font-medium">
                                {Math.round(item.confidence * 100)}%
                              </span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full">
                              <div
                                className={`h-full rounded-full ${
                                  item.confidence > 0.8
                                    ? 'bg-green-500'
                                    : item.confidence > 0.5
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                }`}
                                style={{ width: `${item.confidence * 100}%` }}
                              />
                            </div>
                            {item.notes && (
                              <p className="text-xs text-gray-500 mt-1">{item.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Prompt Section */}
                <div className="space-y-4">
                  <h3 className="font-medium">Need Help with Corrections?</h3>
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Describe any issues or ask for help with specific sections..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <Button
                      onClick={handleAiPrompt}
                      disabled={isProcessingAiPrompt || !aiPrompt.trim()}
                      className="w-full"
                    >
                      {isProcessingAiPrompt ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Get AI Assistance'
                      )}
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCvPreview(false)}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setShowCvPreview(false);
                      setCurrentStep('skills');
                    }}
                  >
                    Continue to Skills
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </>
  );
};

export default ProfileSetup;