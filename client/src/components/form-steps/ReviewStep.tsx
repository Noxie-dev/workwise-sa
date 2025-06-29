import React from 'react';
import { Edit3 } from 'lucide-react';
import { marked } from 'marked';

import { Card, CardContent, Button } from '@/components/ui';
import { JobFormValues } from '@/constants/formConstants';

interface ReviewStepProps {
  formState: {
    values: JobFormValues;
  };
  onEditStep: (step: number) => void;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ formState, onEditStep }) => {
  const { values } = formState;
  
  const formatSalary = (min?: string | number, max?: string | number, isNegotiable?: boolean) => {
    if (!min && !max) return isNegotiable ? 'Negotiable' : 'Not specified';
    if (min && max) return `R${Number(min).toLocaleString()} - R${Number(max).toLocaleString()}${isNegotiable ? ' (Negotiable)' : ''}`;
    if (min) return `From R${Number(min).toLocaleString()}${isNegotiable ? ' (Negotiable)' : ''}`;
    if (max) return `Up to R${Number(max).toLocaleString()}${isNegotiable ? ' (Negotiable)' : ''}`;
    return isNegotiable ? 'Negotiable' : 'Not specified';
  };

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Job Details</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditStep(0)}
            className="flex items-center gap-1.5"
          >
            <Edit3 className="w-4 h-4" />
            Edit Details
          </Button>
        </div>
        <Card>
          <CardContent className="grid gap-4 p-6">
            <div className="grid gap-2">
              <h4 className="font-medium">Position</h4>
              <p className="text-gray-600">{values.title}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium">Category</h4>
                <p className="text-gray-600">{values.category}</p>
              </div>
              <div>
                <h4 className="font-medium">Type</h4>
                <p className="text-gray-600">{values.jobType}</p>
              </div>
              <div>
                <h4 className="font-medium">Location</h4>
                <p className="text-gray-600">{values.isRemote ? 'Remote' : values.location}</p>
              </div>
            </div>
            <div>
              <h4 className="font-medium">Salary</h4>
              <p className="text-gray-600">{formatSalary(values.salaryMin, values.salaryMax, values.isSalaryNegotiable)}</p>
            </div>
            {values.applicationDeadline && (
              <div>
                <h4 className="font-medium">Application Deadline</h4>
                <p className="text-gray-600">{new Date(values.applicationDeadline).toLocaleDateString()}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Job Description</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditStep(1)}
            className="flex items-center gap-1.5"
          >
            <Edit3 className="w-4 h-4" />
            Edit Description
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 space-y-6">
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: marked(values.description || '') }}
              />
            </div>
            
            {values.responsibilities && (
              <div>
                <h4 className="font-medium mb-2">Key Responsibilities</h4>
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: marked(values.responsibilities) }}
                />
              </div>
            )}
            
            {values.requirements && (
              <div>
                <h4 className="font-medium mb-2">Requirements & Qualifications</h4>
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: marked(values.requirements) }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Company Information</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditStep(2)}
            className="flex items-center gap-1.5"
          >
            <Edit3 className="w-4 h-4" />
            Edit Company Info
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-4">
              {values.companyLogo && (
                <img
                  src={values.companyLogo instanceof File ? URL.createObjectURL(values.companyLogo) : values.companyLogo}
                  alt={`${values.companyName} logo`}
                  className="w-16 h-16 object-contain rounded"
                />
              )}
              <div>
                <h4 className="font-medium">{values.companyName}</h4>
                {values.website && (
                  <a href={values.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                    {values.website}
                  </a>
                )}
              </div>
            </div>
            
            {values.companyBio && (
              <div>
                <h4 className="font-medium mb-2">About the Company</h4>
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: marked(values.companyBio) }}
                />
              </div>
            )}
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium">Contact Person</h4>
                <p className="text-gray-600">{values.contactName}</p>
              </div>
              <div>
                <h4 className="font-medium">Contact Email</h4>
                <p className="text-gray-600">{values.contactEmail}</p>
              </div>
              {values.contactPhone && (
                <div>
                  <h4 className="font-medium">Contact Phone</h4>
                  <p className="text-gray-600">{values.contactPhone}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default ReviewStep;
