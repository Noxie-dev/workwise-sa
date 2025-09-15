import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Save, 
  User, 
  Phone, 
  MapPin, 
  FileText,
  Plus,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { profileService } from '@/services/profileService';

interface ProfileEditModalProps {
  profile: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProfile: any) => void;
  userId: string;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  profile,
  isOpen,
  onClose,
  onSave,
  userId
}) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    personal: {
      fullName: profile?.personal?.fullName || '',
      phoneNumber: profile?.personal?.phoneNumber || '',
      location: profile?.personal?.location || '',
      bio: profile?.personal?.bio || '',
    },
    skills: {
      skills: profile?.skills?.skills || [],
      languages: profile?.skills?.languages || [],
    },
    preferences: {
      jobTypes: profile?.preferences?.jobTypes || [],
      locations: profile?.preferences?.locations || [],
      minSalary: profile?.preferences?.minSalary || 0,
      willingToRelocate: profile?.preferences?.willingToRelocate || false,
    }
  });

  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newJobType, setNewJobType] = useState('');
  const [newLocation, setNewLocation] = useState('');

  if (!isOpen) return null;

  const handleInputChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: {
          ...prev.skills,
          skills: [...prev.skills.skills, newSkill.trim()]
        }
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        skills: prev.skills.skills.filter(s => s !== skill)
      }
    }));
  };

  const addLanguage = () => {
    if (newLanguage.trim() && !formData.skills.languages.includes(newLanguage.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: {
          ...prev.skills,
          languages: [...prev.skills.languages, newLanguage.trim()]
        }
      }));
      setNewLanguage('');
    }
  };

  const removeLanguage = (language: string) => {
    setFormData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        languages: prev.skills.languages.filter(l => l !== language)
      }
    }));
  };

  const addJobType = () => {
    if (newJobType.trim() && !formData.preferences.jobTypes.includes(newJobType.trim())) {
      setFormData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          jobTypes: [...prev.preferences.jobTypes, newJobType.trim()]
        }
      }));
      setNewJobType('');
    }
  };

  const removeJobType = (jobType: string) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        jobTypes: prev.preferences.jobTypes.filter(jt => jt !== jobType)
      }
    }));
  };

  const addPreferredLocation = () => {
    if (newLocation.trim() && !formData.preferences.locations.includes(newLocation.trim())) {
      setFormData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          locations: [...prev.preferences.locations, newLocation.trim()]
        }
      }));
      setNewLocation('');
    }
  };

  const removePreferredLocation = (location: string) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        locations: prev.preferences.locations.filter(l => l !== location)
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await profileService.updateProfile(userId, formData);
      
      const updatedProfile = {
        ...profile,
        ...formData
      };
      
      onSave(updatedProfile);
      onClose();
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Edit Profile</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.personal.fullName}
                  onChange={(e) => handleInputChange('personal', 'fullName', e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={formData.personal.phoneNumber}
                  onChange={(e) => handleInputChange('personal', 'phoneNumber', e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.personal.location}
                  onChange={(e) => handleInputChange('personal', 'location', e.target.value)}
                  placeholder="Enter your location"
                />
              </div>
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.personal.bio}
                  onChange={(e) => handleInputChange('personal', 'bio', e.target.value)}
                  placeholder="Tell us about yourself"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Current Skills</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.skills.skills.map((skill, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      {skill}
                      <button
                        onClick={() => removeSkill(skill)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill"
                  onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                />
                <Button onClick={addSkill} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Languages */}
          <Card>
            <CardHeader>
              <CardTitle>Languages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Languages You Speak</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.skills.languages.map((language, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      {language}
                      <button
                        onClick={() => removeLanguage(language)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  placeholder="Add a language"
                  onKeyPress={(e) => e.key === 'Enter' && addLanguage()}
                />
                <Button onClick={addLanguage} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Job Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Job Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Preferred Job Types</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.preferences.jobTypes.map((jobType, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      {jobType}
                      <button
                        onClick={() => removeJobType(jobType)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newJobType}
                    onChange={(e) => setNewJobType(e.target.value)}
                    placeholder="Add job type (e.g., Full-time, Part-time)"
                    onKeyPress={(e) => e.key === 'Enter' && addJobType()}
                  />
                  <Button onClick={addJobType} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label>Preferred Locations</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.preferences.locations.map((location, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      {location}
                      <button
                        onClick={() => removePreferredLocation(location)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Add preferred location"
                    onKeyPress={(e) => e.key === 'Enter' && addPreferredLocation()}
                  />
                  <Button onClick={addPreferredLocation} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="minSalary">Minimum Salary (R)</Label>
                <Input
                  id="minSalary"
                  type="number"
                  value={formData.preferences.minSalary}
                  onChange={(e) => handleInputChange('preferences', 'minSalary', parseInt(e.target.value) || 0)}
                  placeholder="Enter minimum salary"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="willingToRelocate"
                  checked={formData.preferences.willingToRelocate}
                  onChange={(e) => handleInputChange('preferences', 'willingToRelocate', e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="willingToRelocate">Willing to relocate for work</Label>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="p-4 border-t flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditModal;