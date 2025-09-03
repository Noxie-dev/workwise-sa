import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Briefcase, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  Building, 
  MapPin,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { ProfileData } from '@/services/profileService';

interface ExperienceEntry {
  id: string;
  jobTitle: string;
  employer: string;
  location: string;
  startDate: string;
  endDate: string;
  currentlyEmployed: boolean;
  description: string;
  achievements: string;
}

interface ExperienceTimelineProps {
  profile: ProfileData | null;
  onUpdate: (data: any) => void;
}

/**
 * Experience Timeline Component
 * Manages work experience entries with add, edit, and delete functionality
 */
const ExperienceTimeline: React.FC<ExperienceTimelineProps> = ({ profile, onUpdate }) => {
  const [experiences, setExperiences] = useState<ExperienceEntry[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingExperience, setEditingExperience] = useState<ExperienceEntry | null>(null);
  const [formData, setFormData] = useState<ExperienceEntry>({
    id: '',
    jobTitle: '',
    employer: '',
    location: '',
    startDate: '',
    endDate: '',
    currentlyEmployed: false,
    description: '',
    achievements: ''
  });

  // Initialize experiences from profile
  useEffect(() => {
    if (profile?.experience) {
      // Convert profile experience to timeline format
      const experienceEntries: ExperienceEntry[] = [];
      
      if (profile.experience.hasExperience && profile.experience.jobTitle && profile.experience.employer) {
        experienceEntries.push({
          id: '1',
          jobTitle: profile.experience.jobTitle,
          employer: profile.experience.employer,
          location: profile.experience.location || '',
          startDate: profile.experience.startDate || '',
          endDate: profile.experience.endDate || '',
          currentlyEmployed: profile.experience.currentlyEmployed || false,
          description: profile.experience.jobDescription || '',
          achievements: profile.experience.achievements || ''
        });
      }

      setExperiences(experienceEntries);
    }
  }, [profile]);

  // Update profile when experiences change
  useEffect(() => {
    if (experiences.length > 0) {
      const latestExperience = experiences[0]; // Use the most recent experience
      onUpdate({
        hasExperience: true,
        jobTitle: latestExperience.jobTitle,
        employer: latestExperience.employer,
        location: latestExperience.location,
        startDate: latestExperience.startDate,
        endDate: latestExperience.endDate,
        currentlyEmployed: latestExperience.currentlyEmployed,
        jobDescription: latestExperience.description,
        achievements: latestExperience.achievements
      });
    } else {
      onUpdate({
        hasExperience: false,
        jobTitle: '',
        employer: '',
        location: '',
        startDate: '',
        endDate: '',
        currentlyEmployed: false,
        jobDescription: '',
        achievements: ''
      });
    }
  }, [experiences, onUpdate]);

  const resetForm = () => {
    setFormData({
      id: '',
      jobTitle: '',
      employer: '',
      location: '',
      startDate: '',
      endDate: '',
      currentlyEmployed: false,
      description: '',
      achievements: ''
    });
  };

  const handleAddExperience = () => {
    const newExperience: ExperienceEntry = {
      ...formData,
      id: Date.now().toString()
    };
    
    setExperiences(prev => [newExperience, ...prev]);
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEditExperience = (experience: ExperienceEntry) => {
    setEditingExperience(experience);
    setFormData(experience);
    setIsEditDialogOpen(true);
  };

  const handleUpdateExperience = () => {
    if (!editingExperience) return;
    
    setExperiences(prev => 
      prev.map(exp => 
        exp.id === editingExperience.id 
          ? { ...formData, id: editingExperience.id }
          : exp
      )
    );
    
    resetForm();
    setEditingExperience(null);
    setIsEditDialogOpen(false);
  };

  const handleDeleteExperience = (id: string) => {
    setExperiences(prev => prev.filter(exp => exp.id !== id));
  };

  const handleInputChange = (field: keyof ExperienceEntry, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', { 
      year: 'numeric', 
      month: 'short' 
    });
  };

  const calculateDuration = (startDate: string, endDate: string, currentlyEmployed: boolean) => {
    if (!startDate) return '';
    
    const start = new Date(startDate);
    const end = currentlyEmployed ? new Date() : new Date(endDate);
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    
    if (diffMonths < 12) {
      return `${diffMonths} month${diffMonths !== 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(diffMonths / 12);
      const months = diffMonths % 12;
      return `${years} year${years !== 1 ? 's' : ''}${months > 0 ? ` ${months} month${months !== 1 ? 's' : ''}` : ''}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-primary" />
            Work Experience
          </h2>
          <p className="text-gray-600">Add your professional work history</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Experience
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Work Experience</DialogTitle>
            </DialogHeader>
            <ExperienceForm
              formData={formData}
              onInputChange={handleInputChange}
              onSave={handleAddExperience}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Experience Timeline */}
      {experiences.length > 0 ? (
        <div className="space-y-4">
          {experiences.map((experience, index) => (
            <Card key={experience.id} className="relative">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{experience.jobTitle}</h3>
                      {experience.currentlyEmployed && (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Current
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Building className="w-4 h-4" />
                        <span>{experience.employer}</span>
                      </div>
                      {experience.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{experience.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {formatDate(experience.startDate)} - {' '}
                          {experience.currentlyEmployed ? 'Present' : formatDate(experience.endDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{calculateDuration(experience.startDate, experience.endDate, experience.currentlyEmployed)}</span>
                      </div>
                    </div>

                    {experience.description && (
                      <p className="text-gray-700 mb-3">{experience.description}</p>
                    )}

                    {experience.achievements && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h4 className="font-medium text-sm mb-2">Key Achievements:</h4>
                        <p className="text-sm text-gray-700">{experience.achievements}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditExperience(experience)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteExperience(experience.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No work experience added</h3>
            <p className="text-gray-500 mb-4">
              Add your work experience to showcase your professional background to employers.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Experience
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Work Experience</DialogTitle>
          </DialogHeader>
          <ExperienceForm
            formData={formData}
            onInputChange={handleInputChange}
            onSave={handleUpdateExperience}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Tips */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Tips for effective work experience entries:</strong>
          <ul className="mt-2 list-disc list-inside space-y-1">
            <li>Start with your most recent or relevant experience</li>
            <li>Use action verbs to describe your responsibilities</li>
            <li>Include specific achievements and quantifiable results</li>
            <li>Be honest about dates and job titles</li>
            <li>Include volunteer work and internships if relevant</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};

// Experience Form Component
interface ExperienceFormProps {
  formData: ExperienceEntry;
  onInputChange: (field: keyof ExperienceEntry, value: string | boolean) => void;
  onSave: () => void;
  onCancel: () => void;
}

const ExperienceForm: React.FC<ExperienceFormProps> = ({ formData, onInputChange, onSave, onCancel }) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.jobTitle.trim()) {
      newErrors.jobTitle = 'Job title is required';
    }

    if (!formData.employer.trim()) {
      newErrors.employer = 'Employer is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.currentlyEmployed && !formData.endDate) {
      newErrors.endDate = 'End date is required if not currently employed';
    }

    if (formData.startDate && formData.endDate && !formData.currentlyEmployed) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      if (endDate <= startDate) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave();
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="jobTitle">Job Title *</Label>
          <Input
            id="jobTitle"
            value={formData.jobTitle}
            onChange={(e) => onInputChange('jobTitle', e.target.value)}
            placeholder="e.g., Software Developer"
            className={errors.jobTitle ? 'border-red-500' : ''}
          />
          {errors.jobTitle && <p className="text-sm text-red-500">{errors.jobTitle}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="employer">Employer *</Label>
          <Input
            id="employer"
            value={formData.employer}
            onChange={(e) => onInputChange('employer', e.target.value)}
            placeholder="e.g., ABC Company"
            className={errors.employer ? 'border-red-500' : ''}
          />
          {errors.employer && <p className="text-sm text-red-500">{errors.employer}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => onInputChange('location', e.target.value)}
            placeholder="e.g., Cape Town, Western Cape"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date *</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => onInputChange('startDate', e.target.value)}
            className={errors.startDate ? 'border-red-500' : ''}
          />
          {errors.startDate && <p className="text-sm text-red-500">{errors.startDate}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => onInputChange('endDate', e.target.value)}
            disabled={formData.currentlyEmployed}
            className={errors.endDate ? 'border-red-500' : ''}
          />
          {errors.endDate && <p className="text-sm text-red-500">{errors.endDate}</p>}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="currentlyEmployed"
            checked={formData.currentlyEmployed}
            onCheckedChange={(checked) => onInputChange('currentlyEmployed', checked as boolean)}
          />
          <Label htmlFor="currentlyEmployed">I currently work here</Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Job Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => onInputChange('description', e.target.value)}
          placeholder="Describe your main responsibilities and duties..."
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="achievements">Key Achievements</Label>
        <Textarea
          id="achievements"
          value={formData.achievements}
          onChange={(e) => onInputChange('achievements', e.target.value)}
          placeholder="Highlight your key accomplishments, projects, or results..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save Experience
        </Button>
      </div>
    </div>
  );
};

export default ExperienceTimeline;