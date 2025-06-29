import { useState } from 'react';

interface FormErrors {
  [key: string]: string;
}

interface FormTouched {
  [key: string]: boolean;
}

export const useJobFormState = <T extends object>(initialState: T) => {
  const [values, setValues] = useState<T>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<FormTouched>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleChange = (field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    if (touched[field as string] && errors[field as string]) {
      validate(field as string, value);
    }
  };
  
  const handleBlur = (field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validate(field as string, values[field as keyof T]);
  };
  
  const validate = (field: string, value: any) => {
    let newErrors = { ...errors };
    
    // Validation logic for specific fields
    switch(field) {
      case "title":
        if (!value?.trim()) {
          newErrors.title = "Job title is required";
        } else if (value.trim().length < 5) {
          newErrors.title = "Job title must be at least 5 characters";
        } else {
          delete newErrors.title;
        }
        break;
        
      case "category":
        if (!value) {
          newErrors.category = "Category is required";
        } else {
          delete newErrors.category;
        }
        break;
        
      case "jobType":
        if (!value) {
          newErrors.jobType = "Job type is required";
        } else {
          delete newErrors.jobType;
        }
        break;
        
      case "location":
        if (!value?.trim() && !(values as any).isRemote) {
          newErrors.location = "Location is required unless the job is remote";
        } else {
          delete newErrors.location;
        }
        break;
        
      case "description":
        if (!value?.trim()) {
          newErrors.description = "Job description is required";
        } else if (value.trim().length < 50) {
          newErrors.description = "Job description must be at least 50 characters";
        } else {
          delete newErrors.description;
        }
        break;
        
      case "salaryMin":
      case "salaryMax":
        if ((values as any).salaryMin && (values as any).salaryMax && Number((values as any).salaryMin) > Number((values as any).salaryMax)) {
          newErrors.salaryMin = "Minimum salary cannot be greater than maximum";
          newErrors.salaryMax = "Maximum salary cannot be less than minimum";
        } else {
          delete newErrors.salaryMin;
          delete newErrors.salaryMax;
        }
        break;
        
      case "companyName":
        if (!value?.trim()) {
          newErrors.companyName = "Company name is required";
        } else {
          delete newErrors.companyName;
        }
        break;
        
      case "contactName":
        if (!value?.trim()) {
          newErrors.contactName = "Contact name is required";
        } else {
          delete newErrors.contactName;
        }
        break;
        
      case "contactEmail":
        if (!value?.trim()) {
          newErrors.contactEmail = "Contact email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.contactEmail = "Please enter a valid email address";
        } else {
          delete newErrors.contactEmail;
        }
        break;
        
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validateAll = () => {
    let requiredFields = [
      "title", "category", "jobType", "description", 
      "companyName", "contactName", "contactEmail"
    ];
    
    let newErrors: FormErrors = {};
    let newTouched: FormTouched = {};
    
    requiredFields.forEach(field => {
      newTouched[field] = true;
      if (!(values as any)[field]) {
        newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      }
    });
    
    // Check location if not remote
    if (!(values as any).location && !(values as any).isRemote) {
      newErrors.location = "Location is required unless the job is remote";
      newTouched.location = true;
    }
  
    // Check salary range if provided
    if ((values as any).salaryMin && (values as any).salaryMax && Number((values as any).salaryMin) > Number((values as any).salaryMax)) {
      newErrors.salaryMin = "Minimum salary cannot be greater than maximum";
      newErrors.salaryMax = "Maximum salary cannot be less than minimum";
      newTouched.salaryMin = true;
      newTouched.salaryMax = true;
    }
    
    setErrors(newErrors);
    setTouched(newTouched);
    return Object.keys(newErrors).length === 0;
  };
  
  const reset = () => {
    setValues(initialState);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  };
  
  return { 
    values, 
    errors, 
    touched, 
    isSubmitting,
    setIsSubmitting,
    handleChange, 
    handleBlur, 
    validateAll,
    reset 
  };
};

export default useJobFormState;
