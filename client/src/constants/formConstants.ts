export const INITIAL_FORM_STATE = {
  // Job Details
  title: '',
  category: '',
  jobType: '',
  location: '',
  isRemote: false,
  applicationDeadline: '',
  salaryMin: '',
  salaryMax: '',
  isSalaryNegotiable: false,
  
  // Job Description
  description: '',
  responsibilities: '',
  requirements: '',
  
  // Company Info
  companyName: '',
  companyLogo: null as File | null,
  companyBio: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  website: '',
  
  // Application Settings
  howToApply: 'email', // 'email' | 'url' | 'custom'
  applicationEmail: '',
  applicationUrl: '',
  customInstructions: '',
  
  // Additional Settings
  isConfidential: false,
  isDraft: false,
  screenerQuestions: []
};

export type JobFormValues = typeof INITIAL_FORM_STATE;
