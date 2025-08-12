import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Settings,
  Type,
  Eye,
  Volume2,
  Smartphone,
  Accessibility,
  Zap,
} from 'lucide-react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { toast } from '@/hooks/use-toast';

interface MobileAccessibilityFabProps {
  onOpenSettings: () => void;
}

export default function MobileAccessibilityFab({ onOpenSettings }: MobileAccessibilityFabProps) {
  const { settings, updateSetting } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);

  const quickActions = [
    {
      id: 'fontSize',
      label: 'Increase Text Size',
      icon: Type,
      action: () => {
        const sizes = ['small', 'medium', 'large', 'extra-large'] as const;
        const currentIndex = sizes.indexOf(settings.fontSize);
        const nextIndex = (currentIndex + 1) % sizes.length;
        updateSetting('fontSize', sizes[nextIndex]);
        toast({
          title: 'Text Size Changed',
          description: `Font size set to ${sizes[nextIndex].replace('-', ' ')}`,
        });
      },
    },
    {
      id: 'contrast',
      label: 'Toggle High Contrast',
      icon: Eye,
      action: () => {
        const newTheme = settings.colorTheme === 'high-contrast' ? 'light' : 'high-contrast';
        updateSetting('colorTheme', newTheme);
        toast({
          title: 'Contrast Changed',
          description: `Switched to ${newTheme.replace('-', ' ')} theme`,
        });
      },
    },
    {
      id: 'motion',
      label: 'Toggle Reduced Motion',
      icon: Zap,
      action: () => {
        updateSetting('reduceMotion', !settings.reduceMotion);
        toast({
          title: 'Motion Settings',
          description: `Motion ${settings.reduceMotion ? 'enabled' : 'reduced'}`,
        });
      },
    },
    {
      id: 'tts',
      label: 'Toggle Text-to-Speech',
      icon: Volume2,
      action: () => {
        updateSetting('textToSpeech', {
          ...settings.textToSpeech,
          enabled: !settings.textToSpeech.enabled,
        });
        toast({
          title: 'Text-to-Speech',
          description: `Text-to-speech ${settings.textToSpeech.enabled ? 'disabled' : 'enabled'}`,
        });
      },
    },
    {
      id: 'oneHanded',
      label: 'Toggle One-Handed Mode',
      icon: Smartphone,
      action: () => {
        updateSetting('oneHandedMode', !settings.oneHandedMode);
        toast({
          title: 'One-Handed Mode',
          description: `One-handed mode ${settings.oneHandedMode ? 'disabled' : 'enabled'}`,
        });
      },
    },
  ];

  return (
    <>
      {/* Mobile FAB */}
      <div className="fixed bottom-4 right-4 z-50 md:hidden">
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white"
              aria-label="Accessibility Quick Actions"
            >
              <Accessibility className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            side="top"
            className="w-64 mb-2"
            sideOffset={8}
          >
            <div className="px-3 py-2 text-sm font-medium text-gray-700 border-b">
              Quick Accessibility
            </div>
            
            {quickActions.map((action) => (
              <DropdownMenuItem
                key={action.id}
                onClick={action.action}
                className="flex items-center gap-3 py-3 cursor-pointer"
              >
                <action.icon className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{action.label}</span>
              </DropdownMenuItem>
            ))}
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem
              onClick={onOpenSettings}
              className="flex items-center gap-3 py-3 cursor-pointer font-medium"
            >
              <Settings className="h-4 w-4 text-blue-500" />
              <span className="text-sm">All Settings</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Desktop Quick Access */}
      <div className="hidden md:block fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenSettings}
          className="shadow-lg bg-white/90 backdrop-blur-sm hover:bg-white"
          aria-label="Open Accessibility Settings"
        >
          <Accessibility className="h-4 w-4 mr-2" />
          Accessibility
        </Button>
      </div>
    </>
  );
}