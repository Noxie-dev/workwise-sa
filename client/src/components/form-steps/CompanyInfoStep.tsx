import React, { useState, useCallback } from 'react';
import { PlusCircle, ImageIcon, X, Sparkles } from 'lucide-react';

import {
  Button,
  Input,
  Textarea,
  Card,
  CardContent,
  Label,
} from '@/components/ui';

interface CompanyInfoStepProps {
  formState: any;
  handleAIAssist: (type: string) => void;
}

export const CompanyInfoStep: React.FC<CompanyInfoStepProps> = ({ formState, handleAIAssist }) => {
  const { values, errors, touched, handleChange, handleBlur } = formState;
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleChange("companyLogo", file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const removeLogo = () => {
    handleChange("companyLogo", null);
    setLogoPreview(null);
  };
  
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <FormField 
          id="company-name" 
          label="Company Name" 
          error={touched.companyName && errors.companyName}
          required
        >
          <Input
            id="company-name"
            type="text"
            value={values.companyName || ""}
            onChange={(e) => handleChange("companyName", e.target.value)}
            onBlur={() => handleBlur("companyName")}
            placeholder="Enter your company name"
          />
        </FormField>
        
        <FormField 
          id="company-logo" 
          label="Company Logo"
          hint="Recommended size: 400x400px, Max: 2MB"
        >
          <div className="space-y-4">
            {!values.companyLogo ? (
              <div className="flex items-center justify-center w-full">
                <label htmlFor="company-logo-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <ImageIcon className="w-8 h-8 mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500">Click to upload logo</p>
                  </div>
                  <input
                    id="company-logo-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleLogoChange}
                  />
                </label>
              </div>
            ) : (
              <div className="relative w-full">
                <img
                  src={logoPreview || ''}
                  alt="Company logo preview"
                  className="w-full max-w-[200px] h-auto rounded-lg mx-auto"
                />
                <button
                  type="button"
                  onClick={removeLogo}
                  className="absolute -top-2 -right-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-full p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </FormField>
      </div>

      <FormField 
        id="company-bio" 
        label="Company Description" 
        error={touched.companyBio && errors.companyBio}
        hint="Tell potential candidates about your company"
      >
        <div className="flex flex-col space-y-2">
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAIAssist("companyBio")}
              disabled={!values.companyName || !values.category}
              className="flex items-center gap-1.5"
            >
              <Sparkles className="h-4 w-4" />
              Generate with AI
            </Button>
          </div>
          <Textarea
            id="company-bio"
            value={values.companyBio || ""}
            onChange={(e) => handleChange("companyBio", e.target.value)}
            onBlur={() => handleBlur("companyBio")}
            className="min-h-[120px]"
            placeholder="Tell candidates about your company's mission, culture, and values..."
          />
        </div>
      </FormField>

      <div className="grid gap-6 md:grid-cols-2">
        <FormField 
          id="contact-name" 
          label="Contact Person" 
          error={touched.contactName && errors.contactName}
          required
        >
          <Input
            id="contact-name"
            type="text"
            value={values.contactName || ""}
            onChange={(e) => handleChange("contactName", e.target.value)}
            onBlur={() => handleBlur("contactName")}
            placeholder="Name of the person managing applications"
          />
        </FormField>

        <FormField 
          id="contact-email" 
          label="Contact Email" 
          error={touched.contactEmail && errors.contactEmail}
          required
        >
          <Input
            id="contact-email"
            type="email"
            value={values.contactEmail || ""}
            onChange={(e) => handleChange("contactEmail", e.target.value)}
            onBlur={() => handleBlur("contactEmail")}
            placeholder="Email for receiving applications"
          />
        </FormField>

        <FormField 
          id="contact-phone" 
          label="Contact Phone"
          error={touched.contactPhone && errors.contactPhone}
        >
          <Input
            id="contact-phone"
            type="tel"
            value={values.contactPhone || ""}
            onChange={(e) => handleChange("contactPhone", e.target.value)}
            onBlur={() => handleBlur("contactPhone")}
            placeholder="Optional phone number"
          />
        </FormField>

        <FormField 
          id="website" 
          label="Company Website"
          error={touched.website && errors.website}
          hint="Optional, but recommended"
        >
          <Input
            id="website"
            type="url"
            value={values.website || ""}
            onChange={(e) => handleChange("website", e.target.value)}
            onBlur={() => handleBlur("website")}
            placeholder="https://www.example.com"
          />
        </FormField>
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
      <Label htmlFor={id} className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {hint && <span className="text-xs text-gray-500">{hint}</span>}
    </div>
    {children}
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

export default CompanyInfoStep;
