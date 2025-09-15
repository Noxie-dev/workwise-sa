import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";

interface ImageUploaderProps {
  label: string;
  type: "profile" | "professional";
  onUploadComplete?: (imageData: any) => void;
}

interface ImageData {
  status: "processing" | "ready" | "failed";
  originalUrl?: string;
  thumbnailUrl?: string;
  optimizedUrl?: string;
  cloudflareImageId?: string;
}

export default function ImageUploader({ label, type, onUploadComplete }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load existing image on component mount
  useEffect(() => {
    loadExistingImage();
  }, [type]);

  const loadExistingImage = async () => {
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      
      if (!token) return;

      const response = await fetch(`/.netlify/functions/getUserImages?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success && data.images[type]) {
        setImageData(data.images[type]);
        
        // If image is ready, show thumbnail as preview
        if (data.images[type].status === "ready" && data.images[type].thumbnailUrl) {
          setPreview(data.images[type].thumbnailUrl);
        }
      }
    } catch (err) {
      console.error("Failed to load existing image:", err);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPEG, PNG, and WebP files are allowed");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setError(null);
    setUploading(true);
    
    // Create preview immediately
    setPreview(URL.createObjectURL(file));

    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      
      if (!token) {
        throw new Error("Authentication required");
      }

      // Get signed upload URL
      const uploadResponse = await fetch("/.netlify/functions/generateUploadUrl", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type }),
      });

      const uploadData = await uploadResponse.json();
      
      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || "Failed to generate upload URL");
      }

      // Upload directly to Cloudflare Images
      const formData = new FormData();
      formData.append("file", file);

      const cloudflareResponse = await fetch(uploadData.uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!cloudflareResponse.ok) {
        throw new Error("Upload to Cloudflare failed");
      }

      // Set initial processing state
      const newImageData: ImageData = {
        status: "processing",
        cloudflareImageId: uploadData.imageId,
      };
      
      setImageData(newImageData);
      onUploadComplete?.(newImageData);

      // Poll for processing completion (webhook should update DB)
      pollForProcessing(uploadData.imageId);

    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Upload failed");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const pollForProcessing = async (imageId: string) => {
    const maxAttempts = 30; // 30 seconds max
    let attempts = 0;

    const poll = async () => {
      try {
        const auth = getAuth();
        const token = await auth.currentUser?.getIdToken();
        
        if (!token) return;

        const response = await fetch(`/.netlify/functions/getUserImages?type=${type}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = await response.json();
        
        if (data.success && data.images[type] && data.images[type].status === "ready") {
          setImageData(data.images[type]);
          setPreview(data.images[type].thumbnailUrl);
          onUploadComplete?.(data.images[type]);
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 1000); // Poll every second
        } else {
          setError("Image processing timed out. Please refresh the page.");
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    // Start polling after a brief delay
    setTimeout(poll, 2000);
  };

  const getDisplayImage = () => {
    if (imageData?.status === "ready" && imageData.thumbnailUrl) {
      return imageData.thumbnailUrl;
    }
    return preview;
  };

  const getStatusMessage = () => {
    if (uploading) return "Uploading...";
    if (imageData?.status === "processing") return "Processing image...";
    if (imageData?.status === "ready") return "Image ready!";
    if (error) return error;
    return "";
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="font-semibold">{label}</label>
      
      {/* Preview */}
      {getDisplayImage() && (
        <div className="relative">
          <img 
            src={getDisplayImage()!} 
            alt="Preview" 
            className={`w-32 h-32 object-cover rounded-full ${
              imageData?.status === "processing" ? "opacity-50" : ""
            }`}
          />
          {imageData?.status === "processing" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>
      )}

      {/* File Input */}
      <input 
        type="file" 
        accept="image/jpeg,image/png,image/webp" 
        onChange={handleFileChange}
        disabled={uploading}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />

      {/* Status Message */}
      {getStatusMessage() && (
        <div className={`text-sm ${error ? "text-red-600" : "text-gray-600"}`}>
          {getStatusMessage()}
        </div>
      )}

      {/* Image URLs for debugging/testing */}
      {process.env.NODE_ENV === "development" && imageData?.status === "ready" && (
        <details className="text-xs text-gray-500">
          <summary>Debug URLs</summary>
          <div>Original: {imageData.originalUrl}</div>
          <div>Thumbnail: {imageData.thumbnailUrl}</div>
          <div>Optimized: {imageData.optimizedUrl}</div>
        </details>
      )}
    </div>
  );
}
