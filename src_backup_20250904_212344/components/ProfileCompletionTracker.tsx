import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  Circle, 
  User, 
  GraduationCap, 
  Briefcase, 
  Star,
  Settings,
  AlertCircle
} from 'lucide-react';

interface ProfileSection {
  id: string;
  name: string;
  icon: React.ReactNode;
  completed: boolean;
  required: boolean;
  description: string;
}

interface ProfileCompletionTrackerProps {
  profile: any;
  onSectionClick: (sectionId: string) => void;
  className?: string;
}

const ProfileCompletionTracker: React.FC<ProfileCompletionTrackerProps> = ({
  profile,
  onSectionClick,
  className = ''
}) => {
  const sections: ProfileSection[] = [
    {
      id: 'personal',
      name: 'Personal Information',
      icon: <User className="h-4 w-4" />,
      completed: !!(profile?.personal?.fullName && profile?.personal?.phoneNumber && profile?.personal?.location),
      required: true,
      description: 'Basic contact information and bio'
    },
    {
      id: 'education',
      name: 'Education',
      icon: <GraduationCap className="h-4 w-4" />,
      completed: !!(profile?.education?.highestEducation && profile?.education?.schoolName),
      required: true,
      description: 'Educational background and qualifications'
    },
    {
      id: 'experience',
      name: 'Work Experience',
      icon: <Briefcase className="h-4 w-4" />,
      completed: profile?.experience?.hasExperience ? 
        !!(profile?.experience?.jobTitle && profile?.experience?.employer) : true,
      required: false,
      description: 'Employment history and achievements'
    },
    {
      id: 'skills',
      name: 'Skills & Languages',
      icon: <Star className="h-4 w-4" />,
      completed: !!(profile?.skills?.skills && profile?.skills?.skills.length > 0),
      required: true,
      description: 'Technical and soft skills'
    },
    {
      id: 'preferences',
      name: 'Job Preferences',
      icon: <Settings className="h-4 w-4" />,
      completed: !!(profile?.preferences?.jobTypes && profile?.preferences?.jobTypes.length > 0),
      required: false,
      description: 'Preferred job types and locations'
    }
  ];

  const completedSections = sections.filter(s => s.completed).length;
  const requiredSections = sections.filter(s => s.required);
  const completedRequiredSections = requiredSections.filter(s => s.completed).length;
  const completionPercentage = Math.round((completedSections / sections.length) * 100);
  const requiredCompletionPercentage = Math.round((completedRequiredSections / requiredSections.length) * 100);

  const getCompletionStatus = () => {
    if (requiredCompletionPercentage === 100) {
      return { status: 'complete', color: 'text-green-600', bgColor: 'bg-green-50' };
    } else if (requiredCompletionPercentage >= 50) {
      return { status: 'good', color: 'text-blue-600', bgColor: 'bg-blue-50' };
    } else {
      return { status: 'needs-work', color: 'text-orange-600', bgColor: 'bg-orange-50' };
    }
  };

  const statusInfo = getCompletionStatus();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Profile Completion</span>
          <Badge 
            variant="outline" 
            className={`${statusInfo.color} ${statusInfo.bgColor} border-current`}
          >
            {completionPercentage}% Complete
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span className="font-medium">{completedSections}/{sections.length} sections</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>

        {/* Required Sections Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1">
              Required Sections
              <AlertCircle className="h-3 w-3 text-orange-500" />
            </span>
            <span className="font-medium">{completedRequiredSections}/{requiredSections.length}</span>
          </div>
          <Progress value={requiredCompletionPercentage} className="h-2" />
        </div>

        {/* Section List */}
        <div className="space-y-2">
          {sections.map((section) => (
            <div
              key={section.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer hover:bg-gray-50 ${
                section.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
              }`}
              onClick={() => onSectionClick(section.id)}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1 rounded-full ${
                  section.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {section.completed ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    {section.icon}
                    <span className="font-medium text-sm">{section.name}</span>
                    {section.required && (
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        Required
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{section.description}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-xs">
                {section.completed ? 'Edit' : 'Complete'}
              </Button>
            </div>
          ))}
        </div>

        {/* Completion Tips */}
        {requiredCompletionPercentage < 100 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">Complete your profile to get better job matches!</p>
                <p className="text-blue-700">
                  Employers are {Math.round((100 - requiredCompletionPercentage) * 0.3)}% more likely to contact candidates with complete profiles.
                </p>
              </div>
            </div>
          </div>
        )}

        {requiredCompletionPercentage === 100 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-900 mb-1">Great job! Your profile is complete.</p>
                <p className="text-green-700">
                  You're now eligible for premium job matches and recruiter visibility.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileCompletionTracker;