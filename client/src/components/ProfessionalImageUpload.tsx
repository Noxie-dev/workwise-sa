import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Camera, 
  X, 
  Check, 
  AlertCircle, 
  Image as ImageIcon,
  Loader2,
  Eye,
  Briefcase,
  Users
} from 'lucide-react';
import { fileUploadService } from '@/services/fileUploadService';
import { profileService } from '@/services/profileService';
import { useAuth } from '@/contexts/AuthContext';

interface ProfessionalImageUploadProps {
  currentImageUrl?: string;
  onImageUpdate: (newImageUrl: string) => void;
  className?: string;
}

const ProfessionalImageUpload: React.FC<ProfessionalImageUploadProps> = ({
  currentImageUrl,
  onImageUpdate,
  className = ''
}) => {
  const { currentUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!currentUser) {
      setError('You must be logged in to upload a professional image');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 15MB for professional images)
    if (file.size > 15 * 1024 * 1024) {
      setError('Image size must be less than 15MB');
      return;
    }

    uploadImage(file);
  };

  const uploadImage = async (file: File) => {
    if (!currentUser) return;

    setUploading(true);
    setError(null);
    setSuccess(false);
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

      // Upload to storage
      const imageUrl = await fileUploadService.uploadProfessionalImage(file, currentUser.uid);
      
      // Update progress to 95%
      setUploadProgress(95);

      // Update profile in backend
      await profileService.updateProfile(currentUser.uid, {
        personal: { professionalImage: imageUrl },
      });

      // Complete progress
      setUploadProgress(100);
      
      // Show success and update parent component
      setSuccess(true);
      onImageUpdate(imageUrl);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
        setUploadProgress(0);
      }, 3000);

    } catch (err: any) {
      setError(err.message || 'Failed to upload professional image');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Professional Image Preview */}
      {currentImageUrl && (
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="w-48 h-64 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100 shadow-md">
              <img
                src={currentImageUrl}
                alt="Professional"
                className="w-full h-full object-cover"
              />
            </div>
            <Badge className="absolute top-2 right-2 bg-blue-600">
              <Briefcase className="h-3 w-3 mr-1" />
              Professional
            </Badge>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <Card className={`transition-all duration-200 ${dragOver ? 'border-blue-500 bg-blue-50' : ''}`}>
        <CardContent className="p-6">
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Briefcase className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Upload Professional Image
                </h3>
                <p className="text-sm text-gray-500 mb-2">
                  Add a full professional photo for recruiters to view
                </p>
                <p className="text-xs text-gray-400 mb-4">
                  This could be a formal headshot, full-body professional photo, or workplace image
                </p>
                
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button
                    onClick={openFileDialog}
                    disabled={uploading}
                    className="flex items-center gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    {currentImageUrl ? 'Change Image' : 'Choose Image'}
                  </Button>
                </div>
              </div>

              <div className="text-xs text-gray-400">
                Supported formats: JPEG, PNG, GIF, WebP • Max size: 15MB
              </div>

              {/* Professional Image Benefits */}
              <div className="bg-blue-50 rounded-lg p-4 mt-4">
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <h4 className="text-sm font-medium text-blue-900 mb-1">
                      Why add a professional image?
                    </h4>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• Helps recruiters get a better sense of your professional presence</li>
                      <li>• Shows your attention to professional presentation</li>
                      <li>• Can include workplace context or formal attire</li>
                      <li>• Separate from your profile picture for privacy control</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Uploading professional image...</span>
                <span className="text-sm text-gray-600">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-700">{error}</p>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setError(null)}
                  className="text-red-600 p-0 h-auto"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <p className="text-sm text-green-700">Professional image updated successfully!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  );
};

export default ProfessionalImageUpload;