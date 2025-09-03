import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  GraduationCap, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  Award, 
  BookOpen,
  CheckCircle,
  AlertCircle,
  MapPin
} from 'lucide-react';
import { ProfileData } from '@/services/profileService';

interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  location: string;
  startDate: string;
  endDate: string;
  currentlyStudying: boolean;
  grade: string;
  achievements: string;
  additionalInfo: string;
}

interface EducationTimelineProps {
  profile: ProfileData | null;
  onUpdate: (data: any) => void;
}

/**
 * Education Timeline Component
 * Manages educational history with add, edit, and delete functionality
 */
const EducationTimeline: React.FC<EducationTimelineProps> = ({ profile, onUpdate }) => {
  const [educations, setEducations] = useState<EducationEntry[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEducation, setEditingEducation] = useState<EducationEntry | null>(null);
  const [formData, setFormData] = useState<EducationEntry>({
    id: '',
    institution: '',
    degree: '',
    fieldOfStudy: '',
    location: '',
    startDate: '',
    endDate: '',
    currentlyStudying: false,
    grade: '',
    achievements: '',
    additionalInfo: ''
  });

  // Common degree levels
  const degreeLevels = [
    'Grade 12 / Matric',
    'Certificate',
    'Diploma',
    'Bachelor\'s Degree',
    'Honours Degree',
    'Master\'s Degree',
    'PhD / Doctorate',
    'Postgraduate Diploma',
    'Professional Qualification',
    'Other'
  ];

  // Common fields of study
  const fieldsOfStudy = [
    'Business Administration',
    'Computer Science',
    'Information Technology',
    'Engineering',
    'Medicine',
    'Law',
    'Education',
    'Psychology',
    'Marketing',
    'Finance',
    'Accounting',
    'Human Resources',
    'Nursing',
    'Social Work',
    'Journalism',
    'Art & Design',
    'Music',
    'Sports Science',
    'Environmental Science',
    'Other'
  ];

  // Initialize educations from profile
  useEffect(() => {
    if (profile?.education) {
      const educationEntries: EducationEntry[] = [];
      
      if (profile.education.highestEducation && profile.education.schoolName) {
        educationEntries.push({
          id: '1',
          institution: profile.education.schoolName,
          degree: profile.education.highestEducation,
          fieldOfStudy: profile.education.fieldOfStudy || '',
          location: profile.education.location || '',
          startDate: profile.education.startDate || '',
          endDate: profile.education.yearCompleted || '',
          currentlyStudying: false,
          grade: profile.education.grade || '',
          achievements: profile.education.achievements || '',
          additionalInfo: profile.education.additionalCourses || ''
        });
      }

      setEducations(educationEntries);
    }
  }, [profile]);

  // Update profile when educations change
  useEffect(() => {
    if (educations.length > 0) {
      const highestEducation = educations.reduce((highest, current) => {
        const currentLevel = getEducationLevel(current.degree);
        const highestLevel = getEducationLevel(highest.degree);
        return currentLevel > highestLevel ? current : highest;
      });

      onUpdate({
        highestEducation: highestEducation.degree,
        schoolName: highestEducation.institution,
        fieldOfStudy: highestEducation.fieldOfStudy,
        location: highestEducation.location,
        startDate: highestEducation.startDate,
        yearCompleted: highestEducation.endDate,
        grade: highestEducation.grade,
        achievements: highestEducation.achievements,
        additionalCourses: highestEducation.additionalInfo
      });
    } else {
      onUpdate({
        highestEducation: '',
        schoolName: '',
        fieldOfStudy: '',
        location: '',
        startDate: '',
        yearCompleted: '',
        grade: '',
        achievements: '',
        additionalCourses: ''
      });
    }
  }, [educations, onUpdate]);

  const getEducationLevel = (degree: string): number => {
    const levels: Record<string, number> = {
      'Grade 12 / Matric': 1,
      'Certificate': 2,
      'Diploma': 3,
      'Bachelor\'s Degree': 4,
      'Honours Degree': 5,
      'Master\'s Degree': 6,
      'PhD / Doctorate': 7,
      'Postgraduate Diploma': 5,
      'Professional Qualification': 4,
      'Other': 1
    };
    return levels[degree] || 1;
  };

  const resetForm = () => {
    setFormData({
      id: '',
      institution: '',
      degree: '',
      fieldOfStudy: '',
      location: '',
      startDate: '',
      endDate: '',
      currentlyStudying: false,
      grade: '',
      achievements: '',
      additionalInfo: ''
    });
  };

  const handleAddEducation = () => {
    const newEducation: EducationEntry = {
      ...formData,
      id: Date.now().toString()
    };
    
    setEducations(prev => [newEducation, ...prev]);
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEditEducation = (education: EducationEntry) => {
    setEditingEducation(education);
    setFormData(education);
    setIsEditDialogOpen(true);
  };

  const handleUpdateEducation = () => {
    if (!editingEducation) return;
    
    setEducations(prev => 
      prev.map(edu => 
        edu.id === editingEducation.id 
          ? { ...formData, id: editingEducation.id }
          : edu
      )
    );
    
    resetForm();
    setEditingEducation(null);
    setIsEditDialogOpen(false);
  };

  const handleDeleteEducation = (id: string) => {
    setEducations(prev => prev.filter(edu => edu.id !== id));
  };

  const handleInputChange = (field: keyof EducationEntry, value: string | boolean) => {
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

  const getEducationLevelColor = (degree: string) => {
    const level = getEducationLevel(degree);
    if (level >= 6) return 'bg-purple-100 text-purple-800';
    if (level >= 4) return 'bg-blue-100 text-blue-800';
    if (level >= 3) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-primary" />
            Education
          </h2>
          <p className="text-gray-600">Add your educational background and qualifications</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Education
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Education</DialogTitle>
            </DialogHeader>
            <EducationForm
              formData={formData}
              onInputChange={handleInputChange}
              onSave={handleAddEducation}
              onCancel={() => setIsAddDialogOpen(false)}
              degreeLevels={degreeLevels}
              fieldsOfStudy={fieldsOfStudy}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Education Timeline */}
      {educations.length > 0 ? (
        <div className="space-y-4">
          {educations.map((education, index) => (
            <Card key={education.id} className="relative">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{education.degree}</h3>
                      <Badge className={getEducationLevelColor(education.degree)}>
                        {education.degree}
                      </Badge>
                      {education.currentlyStudying && (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Current
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        <span>{education.institution}</span>
                      </div>
                      {education.fieldOfStudy && (
                        <div className="flex items-center gap-1">
                          <Award className="w-4 h-4" />
                          <span>{education.fieldOfStudy}</span>
                        </div>
                      )}
                      {education.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{education.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {formatDate(education.startDate)} - {' '}
                          {education.currentlyStudying ? 'Present' : formatDate(education.endDate)}
                        </span>
                      </div>
                    </div>

                    {education.grade && (
                      <div className="mb-3">
                        <span className="text-sm font-medium text-gray-700">Grade: </span>
                        <span className="text-sm text-gray-600">{education.grade}</span>
                      </div>
                    )}

                    {education.achievements && (
                      <div className="bg-gray-50 p-3 rounded-lg mb-3">
                        <h4 className="font-medium text-sm mb-2">Achievements:</h4>
                        <p className="text-sm text-gray-700">{education.achievements}</p>
                      </div>
                    )}

                    {education.additionalInfo && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <h4 className="font-medium text-sm mb-2">Additional Information:</h4>
                        <p className="text-sm text-gray-700">{education.additionalInfo}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditEducation(education)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteEducation(education.id)}
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
            <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No education added</h3>
            <p className="text-gray-500 mb-4">
              Add your educational background to showcase your qualifications to employers.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Education
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Education</DialogTitle>
          </DialogHeader>
          <EducationForm
            formData={formData}
            onInputChange={handleInputChange}
            onSave={handleUpdateEducation}
            onCancel={() => setIsEditDialogOpen(false)}
            degreeLevels={degreeLevels}
            fieldsOfStudy={fieldsOfStudy}
          />
        </DialogContent>
      </Dialog>

      {/* Tips */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Tips for effective education entries:</strong>
          <ul className="mt-2 list-disc list-inside space-y-1">
            <li>Start with your highest level of education</li>
            <li>Include relevant certifications and professional qualifications</li>
            <li>Mention academic achievements, honors, or awards</li>
            <li>Include relevant coursework or specializations</li>
            <li>Add any additional training or courses that are relevant to your career</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};

// Education Form Component
interface EducationFormProps {
  formData: EducationEntry;
  onInputChange: (field: keyof EducationEntry, value: string | boolean) => void;
  onSave: () => void;
  onCancel: () => void;
  degreeLevels: string[];
  fieldsOfStudy: string[];
}

const EducationForm: React.FC<EducationFormProps> = ({ 
  formData, 
  onInputChange, 
  onSave, 
  onCancel,
  degreeLevels,
  fieldsOfStudy
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.institution.trim()) {
      newErrors.institution = 'Institution name is required';
    }

    if (!formData.degree.trim()) {
      newErrors.degree = 'Degree level is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.currentlyStudying && !formData.endDate) {
      newErrors.endDate = 'End date is required if not currently studying';
    }

    if (formData.startDate && formData.endDate && !formData.currentlyStudying) {
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
          <Label htmlFor="institution">Institution Name *</Label>
          <Input
            id="institution"
            value={formData.institution}
            onChange={(e) => onInputChange('institution', e.target.value)}
            placeholder="e.g., University of Cape Town"
            className={errors.institution ? 'border-red-500' : ''}
          />
          {errors.institution && <p className="text-sm text-red-500">{errors.institution}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="degree">Degree Level *</Label>
          <Select value={formData.degree} onValueChange={(value) => onInputChange('degree', value)}>
            <SelectTrigger className={errors.degree ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select degree level" />
            </SelectTrigger>
            <SelectContent>
              {degreeLevels.map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.degree && <p className="text-sm text-red-500">{errors.degree}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="fieldOfStudy">Field of Study</Label>
          <Select value={formData.fieldOfStudy} onValueChange={(value) => onInputChange('fieldOfStudy', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select field of study" />
            </SelectTrigger>
            <SelectContent>
              {fieldsOfStudy.map((field) => (
                <SelectItem key={field} value={field}>
                  {field}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            disabled={formData.currentlyStudying}
            className={errors.endDate ? 'border-red-500' : ''}
          />
          {errors.endDate && <p className="text-sm text-red-500">{errors.endDate}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="grade">Grade / GPA</Label>
          <Input
            id="grade"
            value={formData.grade}
            onChange={(e) => onInputChange('grade', e.target.value)}
            placeholder="e.g., 85%, 3.8 GPA, Distinction"
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="currentlyStudying"
            checked={formData.currentlyStudying}
            onChange={(e) => onInputChange('currentlyStudying', e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="currentlyStudying">I am currently studying here</Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="achievements">Academic Achievements</Label>
        <Textarea
          id="achievements"
          value={formData.achievements}
          onChange={(e) => onInputChange('achievements', e.target.value)}
          placeholder="Mention any honors, awards, scholarships, or notable achievements..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="additionalInfo">Additional Information</Label>
        <Textarea
          id="additionalInfo"
          value={formData.additionalInfo}
          onChange={(e) => onInputChange('additionalInfo', e.target.value)}
          placeholder="Include relevant coursework, projects, thesis topics, or other relevant details..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save Education
        </Button>
      </div>
    </div>
  );
};

export default EducationTimeline;