import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Eye,
  Volume2,
  Smartphone,
  Accessibility,
  Type,
  Palette,
  MousePointer,
  BookOpen,
  RotateCcw,
  Check,
  Info,
} from 'lucide-react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { toast } from '@/hooks/use-toast';

interface AccessibilitySettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AccessibilitySettingsModal({
  open,
  onOpenChange,
}: AccessibilitySettingsModalProps) {
  const { settings, updateSetting, resetSettings } = useAccessibility();
  const [activeTab, setActiveTab] = useState('visual');

  const handleReset = () => {
    resetSettings();
    toast({
      title: 'Settings Reset',
      description: 'All accessibility settings have been reset to defaults.',
    });
  };

  const announceChange = (message: string) => {
    if (settings.ariaAnnouncements) {
      // Create a live region announcement
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = message;
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 1000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            User Empowerment Dashboard
          </DialogTitle>
          <DialogDescription>
            Customize your WorkWise experience with accessibility and preference settings.
            All changes are saved automatically.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="visual" className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Visual</span>
            </TabsTrigger>
            <TabsTrigger value="interaction" className="flex items-center gap-1">
              <MousePointer className="h-4 w-4" />
              <span className="hidden sm:inline">Interaction</span>
            </TabsTrigger>
            <TabsTrigger value="media" className="flex items-center gap-1">
              <Volume2 className="h-4 w-4" />
              <span className="hidden sm:inline">Media</span>
            </TabsTrigger>
            <TabsTrigger value="mobile" className="flex items-center gap-1">
              <Smartphone className="h-4 w-4" />
              <span className="hidden sm:inline">Mobile</span>
            </TabsTrigger>
            <TabsTrigger value="reading" className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Reading</span>
            </TabsTrigger>
          </TabsList>

          {/* Visual & Text Settings */}
          <TabsContent value="visual" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="h-5 w-5" />
                  Text & Typography
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base font-medium">Font Size</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    {(['small', 'medium', 'large', 'extra-large'] as const).map((size) => (
                      <Button
                        key={size}
                        variant={settings.fontSize === size ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          updateSetting('fontSize', size);
                          announceChange(`Font size changed to ${size}`);
                        }}
                        className="capitalize"
                      >
                        {size.replace('-', ' ')}
                      </Button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Preview: <span style={{ fontSize: settings.fontSize === 'small' ? '14px' : settings.fontSize === 'large' ? '18px' : settings.fontSize === 'extra-large' ? '20px' : '16px' }}>
                      This is how text will appear
                    </span>
                  </p>
                </div>

                <Separator />

                <div>
                  <Label className="text-base font-medium">Line Spacing</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {(['normal', 'looser'] as const).map((spacing) => (
                      <Button
                        key={spacing}
                        variant={settings.lineSpacing === spacing ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          updateSetting('lineSpacing', spacing);
                          announceChange(`Line spacing changed to ${spacing}`);
                        }}
                        className="capitalize"
                      >
                        {spacing}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Color & Contrast
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Color Theme</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                    {(['light', 'dark', 'high-contrast'] as const).map((theme) => (
                      <Button
                        key={theme}
                        variant={settings.colorTheme === theme ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          updateSetting('colorTheme', theme);
                          announceChange(`Color theme changed to ${theme.replace('-', ' ')}`);
                        }}
                        className="capitalize"
                      >
                        {theme.replace('-', ' ')}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Enhanced Focus Outlines</Label>
                    <p className="text-sm text-gray-500">
                      Stronger visual indicators for keyboard navigation
                    </p>
                  </div>
                  <Switch
                    checked={settings.enhancedFocusOutlines}
                    onCheckedChange={(checked) => {
                      updateSetting('enhancedFocusOutlines', checked);
                      announceChange(`Enhanced focus outlines ${checked ? 'enabled' : 'disabled'}`);
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Interaction & Navigation */}
          <TabsContent value="interaction" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MousePointer className="h-5 w-5" />
                  Navigation & Input
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Reduce Motion</Label>
                    <p className="text-sm text-gray-500">
                      Minimize animations and transitions
                    </p>
                  </div>
                  <Switch
                    checked={settings.reduceMotion}
                    onCheckedChange={(checked) => {
                      updateSetting('reduceMotion', checked);
                      announceChange(`Motion reduction ${checked ? 'enabled' : 'disabled'}`);
                    }}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Expanded Tap Targets</Label>
                    <p className="text-sm text-gray-500">
                      Larger buttons and clickable areas for easier interaction
                    </p>
                  </div>
                  <Switch
                    checked={settings.expandedTapTargets}
                    onCheckedChange={(checked) => {
                      updateSetting('expandedTapTargets', checked);
                      announceChange(`Expanded tap targets ${checked ? 'enabled' : 'disabled'}`);
                    }}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Simplified UI Mode</Label>
                    <p className="text-sm text-gray-500">
                      Minimal distractions with essential elements only
                    </p>
                  </div>
                  <Switch
                    checked={settings.simplifiedUI}
                    onCheckedChange={(checked) => {
                      updateSetting('simplifiedUI', checked);
                      announceChange(`Simplified UI ${checked ? 'enabled' : 'disabled'}`);
                    }}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">ARIA Announcements</Label>
                    <p className="text-sm text-gray-500">
                      Screen reader friendly status updates
                    </p>
                  </div>
                  <Switch
                    checked={settings.ariaAnnouncements}
                    onCheckedChange={(checked) => {
                      updateSetting('ariaAnnouncements', checked);
                      if (checked) {
                        announceChange('ARIA announcements enabled');
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Media Controls */}
          <TabsContent value="media" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5" />
                  Media & Audio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Auto-play Media</Label>
                    <p className="text-sm text-gray-500">
                      Automatically play videos and audio content
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoPlayMedia}
                    onCheckedChange={(checked) => {
                      updateSetting('autoPlayMedia', checked);
                      announceChange(`Auto-play media ${checked ? 'enabled' : 'disabled'}`);
                    }}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Captions & Transcripts</Label>
                    <p className="text-sm text-gray-500">
                      Show captions for video and audio content
                    </p>
                  </div>
                  <Switch
                    checked={settings.captionsEnabled}
                    onCheckedChange={(checked) => {
                      updateSetting('captionsEnabled', checked);
                      announceChange(`Captions ${checked ? 'enabled' : 'disabled'}`);
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mobile-Specific */}
          <TabsContent value="mobile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Mobile Experience
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">One-Handed Mode</Label>
                    <p className="text-sm text-gray-500">
                      Optimize layout for single-thumb navigation
                    </p>
                  </div>
                  <Switch
                    checked={settings.oneHandedMode}
                    onCheckedChange={(checked) => {
                      updateSetting('oneHandedMode', checked);
                      announceChange(`One-handed mode ${checked ? 'enabled' : 'disabled'}`);
                    }}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Gesture Alternatives</Label>
                    <p className="text-sm text-gray-500">
                      Provide button alternatives to complex gestures
                    </p>
                  </div>
                  <Switch
                    checked={settings.gestureAlternatives}
                    onCheckedChange={(checked) => {
                      updateSetting('gestureAlternatives', checked);
                      announceChange(`Gesture alternatives ${checked ? 'enabled' : 'disabled'}`);
                    }}
                  />
                </div>

                <Separator />

                <div>
                  <Label className="text-base font-medium">Orientation Lock</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                    {(['none', 'portrait', 'landscape'] as const).map((orientation) => (
                      <Button
                        key={orientation}
                        variant={settings.orientationLock === orientation ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          updateSetting('orientationLock', orientation);
                          announceChange(`Orientation lock set to ${orientation}`);
                        }}
                        className="capitalize"
                      >
                        {orientation}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reading Enhancements */}
          <TabsContent value="reading" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Reading & Comprehension
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Reading Mode</Label>
                    <p className="text-sm text-gray-500">
                      Distraction-free reading with enhanced readability
                    </p>
                  </div>
                  <Switch
                    checked={settings.readingMode}
                    onCheckedChange={(checked) => {
                      updateSetting('readingMode', checked);
                      announceChange(`Reading mode ${checked ? 'enabled' : 'disabled'}`);
                    }}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Text-to-Speech</Label>
                      <p className="text-sm text-gray-500">
                        Read content aloud with customizable voice settings
                      </p>
                    </div>
                    <Switch
                      checked={settings.textToSpeech.enabled}
                      onCheckedChange={(checked) => {
                        updateSetting('textToSpeech', { ...settings.textToSpeech, enabled: checked });
                        announceChange(`Text-to-speech ${checked ? 'enabled' : 'disabled'}`);
                      }}
                    />
                  </div>

                  {settings.textToSpeech.enabled && (
                    <div className="ml-4 space-y-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <Label className="text-sm font-medium">Speech Speed</Label>
                        <div className="mt-2">
                          <Slider
                            value={[settings.textToSpeech.speed]}
                            onValueChange={([value]) => {
                              updateSetting('textToSpeech', { ...settings.textToSpeech, speed: value });
                            }}
                            min={0.5}
                            max={2.0}
                            step={0.1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Slow (0.5x)</span>
                            <span>Normal (1.0x)</span>
                            <span>Fast (2.0x)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-gray-600">
              Settings are saved automatically and sync across devices
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset All
            </Button>
            <Button onClick={() => onOpenChange(false)}>
              <Check className="h-4 w-4 mr-2" />
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}