import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { RotateCw, ZoomIn, ZoomOut, Move, Crop } from 'lucide-react';

interface ImageCropperProps {
  imageUrl: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number; // width/height ratio, default 1 for square
}

const ImageCropper: React.FC<ImageCropperProps> = ({
  imageUrl,
  onCropComplete,
  onCancel,
  aspectRatio = 1
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const size = 300;
    canvas.width = size;
    canvas.height = size;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Save context
    ctx.save();

    // Move to center
    ctx.translate(size / 2, size / 2);

    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // Apply scale
    ctx.scale(scale, scale);

    // Apply position
    ctx.translate(position.x, position.y);

    // Draw image centered
    const imageAspect = image.naturalWidth / image.naturalHeight;
    let drawWidth = size;
    let drawHeight = size;

    if (imageAspect > 1) {
      drawHeight = size / imageAspect;
    } else {
      drawWidth = size * imageAspect;
    }

    ctx.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

    // Restore context
    ctx.restore();

    // Draw crop overlay
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    const cropSize = Math.min(size * 0.8, size * 0.8);
    const cropX = (size - cropSize) / 2;
    const cropY = (size - cropSize) / 2;
    
    ctx.strokeRect(cropX, cropY, cropSize, cropSize);
  }, [scale, rotation, position]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
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

  const handleCrop = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    // Create a new canvas for the cropped image
    const cropCanvas = document.createElement('canvas');
    const cropSize = 300;
    cropCanvas.width = cropSize;
    cropCanvas.height = cropSize;
    const cropCtx = cropCanvas.getContext('2d');
    if (!cropCtx) return;

    // Draw the cropped portion
    const sourceSize = Math.min(canvas.width * 0.8, canvas.height * 0.8);
    const sourceX = (canvas.width - sourceSize) / 2;
    const sourceY = (canvas.height - sourceSize) / 2;

    cropCtx.drawImage(
      canvas,
      sourceX, sourceY, sourceSize, sourceSize,
      0, 0, cropSize, cropSize
    );

    // Convert to blob
    cropCanvas.toBlob((blob) => {
      if (blob) {
        onCropComplete(blob);
      }
    }, 'image/jpeg', 0.9);
  };

  React.useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-medium mb-2">Crop Your Image</h3>
            <p className="text-sm text-gray-500">
              Adjust the image position, scale, and rotation to fit the crop area
            </p>
          </div>

          {/* Canvas for image preview */}
          <div className="flex justify-center">
            <div className="relative">
              <canvas
                ref={canvasRef}
                className="border border-gray-300 rounded-lg cursor-move"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Crop preview"
                className="hidden"
                onLoad={drawCanvas}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Scale Control */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <ZoomIn className="h-4 w-4" />
                  Scale
                </label>
                <span className="text-sm text-gray-500">{Math.round(scale * 100)}%</span>
              </div>
              <Slider
                value={[scale]}
                onValueChange={(value) => setScale(value[0])}
                min={0.5}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Rotation Control */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <RotateCw className="h-4 w-4" />
                  Rotation
                </label>
                <span className="text-sm text-gray-500">{rotation}°</span>
              </div>
              <Slider
                value={[rotation]}
                onValueChange={(value) => setRotation(value[0])}
                min={-180}
                max={180}
                step={15}
                className="w-full"
              />
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setScale(1)}
              >
                Reset Scale
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRotation(0)}
              >
                Reset Rotation
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPosition({ x: 0, y: 0 })}
              >
                Center
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleCrop} className="flex items-center gap-2">
              <Crop className="h-4 w-4" />
              Crop & Save
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImageCropper;