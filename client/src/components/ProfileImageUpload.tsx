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
  Crop
} from 'lucide-react';
import { fileUploadService } from '@/services/fileUploadService';
import { profileService } from '@/services/profileService';
import { updateProfile as firebaseUpdateProfile } from 'firebase/auth';
import { useAuth } from '@/contexts/AuthContext';
import ImageCropper from './ImageCropper';

interface ProfileImageUploadProps {
  currentImageUrl?: string;
  onImageUpdate: (newImageUrl: string) => void;
  className?: string;
}

const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
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
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!currentUser) {
      setError('You must be logged in to upload a profile image');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    // Create preview URL and show cropper
    const imageUrl = URL.createObjectURL(file);
    setSelectedImageUrl(imageUrl);
    setShowCropper(true);
    setError(null);
  };

  const uploadImage = async (imageBlob: Blob) => {
    if (!currentUser) return;

    setUploading(true);
    setError(null);
    setSuccess(false);
    setUploadProgress(0);

    try {
      // Convert blob to file
      const file = new File([imageBlob], 'profile-image.jpg', { type: 'image/jpeg' });

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
      const imageUrl = await fileUploadService.uploadProfileImage(file, currentUser.uid);
      
      // Update progress to 95%
      setUploadProgress(95);

      // Update profile in backend
      await profileService.updateProfile(currentUser.uid, {
        personal: { profilePicture: imageUrl },
      });

      // Update Firebase Auth photoURL
      await firebaseUpdateProfile(currentUser, { photoURL: imageUrl });

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
      setError(err.message || 'Failed to upload image');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleCropComplete = (croppedImageBlob: Blob) => {
    setShowCropper(false);
    if (selectedImageUrl) {
      URL.revokeObjectURL(selectedImageUrl);
      setSelectedImageUrl(null);
    }
    uploadImage(croppedImageBlob);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    if (selectedImageUrl) {
      URL.revokeObjectURL(selectedImageUrl);
      setSelectedImageUrl(null);
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
      {/* Current Profile Image */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white bg-gray-100 shadow-lg">
            {currentImageUrl ? (
              <img
                src={currentImageUrl}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <ImageIcon className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>
          
          {/* Upload Progress Overlay */}
          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-6 w-6 text-white animate-spin mx-auto mb-2" />
                <div className="text-white text-xs">{uploadProgress}%</div>
              </div>
            </div>
          )}

          {/* Success Indicator */}
          {success && (
            <div className="absolute inset-0 bg-green-500 bg-opacity-80 rounded-full flex items-center justify-center">
              <Check className="h-8 w-8 text-white" />
            </div>
          )}
        </div>
      </div>

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
                  <Upload className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Upload Profile Image
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Drag and drop an image here, or click to select
                </p>
                
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button
                    onClick={openFileDialog}
                    disabled={uploading}
                    className="flex items-center gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    Choose Image
                  </Button>
                </div>
              </div>

              <div className="text-xs text-gray-400">
                Supported formats: JPEG, PNG, GIF, WebP • Max size: 10MB
              </div>
            </div>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Uploading...</span>
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
              <p className="text-sm text-green-700">Profile image updated successfully!</p>
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

      {/* Image Cropper Modal */}
      {showCropper && selectedImageUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <ImageCropper
              imageUrl={selectedImageUrl}
              onCropComplete={handleCropComplete}
              onCancel={handleCropCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileImageUpload;