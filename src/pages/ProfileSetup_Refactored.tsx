import React, { useEffect, useReducer, useCallback } from "react";
import { Helmet } from "react-helmet";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query"; // Import useMutation
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

// Import sub-components
import PersonalInfoStep from "./ProfileSetup/components/PersonalInfoStep";
import EducationStep from "./ProfileSetup/components/EducationStep";
import ExperienceStep from "./ProfileSetup/components/ExperienceStep";
import SkillsCvStep from "./ProfileSetup/components/SkillsCvStep";

// Import service functions
import * as profileService from "@/services/profileService";
import * as authService from "@/services/authService";

// --- State Management with useReducer ---

type ProfileStep = "personal" | "education" | "experience" | "skills";

// TODO: Define specific types for each step's data
interface ProfileSetupState {
  currentStep: ProfileStep;
  isLoadingAuth: boolean;
  profileData: {
    personal: any;
    education: any;
    experience: any;
    skills: any;
  };
  profileImage: File | null;
  profileImagePreview: string | null;
  cvFile: File | null;
  cvFileName: string | null;
}

type ProfileSetupAction =
  | { type: "SET_STEP"; payload: ProfileStep }
  | { type: "SET_LOADING_AUTH"; payload: boolean }
  | { type: "UPDATE_PERSONAL_DATA"; payload: any }
  | { type: "UPDATE_EDUCATION_DATA"; payload: any }
  | { type: "UPDATE_EXPERIENCE_DATA"; payload: any }
  | { type: "UPDATE_SKILLS_DATA"; payload: any }
  | { type: "SET_PROFILE_IMAGE"; payload: { file: File | null; preview: string | null } }
  | { type: "SET_CV_FILE"; payload: { file: File | null; name: string | null } }
  | { type: "UPDATE_FROM_SCAN"; payload: any }; // Action for CV scan results

const initialState: ProfileSetupState = {
  currentStep: "personal",
  isLoadingAuth: true,
  profileData: {
    personal: {},
    education: {},
    experience: {},
    skills: {},
  },
  profileImage: null,
  profileImagePreview: null,
  cvFile: null,
  cvFileName: null,
};

function profileSetupReducer(state: ProfileSetupState, action: ProfileSetupAction): ProfileSetupState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, currentStep: action.payload };
    case "SET_LOADING_AUTH":
      return { ...state, isLoadingAuth: action.payload };
    case "UPDATE_PERSONAL_DATA":
      return { ...state, profileData: { ...state.profileData, personal: action.payload } };
    case "UPDATE_EDUCATION_DATA":
      return { ...state, profileData: { ...state.profileData, education: action.payload } };
    case "UPDATE_EXPERIENCE_DATA":
      return { ...state, profileData: { ...state.profileData, experience: action.payload } };
    case "UPDATE_SKILLS_DATA":
      return { ...state, profileData: { ...state.profileData, skills: action.payload } };
    case "SET_PROFILE_IMAGE":
      return { ...state, profileImage: action.payload.file, profileImagePreview: action.payload.preview };
    case "SET_CV_FILE":
      return { ...state, cvFile: action.payload.file, cvFileName: action.payload.name };
    case "UPDATE_FROM_SCAN":
      // Merge scanned data into the profileData, prioritizing scanned data
      // This needs careful mapping based on the API response structure
      console.log("Updating state from CV scan:", action.payload);
      return {
        ...state,
        profileData: {
          personal: { ...state.profileData.personal, ...action.payload.personalInfo },
          education: { ...state.profileData.education, ...action.payload.education },
          experience: { ...state.profileData.experience, ...action.payload.experience },
          skills: { ...state.profileData.skills, ...action.payload.skills },
        },
      };
    default:
      return state;
  }
}

// --- Component Implementation ---

const ProfileSetupRefactored: React.FC = () => {
  const [state, dispatch] = useReducer(profileSetupReducer, initialState);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { currentUser, isLoading: isAuthContextLoading } = useAuth();

  // Check authentication and profile completion status
  useEffect(() => {
    const checkAuthAndProfile = async () => {
      if (!isAuthContextLoading) {
        if (!currentUser) {
          console.log("User not authenticated, redirecting to login");
          toast({ variant: "destructive", title: "Authentication Required", description: "Please log in." });
          navigate("/login");
        } else {
          try {
            const isComplete = await authService.checkProfileCompletion(currentUser.uid);
            if (isComplete) {
              console.log("Profile already complete, redirecting to profile page");
              navigate("/profile");
            } else {
              console.log("User authenticated, proceeding with profile setup.");
              dispatch({ type: "SET_LOADING_AUTH", payload: false });
            }
          } catch (error) {
            console.error("Error checking profile completion:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not check profile status." });
            dispatch({ type: "SET_LOADING_AUTH", payload: false });
          }
        }
      }
    };
    checkAuthAndProfile();
  }, [currentUser, isAuthContextLoading, navigate, toast]);

  // Mutation for final profile update
  const updateProfileMutation = useMutation(profileService.updateProfile, {
    onMutate: () => {
      toast({ title: "Saving Profile...", description: "Finalizing your profile setup." });
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: "Profile Setup Complete", description: "Your profile has been successfully set up." });
        navigate("/profile");
      } else {
        toast({ variant: "destructive", title: "Update Failed", description: data.message || "Failed to save profile." });
      }
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Update Failed", description: error.message || "An unexpected error occurred." });
    },
  });

  // --- Step Navigation Handlers ---
  const handleNextStep = useCallback((currentStepData: any) => {
    switch (state.currentStep) {
      case "personal":
        dispatch({ type: "UPDATE_PERSONAL_DATA", payload: currentStepData });
        dispatch({ type: "SET_STEP", payload: "education" });
        break;
      case "education":
        dispatch({ type: "UPDATE_EDUCATION_DATA", payload: currentStepData });
        dispatch({ type: "SET_STEP", payload: "experience" });
        break;
      case "experience":
        dispatch({ type: "UPDATE_EXPERIENCE_DATA", payload: currentStepData });
        dispatch({ type: "SET_STEP", payload: "skills" });
        break;
      case "skills":
        dispatch({ type: "UPDATE_SKILLS_DATA", payload: currentStepData });
        // Trigger final submission mutation
        updateProfileMutation.mutate({
          profileData: { ...state.profileData, skills: currentStepData },
          profileImage: state.profileImage ?? undefined,
          cvFile: state.cvFile ?? undefined,
        });
        break;
    }
  }, [state.currentStep, state.profileData, state.profileImage, state.cvFile, updateProfileMutation]);

  const handlePreviousStep = useCallback(() => {
    switch (state.currentStep) {
      case "education": dispatch({ type: "SET_STEP", payload: "personal" }); break;
      case "experience": dispatch({ type: "SET_STEP", payload: "education" }); break;
      case "skills": dispatch({ type: "SET_STEP", payload: "experience" }); break;
    }
  }, [state.currentStep]);

  // Callback for CV Scan completion
  const handleScanComplete = useCallback((scannedData: any) => {
    dispatch({ type: "UPDATE_FROM_SCAN", payload: scannedData });
    // Optionally, navigate back to the first step or show a message
    toast({ title: "CV Data Applied", description: "Information from your CV has been pre-filled. Please review each step." });
  }, []);

  // --- Render Logic ---
  if (state.isLoadingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Checking authentication...</span>
      </div>
    );
  }

  const renderStepContent = () => {
    const isSubmitting = updateProfileMutation.isLoading;
    switch (state.currentStep) {
      case "personal":
        return (
          <PersonalInfoStep
            initialData={state.profileData.personal}
            onSubmit={handleNextStep}
            isSubmitting={isSubmitting}
            profileImagePreview={state.profileImagePreview}
            onImageUpload={(file, preview) => dispatch({ type: "SET_PROFILE_IMAGE", payload: { file, preview } })}
          />
        );
      case "education":
        return (
          <EducationStep
            initialData={state.profileData.education}
            onSubmit={handleNextStep}
            onBack={handlePreviousStep}
            isSubmitting={isSubmitting}
          />
        );
      case "experience":
        return (
          <ExperienceStep
            initialData={state.profileData.experience}
            onSubmit={handleNextStep}
            onBack={handlePreviousStep}
            isSubmitting={isSubmitting}
          />
        );
      case "skills":
        return (
          <SkillsCvStep
            initialData={state.profileData.skills}
            onSubmit={handleNextStep} // Final submit triggered via mutation
            onBack={handlePreviousStep}
            isSubmitting={isSubmitting}
            cvFile={state.cvFile}
            cvFileName={state.cvFileName}
            onCvUpload={(file, name) => dispatch({ type: "SET_CV_FILE", payload: { file, name } })}
            onScanComplete={handleScanComplete} // Pass the callback
          />
        );
      default:
        return <div>Invalid Step</div>;
    }
  };

  return (
    <>
      <Helmet>
        <title>Complete Your Profile | WorkWise SA</title>
        <meta name="description" content="Set up your WorkWise SA profile." />
      </Helmet>

      <main className="flex-grow bg-light py-10">
        <div className="container max-w-4xl mx-auto px-4">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
              <CardDescription>Help us find the best opportunities for you.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={state.currentStep} className="w-full">
                <TabsList className="grid grid-cols-4 mb-8">
                  <TabsTrigger value="personal" disabled={updateProfileMutation.isLoading}>Personal Info</TabsTrigger>
                  <TabsTrigger value="education" disabled={updateProfileMutation.isLoading}>Education</TabsTrigger>
                  <TabsTrigger value="experience" disabled={updateProfileMutation.isLoading}>Work Experience</TabsTrigger>
                  <TabsTrigger value="skills" disabled={updateProfileMutation.isLoading}>Skills & CV</TabsTrigger>
                </TabsList>
                {renderStepContent()}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
};

export default ProfileSetupRefactored;
