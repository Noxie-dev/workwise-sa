import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Move, 
  Check, 
  X,
  Crop
} from 'lucide-react';

interface ImageCropperProps {
  imageUrl: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number; // width/height ratio, default 1 for square
  cropShape?: 'rect' | 'round';
}

const ImageCropper: React.FC<ImageCropperProps> = ({
  imageUrl,
  onCropComplete,
  onCancel,
  aspectRatio = 1,
  cropShape = 'round'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasSize = 300;
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    // Clear canvas
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Save context
    ctx.save();

    // Create clipping path
    if (cropShape === 'round') {
      ctx.beginPath();
      ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2, 0, Math.PI * 2);
      ctx.clip();
    }

    // Move to center
    ctx.translate(canvasSize / 2, canvasSize / 2);

    // Apply transformations
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.translate(position.x, position.y);

    // Draw image centered
    const imageAspect = image.naturalWidth / image.naturalHeight;
    let drawWidth, drawHeight;

    if (imageAspect > 1) {
      drawHeight = canvasSize;
      drawWidth = canvasSize * imageAspect;
    } else {
      drawWidth = canvasSize;
      drawHeight = canvasSize / imageAspect;
    }

    ctx.drawImage(
      image,
      -drawWidth / 2,
      -drawHeight / 2,
      drawWidth,
      drawHeight
    );

    // Restore context
    ctx.restore();

    // Draw crop overlay
    if (cropShape === 'rect') {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, canvasSize, canvasSize);
    } else {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2, 0, Math.PI * 2);
      ctx.stroke();
    }
  }, [scale, rotation, position, imageLoaded, cropShape]);

  React.useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleScaleChange = (value: number[]) => {
    setScale(value[0]);
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        onCropComplete(blob);
      }
    }, 'image/jpeg', 0.9);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crop className="h-5 w-5" />
          Crop Image
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hidden image for loading */}
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Source"
          className="hidden"
          onLoad={handleImageLoad}
        />

        {/* Canvas for cropping */}
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            className="border border-gray-300 rounded-lg cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {/* Scale control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Zoom</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setScale(Math.max(0.5, scale - 0.1))}
                >
                  <ZoomOut className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setScale(Math.min(3, scale + 0.1))}
                >
                  <ZoomIn className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <Slider
              value={[scale]}
              onValueChange={handleScaleChange}
              min={0.5}
              max={3}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Rotation and reset */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRotate}
              className="flex items-center gap-2"
            >
              <RotateCw className="h-3 w-3" />
              Rotate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
            >
              Reset
            </Button>
          </div>

          {/* Instructions */}
          <div className="text-xs text-gray-500 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Move className="h-3 w-3" />
              Drag to reposition
            </div>
            <p>Use zoom and rotation controls to adjust the image</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleCrop}
            className="flex-1"
          >
            <Check className="h-4 w-4 mr-2" />
            Crop Image
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImageCropper;