import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { marked } from 'marked';

import {
  Button,
  Textarea,
} from '@/components/ui';

interface JobDescriptionStepProps {
  formState: any;
  handleAIAssist: (type: string) => void;
}

export const JobDescriptionStep: React.FC<JobDescriptionStepProps> = ({ formState, handleAIAssist }) => {
  const { values, errors, touched, handleChange, handleBlur } = formState;
  const [showMarkdownHelp, setShowMarkdownHelp] = useState(false);
  
  return (
    <div className="space-y-6">
      <FormField 
        id="job-description" 
        label="Job Description" 
        error={touched.description && errors.description}
        required
      >
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowMarkdownHelp(!showMarkdownHelp)}
              className="text-xs py-1 h-auto"
              type="button"
            >
              Formatting Help
            </Button>
            
            <Button 
              variant="outline" 
              className="flex items-center gap-1.5"
              onClick={() => handleAIAssist("description")}
              disabled={!values.title || !values.category}
              type="button"
            >
              <Sparkles className="h-4 w-4" />
              Generate with AI
            </Button>
          </div>
          
          {showMarkdownHelp && (
            <div className="rounded border bg-gray-50 p-3 text-xs space-y-1">
              <p><code># Heading</code> for headings</p>
              <p><code>**bold**</code> for <strong>bold text</strong></p>
              <p><code>*italic*</code> for <em>italic text</em></p>
              <p><code>- item</code> for bullet points</p>
              <p><code>[link](https://example.com)</code> for links</p>
            </div>
          )}
          
          <Textarea 
            id="job-description"
            value={values.description || ""}
            onChange={(e) => handleChange("description", e.target.value)}
            onBlur={() => handleBlur("description")}
            className="min-h-[200px]"
            placeholder="Describe the position, requirements, responsibilities, and benefits..."
          />
        </div>
      </FormField>
      
      {values.description && (
        <div className="mt-4 border-t pt-4">
          <h4 className="text-sm font-medium mb-2">Preview:</h4>
          <div 
            className="prose prose-sm max-w-none border p-4 rounded-md"
            dangerouslySetInnerHTML={{ __html: marked(values.description) }} 
          />
        </div>
      )}
      
      <div className="grid gap-6 md:grid-cols-2">
        <FormField 
          id="job-responsibilities" 
          label="Key Responsibilities" 
          hint="List the main duties separate from the general description"
        >
          <Textarea 
            id="job-responsibilities"
            value={values.responsibilities || ""}
            onChange={(e) => handleChange("responsibilities", e.target.value)}
            className="min-h-[120px]"
            placeholder="- Manage daily operations&#10;- Handle customer inquiries&#10;- Maintain inventory records"
          />
        </FormField>
        
        <FormField 
          id="job-requirements" 
          label="Requirements & Qualifications"
          hint="Be specific about required experience and skills"
        >
          <Textarea 
            id="job-requirements"
            value={values.requirements || ""}
            onChange={(e) => handleChange("requirements", e.target.value)}
            className="min-h-[120px]"
            placeholder="- Minimum 2 years experience&#10;- High school diploma&#10;- Valid driver's license"
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
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {hint && <span className="text-xs text-gray-500">{hint}</span>}
    </div>
    {children}
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

export default JobDescriptionStep;
