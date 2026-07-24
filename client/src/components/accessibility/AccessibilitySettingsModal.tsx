import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Palette, RotateCcw, Settings, Type } from 'lucide-react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import {
  ColorThemePreference,
  FontSizePreference,
  LineSpacingPreference,
  MotionPreference,
} from '@/types/accessibility';

interface AccessibilitySettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Choice<T extends string> {
  value: T;
  label: string;
}

const FONT_SIZE_CHOICES: Choice<FontSizePreference>[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Default' },
  { value: 'large', label: 'Large' },
  { value: 'extra-large', label: 'Extra large' },
];

const LINE_SPACING_CHOICES: Choice<LineSpacingPreference>[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'looser', label: 'Looser' },
];

const THEME_CHOICES: Choice<ColorThemePreference>[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'high-contrast', label: 'High contrast' },
];

const MOTION_CHOICES: Choice<MotionPreference>[] = [
  { value: 'system', label: 'Use system setting' },
  { value: 'reduce', label: 'Reduce motion' },
  { value: 'allow', label: 'Allow motion' },
];

interface ChoiceGroupProps<T extends string> {
  label: string;
  value: T;
  choices: Choice<T>[];
  columns?: string;
  onChange: (value: T, label: string) => void;
}

const ChoiceGroup = <T extends string>({
  label,
  value,
  choices,
  columns = 'sm:grid-cols-2',
  onChange,
}: ChoiceGroupProps<T>) => (
  <div>
    <p className="text-base font-medium" id={`${label.replace(/\s+/g, '-').toLowerCase()}-label`}>
      {label}
    </p>
    <div
      aria-labelledby={`${label.replace(/\s+/g, '-').toLowerCase()}-label`}
      className={`mt-2 grid grid-cols-1 gap-2 ${columns}`}
      role="radiogroup"
    >
      {choices.map(choice => (
        <Button
          aria-checked={value === choice.value}
          className="min-h-11 whitespace-normal"
          key={choice.value}
          onClick={() => onChange(choice.value, choice.label)}
          role="radio"
          type="button"
          variant={value === choice.value ? 'default' : 'outline'}
        >
          {choice.label}
        </Button>
      ))}
    </div>
  </div>
);

const AccessibilitySettingsModal = ({ open, onOpenChange }: AccessibilitySettingsModalProps) => {
  const { settings, updateSetting, resetSettings } = useAccessibility();
  const [announcement, setAnnouncement] = useState('');

  const updateWithAnnouncement = <K extends keyof typeof settings>(
    key: K,
    value: (typeof settings)[K],
    message: string
  ) => {
    updateSetting(key, value);
    setAnnouncement(message);
  };

  const handleReset = () => {
    resetSettings();
    setAnnouncement('Accessibility preferences reset to defaults');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-3xl overflow-y-auto p-4 sm:p-6"
        id="accessibility-settings"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings aria-hidden="true" className="h-5 w-5" />
            Accessibility preferences
          </DialogTitle>
          <DialogDescription>
            Personalise text, contrast, motion and interaction settings. Preferences are stored only
            on this device.
          </DialogDescription>
        </DialogHeader>

        <p aria-atomic="true" aria-live="polite" className="sr-only">
          {announcement}
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type aria-hidden="true" className="h-5 w-5" />
                Text and spacing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <ChoiceGroup
                choices={FONT_SIZE_CHOICES}
                columns="sm:grid-cols-2"
                label="Text size"
                onChange={(value, label) =>
                  updateWithAnnouncement('fontSize', value, `Text size set to ${label}`)
                }
                value={settings.fontSize}
              />
              <ChoiceGroup
                choices={LINE_SPACING_CHOICES}
                label="Line spacing"
                onChange={(value, label) =>
                  updateWithAnnouncement('lineSpacing', value, `Line spacing set to ${label}`)
                }
                value={settings.lineSpacing}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette aria-hidden="true" className="h-5 w-5" />
                Display and interaction
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <ChoiceGroup
                choices={THEME_CHOICES}
                label="Colour theme"
                onChange={(value, label) =>
                  updateWithAnnouncement('colorTheme', value, `Colour theme set to ${label}`)
                }
                value={settings.colorTheme}
              />
              <ChoiceGroup
                choices={MOTION_CHOICES}
                label="Motion"
                onChange={(value, label) =>
                  updateWithAnnouncement('motionPreference', value, label)
                }
                value={settings.motionPreference}
              />

              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="expanded-tap-targets">Larger interaction targets</Label>
                  <p className="text-sm text-muted-foreground">
                    Increase the minimum size of buttons and links.
                  </p>
                </div>
                <Switch
                  checked={settings.expandedTapTargets}
                  id="expanded-tap-targets"
                  onCheckedChange={checked =>
                    updateWithAnnouncement(
                      'expandedTapTargets',
                      checked,
                      `Larger interaction targets ${checked ? 'enabled' : 'disabled'}`
                    )
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="enhanced-focus-outlines">Enhanced focus indicators</Label>
                  <p className="text-sm text-muted-foreground">
                    Make keyboard focus outlines more prominent.
                  </p>
                </div>
                <Switch
                  checked={settings.enhancedFocusOutlines}
                  id="enhanced-focus-outlines"
                  onCheckedChange={checked =>
                    updateWithAnnouncement(
                      'enhancedFocusOutlines',
                      checked,
                      `Enhanced focus indicators ${checked ? 'enabled' : 'disabled'}`
                    )
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-between">
          <Button className="min-h-11" onClick={handleReset} type="button" variant="outline">
            <RotateCcw aria-hidden="true" className="mr-2 h-4 w-4" />
            Reset preferences
          </Button>
          <Button className="min-h-11" onClick={() => onOpenChange(false)} type="button">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AccessibilitySettingsModal;
