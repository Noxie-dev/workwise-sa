import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  X, 
  Save, 
  User, 
  Plus,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { profileService, type ProfileData } from '@/services/profileService';

interface EditableProfile extends ProfileData {
  preferences?: {
    jobTypes?: string[];
    locations?: string[];
    minSalary?: number;
    willingToRelocate?: boolean;
  };
}

interface ProfileEditModalProps {
  profile: EditableProfile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProfile: EditableProfile) => void;
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

  const handleInputChange = (
    section: 'personal' | 'skills' | 'preferences',
    field: string,
    value: string | number | boolean
  ) => {
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
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update profile. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog onOpenChange={open => !open && onClose()} open={isOpen}>
      <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto p-0">
        <DialogHeader className="border-b p-4 pr-12 text-left">
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Update personal information, skills, languages and job preferences.
          </DialogDescription>
        </DialogHeader>

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
                        aria-label={`Remove ${skill} skill`}
                        type="button"
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
                  aria-label="New skill"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill"
                  onKeyDown={e => e.key === 'Enter' && addSkill()}
                />
                <Button aria-label="Add skill" onClick={addSkill} size="sm" type="button">
                  <Plus aria-hidden="true" className="h-4 w-4" />
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
                        aria-label={`Remove ${language} language`}
                        type="button"
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
                  aria-label="New language"
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  placeholder="Add a language"
                  onKeyDown={e => e.key === 'Enter' && addLanguage()}
                />
                <Button aria-label="Add language" onClick={addLanguage} size="sm" type="button">
                  <Plus aria-hidden="true" className="h-4 w-4" />
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
                        aria-label={`Remove ${jobType} preferred job type`}
                        type="button"
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
                    aria-label="New preferred job type"
                    value={newJobType}
                    onChange={(e) => setNewJobType(e.target.value)}
                    placeholder="Add job type (e.g., Full-time, Part-time)"
                    onKeyDown={e => e.key === 'Enter' && addJobType()}
                  />
                  <Button
                    aria-label="Add preferred job type"
                    onClick={addJobType}
                    size="sm"
                    type="button"
                  >
                    <Plus aria-hidden="true" className="h-4 w-4" />
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
                        aria-label={`Remove ${location} preferred location`}
                        type="button"
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
                    aria-label="New preferred location"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Add preferred location"
                    onKeyDown={e => e.key === 'Enter' && addPreferredLocation()}
                  />
                  <Button
                    aria-label="Add preferred location"
                    onClick={addPreferredLocation}
                    size="sm"
                    type="button"
                  >
                    <Plus aria-hidden="true" className="h-4 w-4" />
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
      </DialogContent>
    </Dialog>
  );
};

export default ProfileEditModal;
