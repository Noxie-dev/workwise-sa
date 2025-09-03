import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Star, 
  Plus, 
  X, 
  CheckCircle, 
  AlertCircle,
  Languages,
  Car,
  FileText,
  Lightbulb
} from 'lucide-react';
import { ProfileData } from '@/services/profileService';

interface SkillsManagerProps {
  profile: ProfileData | null;
  onUpdate: (data: any) => void;
}

/**
 * Skills Manager Component
 * Handles skills, languages, and other professional attributes
 */
const SkillsManager: React.FC<SkillsManagerProps> = ({ profile, onUpdate }) => {
  const [skills, setSkills] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [hasDriversLicense, setHasDriversLicense] = useState(false);
  const [hasTransport, setHasTransport] = useState(false);

  // Common skills suggestions
  const skillSuggestions = [
    'Communication', 'Leadership', 'Problem Solving', 'Teamwork', 'Time Management',
    'Microsoft Office', 'Project Management', 'Customer Service', 'Sales', 'Marketing',
    'JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'HTML/CSS', 'Git',
    'Data Analysis', 'Excel', 'PowerPoint', 'Photoshop', 'Illustrator',
    'Accounting', 'Bookkeeping', 'QuickBooks', 'SAP', 'Salesforce',
    'Teaching', 'Training', 'Public Speaking', 'Writing', 'Research',
    'Mechanical', 'Electrical', 'Plumbing', 'Carpentry', 'Welding',
    'Nursing', 'Healthcare', 'First Aid', 'CPR', 'Medical Terminology'
  ];

  // Common languages
  const languageOptions = [
    'English', 'Afrikaans', 'Zulu', 'Xhosa', 'Sotho', 'Tswana', 'Venda', 'Tsonga',
    'Swati', 'Ndebele', 'French', 'German', 'Spanish', 'Portuguese', 'Italian',
    'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Other'
  ];

  // Initialize data from profile
  useEffect(() => {
    if (profile?.skills) {
      setSkills(profile.skills.skills || []);
      setLanguages(profile.skills.languages || []);
      setHasDriversLicense(profile.skills.hasDriversLicense || false);
      setHasTransport(profile.skills.hasTransport || false);
    }
  }, [profile]);

  // Update profile when data changes
  useEffect(() => {
    onUpdate({
      skills,
      languages,
      hasDriversLicense,
      hasTransport
    });
  }, [skills, languages, hasDriversLicense, hasTransport, onUpdate]);

  const addSkill = () => {
    const skill = newSkill.trim();
    if (skill && !skills.includes(skill)) {
      setSkills(prev => [...prev, skill]);
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(prev => prev.filter(skill => skill !== skillToRemove));
  };

  const addLanguage = () => {
    const language = newLanguage.trim();
    if (language && !languages.includes(language)) {
      setLanguages(prev => [...prev, language]);
      setNewLanguage('');
    }
  };

  const removeLanguage = (languageToRemove: string) => {
    setLanguages(prev => prev.filter(lang => lang !== languageToRemove));
  };

  const addSuggestedSkill = (skill: string) => {
    if (!skills.includes(skill)) {
      setSkills(prev => [...prev, skill]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, type: 'skill' | 'language') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (type === 'skill') {
        addSkill();
      } else {
        addLanguage();
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Skills Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            Professional Skills
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Skills */}
          <div className="space-y-4">
            <Label>Your Skills ({skills.length})</Label>
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1 px-3 py-1"
                  >
                    {skill}
                    <button
                      onClick={() => removeSkill(skill)}
                      className="ml-1 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No skills added yet. Add some skills to showcase your abilities.</p>
            )}
          </div>

          {/* Add New Skill */}
          <div className="space-y-4">
            <Label htmlFor="newSkill">Add New Skill</Label>
            <div className="flex gap-2">
              <Input
                id="newSkill"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Enter a skill (e.g., JavaScript, Project Management)"
                onKeyPress={(e) => handleKeyPress(e, 'skill')}
                className="flex-1"
              />
              <Button onClick={addSkill} disabled={!newSkill.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Skill Suggestions */}
          <div className="space-y-4">
            <Label>Popular Skills</Label>
            <div className="flex flex-wrap gap-2">
              {skillSuggestions
                .filter(skill => !skills.includes(skill))
                .slice(0, 12)
                .map((skill, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => addSuggestedSkill(skill)}
                    className="text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {skill}
                  </Button>
                ))}
            </div>
          </div>

          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              <strong>Tips for effective skills:</strong>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>Include both technical and soft skills</li>
                <li>Be specific (e.g., "React" instead of "Programming")</li>
                <li>Add skills relevant to your target jobs</li>
                <li>Update your skills regularly as you learn new things</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Languages Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="w-5 h-5 text-primary" />
            Languages
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Languages */}
          <div className="space-y-4">
            <Label>Languages You Speak ({languages.length})</Label>
            {languages.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {languages.map((language, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="flex items-center gap-1 px-3 py-1"
                  >
                    {language}
                    <button
                      onClick={() => removeLanguage(language)}
                      className="ml-1 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No languages added yet. Add the languages you speak.</p>
            )}
          </div>

          {/* Add New Language */}
          <div className="space-y-4">
            <Label htmlFor="newLanguage">Add Language</Label>
            <div className="flex gap-2">
              <Select value={newLanguage} onValueChange={setNewLanguage}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a language" />
                </SelectTrigger>
                <SelectContent>
                  {languageOptions.map((language) => (
                    <SelectItem key={language} value={language}>
                      {language}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={addLanguage} disabled={!newLanguage.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Being multilingual is a valuable skill in South Africa's diverse job market. 
              Include all languages you can speak, read, or write in.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Additional Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Driver's License */}
          <div className="flex items-center space-x-3">
            <Checkbox
              id="driversLicense"
              checked={hasDriversLicense}
              onCheckedChange={(checked) => setHasDriversLicense(checked as boolean)}
            />
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4" />
              <Label htmlFor="driversLicense" className="text-sm font-medium">
                I have a valid driver's license
              </Label>
            </div>
          </div>

          {/* Transport */}
          <div className="flex items-center space-x-3">
            <Checkbox
              id="transport"
              checked={hasTransport}
              onCheckedChange={(checked) => setHasTransport(checked as boolean)}
            />
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4" />
              <Label htmlFor="transport" className="text-sm font-medium">
                I have reliable transport
              </Label>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              These details help employers understand your mobility and availability for work.
              Many jobs require reliable transport or a driver's license.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Skills Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            Skills Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{skills.length}</div>
              <div className="text-sm text-blue-800">Professional Skills</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{languages.length}</div>
              <div className="text-sm text-green-800">Languages</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {(hasDriversLicense ? 1 : 0) + (hasTransport ? 1 : 0)}
              </div>
              <div className="text-sm text-purple-800">Transport Options</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SkillsManager;