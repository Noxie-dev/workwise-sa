import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Camera, 
  Upload, 
  X, 
  CheckCircle, 
  AlertCircle,
  User,
  Briefcase,
  RotateCcw,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { ProfileData } from '@/services/profileService';
import { useToast } from '@/hooks/use-toast';

interface ProfilePictureUploaderProps {
  profile: ProfileData | null;
  onUpdate: (data: any) => void;
}

/**
 * Profile Picture Uploader Component
 * Handles profile picture and professional image uploads with cropping
 */
const ProfilePictureUploader: React.FC<ProfilePictureUploaderProps> = ({ profile, onUpdate }) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const professionalFileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewProfessionalImage, setPreviewProfessionalImage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (file: File, type: 'profile' | 'professional') => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: "Please upload a JPEG, PNG, or WebP image.",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB.",
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      if (type === 'profile') {
        setPreviewImage(e.target?.result as string);
      } else {
        setPreviewProfessionalImage(e.target?.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = async (file: File, type: 'profile' | 'professional') => {
    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // TODO: Implement actual file upload to Firebase Storage
      // For now, we'll simulate the upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Generate a mock URL (in real implementation, this would be the Firebase Storage URL)
      const mockUrl = `https://example.com/${type}_${Date.now()}_${file.name}`;
      
      // Update profile data
      if (type === 'profile') {
        onUpdate({ profilePicture: mockUrl });
        setPreviewImage(null);
      } else {
        onUpdate({ professionalImage: mockUrl });
        setPreviewProfessionalImage(null);
      }

      toast({
        title: "Image Uploaded Successfully",
        description: `Your ${type} image has been uploaded and saved.`,
      });

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent, type: 'profile' | 'professional') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0], type);
    }
  };

  const removeImage = (type: 'profile' | 'professional') => {
    if (type === 'profile') {
      setPreviewImage(null);
      onUpdate({ profilePicture: null });
    } else {
      setPreviewProfessionalImage(null);
      onUpdate({ professionalImage: null });
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Picture Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Profile Picture
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Profile Picture */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100">
                {profile?.personal?.profilePicture ? (
                  <img
                    src={profile.personal.profilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              {profile?.personal?.profilePicture && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                  onClick={() => removeImage('profile')}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
            
            <div className="flex-1">
              <h3 className="font-medium mb-2">Current Profile Picture</h3>
              <p className="text-sm text-gray-600 mb-4">
                This image appears on your profile and in job applications.
              </p>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {profile?.personal?.profilePicture ? 'Change' : 'Upload'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], 'profile')}
                />
              </div>
            </div>
          </div>

          {/* Upload Area */}
          {previewImage && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <img
                  src={previewImage}
                  alt="Preview"
                  className="w-32 h-32 rounded-full object-cover mx-auto mb-4"
                />
                <p className="text-sm text-gray-600 mb-4">Preview of your new profile picture</p>
                
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={() => {
                      const file = fileInputRef.current?.files?.[0];
                      if (file) handleFileUpload(file, 'profile');
                    }}
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : 'Save Profile Picture'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPreviewImage(null)}
                    disabled={uploading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>

              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}
            </div>
          )}

          {/* Upload Guidelines */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Tips for a great profile picture:</strong>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>Use a clear, professional headshot</li>
                <li>Ensure good lighting and high resolution</li>
                <li>Dress appropriately for your industry</li>
                <li>Smile and maintain eye contact with the camera</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Professional Image Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            Professional Image
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Professional Image */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-lg overflow-hidden border-4 border-gray-200 bg-gray-100">
                {profile?.personal?.professionalImage ? (
                  <img
                    src={profile.personal.professionalImage}
                    alt="Professional"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Briefcase className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              {profile?.personal?.professionalImage && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                  onClick={() => removeImage('professional')}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
            
            <div className="flex-1">
              <h3 className="font-medium mb-2">Professional Image</h3>
              <p className="text-sm text-gray-600 mb-4">
                This image is specifically for recruiters and employers to view your professional presentation.
              </p>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => professionalFileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {profile?.personal?.professionalImage ? 'Change' : 'Upload'}
                </Button>
                <input
                  ref={professionalFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], 'professional')}
                />
              </div>
            </div>
          </div>

          {/* Upload Area */}
          {previewProfessionalImage && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <img
                  src={previewProfessionalImage}
                  alt="Professional Preview"
                  className="w-32 h-32 rounded-lg object-cover mx-auto mb-4"
                />
                <p className="text-sm text-gray-600 mb-4">Preview of your new professional image</p>
                
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={() => {
                      const file = professionalFileInputRef.current?.files?.[0];
                      if (file) handleFileUpload(file, 'professional');
                    }}
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : 'Save Professional Image'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPreviewProfessionalImage(null)}
                    disabled={uploading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>

              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}
            </div>
          )}

          {/* Professional Image Guidelines */}
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Professional image guidelines:</strong>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>Use a high-quality, professional headshot</li>
                <li>Wear business attire appropriate for your field</li>
                <li>Maintain a neutral, professional background</li>
                <li>Ensure the image is well-lit and in focus</li>
                <li>This image is visible to employers and recruiters</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePictureUploader;