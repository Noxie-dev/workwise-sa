import React from 'react';
import { Eye, FileText, CheckCircle, AlertCircle, Clock, Users, DollarSign, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { JobFormValues } from '@/constants/formConstants';

interface SidePanelProps {
  formData: JobFormValues;
}

const SidePanel: React.FC<SidePanelProps> = ({ formData }) => {
  const formatSalary = (min?: string | number, max?: string | number, isNegotiable?: boolean) => {
    if (!min && !max) return isNegotiable ? 'Negotiable' : 'Not specified';
    if (min && max) return `R${Number(min).toLocaleString()} - R${Number(max).toLocaleString()}${isNegotiable ? ' (Negotiable)' : ''}`;
    if (min) return `From R${Number(min).toLocaleString()}${isNegotiable ? ' (Negotiable)' : ''}`;
    if (max) return `Up to R${Number(max).toLocaleString()}${isNegotiable ? ' (Negotiable)' : ''}`;
    return isNegotiable ? 'Negotiable' : 'Not specified';
  };

  const getCompletionPercentage = () => {
    const requiredFields = ['title', 'category', 'jobType', 'description', 'companyName', 'contactName', 'contactEmail'];
    const completedFields = requiredFields.filter(field => {
      const value = formData[field as keyof JobFormValues];
      return value && value.toString().trim() !== '';
    });
    
    // Add location check (either location or remote)
    if (formData.location?.trim() || formData.isRemote) {
      completedFields.push('location');
    }
    
    const totalFields = requiredFields.length + 1; // +1 for location/remote
    return Math.round((completedFields.length / totalFields) * 100);
  };

  const completionPercentage = getCompletionPercentage();

  return (
    <div className="space-y-4">
      {/* Job Preview Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold">Job Preview</h3>
          </div>
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-sm">{formData.title || 'Job Title'}</h4>
              <p className="text-xs text-gray-600">{formData.companyName || 'Company Name'}</p>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <MapPin className="w-3 h-3" />
              <span>{formData.isRemote ? 'Remote' : formData.location || 'Location'}</span>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <DollarSign className="w-3 h-3" />
              <span>{formatSalary(formData.salaryMin, formData.salaryMax, formData.isSalaryNegotiable)}</span>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Clock className="w-3 h-3" />
              <span>{formData.jobType || 'Job Type'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completion Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <h3 className="font-semibold">Completion Status</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-600">
              {completionPercentage === 100 ? 'Ready to publish!' : 'Fill in all required fields to publish'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-purple-600" />
            <h3 className="font-semibold">Quick Stats</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Description length</span>
              <span>{formData.description?.length || 0} chars</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Responsibilities</span>
              <span>{formData.responsibilities ? 'Added' : 'Not added'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Requirements</span>
              <span>{formData.requirements ? 'Added' : 'Not added'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Company bio</span>
              <span>{formData.companyBio ? 'Added' : 'Not added'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Company logo</span>
              <span>{formData.companyLogo ? 'Added' : 'Not added'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <h3 className="font-semibold">Tips</h3>
          </div>
          <div className="space-y-2 text-xs text-gray-600">
            <p>• Use clear, specific job titles</p>
            <p>• Include salary range for better applications</p>
            <p>• Add company logo for brand recognition</p>
            <p>• Write detailed job descriptions</p>
            <p>• Set realistic application deadlines</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SidePanel;
