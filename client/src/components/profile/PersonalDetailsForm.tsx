import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Save
} from 'lucide-react';
import { ProfileData } from '@/services/profileService';

interface PersonalDetailsFormProps {
  profile: ProfileData | null;
  onUpdate: (data: any) => void;
}

/**
 * Personal Details Form Component
 * Handles basic personal information editing
 */
const PersonalDetailsForm: React.FC<PersonalDetailsFormProps> = ({ profile, onUpdate }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    location: '',
    idNumber: '',
    dateOfBirth: '',
    gender: '',
    bio: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValid, setIsValid] = useState(false);

  // Initialize form data from profile
  useEffect(() => {
    if (profile?.personal) {
      setFormData({
        fullName: profile.personal.fullName || '',
        phoneNumber: profile.personal.phoneNumber || '',
        location: profile.personal.location || '',
        idNumber: profile.personal.idNumber || '',
        dateOfBirth: profile.personal.dateOfBirth || '',
        gender: profile.personal.gender || '',
        bio: profile.personal.bio || '',
      });
    }
  }, [profile]);

  // Validate form data
  useEffect(() => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^[\+]?[0-9\s\-\(\)]{10,}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (formData.idNumber && !/^[0-9]{13}$/.test(formData.idNumber.replace(/\s/g, ''))) {
      newErrors.idNumber = 'ID number must be 13 digits';
    }

    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 16 || age > 100) {
        newErrors.dateOfBirth = 'Please enter a valid date of birth';
      }
    }

    setErrors(newErrors);
    setIsValid(Object.keys(newErrors).length === 0);
  }, [formData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    if (isValid) {
      onUpdate(formData);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const phoneNumber = value.replace(/\D/g, '');
    
    // Format as +27 XX XXX XXXX for South African numbers
    if (phoneNumber.length <= 2) {
      return phoneNumber;
    } else if (phoneNumber.length <= 4) {
      return `+27 ${phoneNumber.slice(2)}`;
    } else if (phoneNumber.length <= 7) {
      return `+27 ${phoneNumber.slice(2, 4)} ${phoneNumber.slice(4)}`;
    } else {
      return `+27 ${phoneNumber.slice(2, 4)} ${phoneNumber.slice(4, 7)} ${phoneNumber.slice(7, 11)}`;
    }
  };

  const formatIdNumber = (value: string) => {
    // Remove all non-numeric characters
    const idNumber = value.replace(/\D/g, '');
    
    // Format as YYMMDD GGGG AAA Z
    if (idNumber.length <= 6) {
      return idNumber;
    } else if (idNumber.length <= 10) {
      return `${idNumber.slice(0, 6)} ${idNumber.slice(6)}`;
    } else if (idNumber.length <= 13) {
      return `${idNumber.slice(0, 6)} ${idNumber.slice(6, 10)} ${idNumber.slice(10)}`;
    } else {
      return `${idNumber.slice(0, 6)} ${idNumber.slice(6, 10)} ${idNumber.slice(10, 12)} ${idNumber.slice(12, 13)}`;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name *
              </Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Enter your full name"
                className={errors.fullName ? 'border-red-500' : ''}
              />
              {errors.fullName && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.fullName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number *
              </Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', formatPhoneNumber(e.target.value))}
                placeholder="+27 XX XXX XXXX"
                className={errors.phoneNumber ? 'border-red-500' : ''}
              />
              {errors.phoneNumber && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.phoneNumber}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location *
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="City, Province"
                className={errors.location ? 'border-red-500' : ''}
              />
              {errors.location && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.location}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Gender
              </Label>
              <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="idNumber" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                ID Number
              </Label>
              <Input
                id="idNumber"
                value={formData.idNumber}
                onChange={(e) => handleInputChange('idNumber', formatIdNumber(e.target.value))}
                placeholder="YYMMDD GGGG AAA Z"
                maxLength={15}
                className={errors.idNumber ? 'border-red-500' : ''}
              />
              {errors.idNumber && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.idNumber}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Optional - Used for employment verification
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date of Birth
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                className={errors.dateOfBirth ? 'border-red-500' : ''}
              />
              {errors.dateOfBirth && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.dateOfBirth}
                </p>
              )}
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Professional Bio
            </Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Tell employers about yourself, your experience, and what makes you unique..."
              rows={4}
              maxLength={500}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">
                A compelling bio helps employers understand your value proposition
              </p>
              <p className="text-xs text-gray-400">
                {formData.bio.length}/500 characters
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={!isValid}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Personal Details
            </Button>
          </div>

          {/* Validation Status */}
          {isValid && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                All required fields are completed. Your personal details are ready to save.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PersonalDetailsForm;