import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  Maximize2,
  Minimize2,
  Briefcase,
  User
} from 'lucide-react';

interface ProfessionalImageViewerProps {
  imageUrl: string;
  candidateName: string;
  onClose: () => void;
  isOpen: boolean;
}

const ProfessionalImageViewer: React.FC<ProfessionalImageViewerProps> = ({
  imageUrl,
  candidateName,
  onClose,
  isOpen
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!isOpen) return null;

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${candidateName.replace(/\s+/g, '_')}_professional_image.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const resetView = () => {
    setZoom(1);
    setRotation(0);
  };

  return (
    <Dialog onOpenChange={open => !open && onClose()} open={isOpen}>
      <DialogContent
        className={`${isFullscreen ? 'h-[100dvh] max-h-[100dvh] max-w-none rounded-none' : 'max-h-[90dvh] max-w-4xl'} flex w-[calc(100vw-2rem)] flex-col overflow-hidden p-0`}
      >
        {/* Header */}
        <DialogHeader className="flex-row items-center justify-between space-y-0 border-b bg-gray-50 p-4 pr-12 text-left">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Briefcase aria-hidden="true" className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle>Professional image</DialogTitle>
              <DialogDescription className="flex items-center gap-1">
                <User aria-hidden="true" className="h-3 w-3" />
                {candidateName}
              </DialogDescription>
            </div>
          </div>
          <Badge className="mr-2 text-xs" variant="outline">
            Recruiter view
          </Badge>
        </DialogHeader>

        {/* Controls */}
        <div className="flex items-center justify-between p-3 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <Button
              aria-label="Zoom out"
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600 min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              aria-label="Zoom in"
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 3}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            
            <div className="w-px h-6 bg-gray-300 mx-2" />
            
            <Button
              aria-label="Rotate image clockwise"
              variant="outline"
              size="sm"
              onClick={handleRotate}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            
            <Button
              aria-label={isFullscreen ? 'Exit full-screen image view' : 'Enter full-screen image view'}
              variant="outline"
              size="sm"
              onClick={resetView}
            >
              Reset
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </div>

        {/* Image Container */}
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-gray-100 p-4">
          <div className="relative max-w-full max-h-full">
            <img
              src={imageUrl}
              alt={`${candidateName}, professional portrait`}
              className="max-w-full max-h-full object-contain shadow-lg rounded-lg transition-transform duration-200"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: 'center center'
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 rounded-b-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <p>This professional image was provided by the candidate for recruiter review.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfessionalImageViewer;
