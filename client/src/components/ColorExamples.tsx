import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  XCircle, 
  Star,
  Heart,
  Zap,
  Shield
} from 'lucide-react';

/**
 * Color Examples Component
 * Demonstrates the comprehensive color scheme usage in WorkWise SA
 */
const ColorExamples: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-workwise-blue mb-4">
          WorkWise SA Color Scheme
        </h1>
        <p className="text-lg text-muted-foreground">
          Comprehensive color palette and usage examples
        </p>
      </div>

      {/* Primary Colors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Primary Colors</CardTitle>
          <CardDescription>Main brand colors - Light Blue (#63B3ED)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-primary text-primary-foreground p-4 rounded-lg text-center">
              <div className="font-semibold">Primary</div>
              <div className="text-sm opacity-90">#63B3ED</div>
            </div>
            <div className="bg-primary-light text-primary-dark p-4 rounded-lg text-center">
              <div className="font-semibold">Primary Light</div>
              <div className="text-sm opacity-70">#BEE3F8</div>
            </div>
            <div className="bg-primary-dark text-primary-foreground p-4 rounded-lg text-center">
              <div className="font-semibold">Primary Dark</div>
              <div className="text-sm opacity-90">#2B6CB0</div>
            </div>
            <div className="bg-primary hover:bg-primary-hover text-primary-foreground p-4 rounded-lg text-center transition-colors cursor-pointer">
              <div className="font-semibold">Primary Hover</div>
              <div className="text-sm opacity-90">#4299E1</div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button className="bg-primary text-primary-foreground hover:bg-primary-hover">
              Primary Button
            </Button>
            <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              Primary Outline
            </Button>
            <Badge className="bg-primary text-primary-foreground">Primary Badge</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Secondary Colors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-secondary-foreground">Secondary Colors</CardTitle>
          <CardDescription>Neutral secondary colors - Light Gray (#E2E8F0)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-secondary text-secondary-foreground p-4 rounded-lg text-center">
              <div className="font-semibold">Secondary</div>
              <div className="text-sm opacity-70">#E2E8F0</div>
            </div>
            <div className="bg-secondary-light text-secondary-foreground p-4 rounded-lg text-center">
              <div className="font-semibold">Secondary Light</div>
              <div className="text-sm opacity-70">#F7FAFC</div>
            </div>
            <div className="bg-secondary-dark text-secondary-foreground p-4 rounded-lg text-center">
              <div className="font-semibold">Secondary Dark</div>
              <div className="text-sm opacity-70">#A0AEC0</div>
            </div>
            <div className="bg-secondary hover:bg-secondary-hover text-secondary-foreground p-4 rounded-lg text-center transition-colors cursor-pointer">
              <div className="font-semibold">Secondary Hover</div>
              <div className="text-sm opacity-70">#CBD5E0</div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="outline" className="border-secondary text-secondary-foreground">
              Secondary Outline
            </Button>
            <Badge variant="secondary">Secondary Badge</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Accent Colors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-accent-dark">Accent Colors</CardTitle>
          <CardDescription>Highlight and call-to-action colors - Yellow/Gold (#ECC94B)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-accent text-accent-foreground p-4 rounded-lg text-center">
              <div className="font-semibold">Accent</div>
              <div className="text-sm opacity-70">#ECC94B</div>
            </div>
            <div className="bg-accent-light text-accent-dark p-4 rounded-lg text-center">
              <div className="font-semibold">Accent Light</div>
              <div className="text-sm opacity-70">#FAF089</div>
            </div>
            <div className="bg-accent-dark text-accent-foreground p-4 rounded-lg text-center">
              <div className="font-semibold">Accent Dark</div>
              <div className="text-sm opacity-70">#B7791F</div>
            </div>
            <div className="bg-accent hover:bg-accent-hover text-accent-foreground p-4 rounded-lg text-center transition-colors cursor-pointer">
              <div className="font-semibold">Accent Hover</div>
              <div className="text-sm opacity-70">#D69E2E</div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button className="bg-accent text-accent-foreground hover:bg-accent-hover">
              Accent Button
            </Button>
            <Button variant="outline" className="border-accent text-accent-dark hover:bg-accent hover:text-accent-foreground">
              Accent Outline
            </Button>
            <Badge className="bg-accent text-accent-foreground">Accent Badge</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Status Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Status Colors</CardTitle>
          <CardDescription>Success, warning, info, and destructive states</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Success */}
          <div className="space-y-2">
            <h4 className="font-semibold text-success-dark">Success Colors</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-success text-success-foreground p-4 rounded-lg text-center">
                <div className="font-semibold">Success</div>
                <div className="text-sm opacity-90">#38A169</div>
              </div>
              <div className="bg-success-light text-success-dark p-4 rounded-lg text-center">
                <div className="font-semibold">Success Light</div>
                <div className="text-sm opacity-70">#C6F6D5</div>
              </div>
              <div className="bg-success-dark text-success-foreground p-4 rounded-lg text-center">
                <div className="font-semibold">Success Dark</div>
                <div className="text-sm opacity-90">#276749</div>
              </div>
            </div>
            <Alert className="bg-success-light border-success text-success-dark">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                This is a success alert with proper color usage.
              </AlertDescription>
            </Alert>
          </div>

          {/* Warning */}
          <div className="space-y-2">
            <h4 className="font-semibold text-warning-dark">Warning Colors</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-warning text-warning-foreground p-4 rounded-lg text-center">
                <div className="font-semibold">Warning</div>
                <div className="text-sm opacity-90">#DD6B20</div>
              </div>
              <div className="bg-warning-light text-warning-dark p-4 rounded-lg text-center">
                <div className="font-semibold">Warning Light</div>
                <div className="text-sm opacity-70">#FBD38D</div>
              </div>
              <div className="bg-warning-dark text-warning-foreground p-4 rounded-lg text-center">
                <div className="font-semibold">Warning Dark</div>
                <div className="text-sm opacity-90">#9C4221</div>
              </div>
            </div>
            <Alert className="bg-warning-light border-warning text-warning-dark">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This is a warning alert with proper color usage.
              </AlertDescription>
            </Alert>
          </div>

          {/* Info */}
          <div className="space-y-2">
            <h4 className="font-semibold text-info-dark">Info Colors</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-info text-info-foreground p-4 rounded-lg text-center">
                <div className="font-semibold">Info</div>
                <div className="text-sm opacity-90">#3182CE</div>
              </div>
              <div className="bg-info-light text-info-dark p-4 rounded-lg text-center">
                <div className="font-semibold">Info Light</div>
                <div className="text-sm opacity-70">#BEE3F8</div>
              </div>
              <div className="bg-info-dark text-info-foreground p-4 rounded-lg text-center">
                <div className="font-semibold">Info Dark</div>
                <div className="text-sm opacity-90">#2A4365</div>
              </div>
            </div>
            <Alert className="bg-info-light border-info text-info-dark">
              <Info className="h-4 w-4" />
              <AlertDescription>
                This is an info alert with proper color usage.
              </AlertDescription>
            </Alert>
          </div>

          {/* Destructive */}
          <div className="space-y-2">
            <h4 className="font-semibold text-destructive-dark">Destructive Colors</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-destructive text-destructive-foreground p-4 rounded-lg text-center">
                <div className="font-semibold">Destructive</div>
                <div className="text-sm opacity-90">#E53E3E</div>
              </div>
              <div className="bg-destructive-light text-destructive-dark p-4 rounded-lg text-center">
                <div className="font-semibold">Destructive Light</div>
                <div className="text-sm opacity-70">#FED7D7</div>
              </div>
              <div className="bg-destructive-dark text-destructive-foreground p-4 rounded-lg text-center">
                <div className="font-semibold">Destructive Dark</div>
                <div className="text-sm opacity-90">#9B2C2C</div>
              </div>
            </div>
            <Alert className="bg-destructive-light border-destructive text-destructive-dark">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                This is a destructive alert with proper color usage.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* WorkWise Brand Colors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-workwise-blue">WorkWise Brand Colors</CardTitle>
          <CardDescription>Official WorkWise SA brand colors</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="bg-workwise-blue text-white p-4 rounded-lg text-center">
              <div className="font-semibold">WorkWise Blue</div>
              <div className="text-sm opacity-90">#2A4365</div>
            </div>
            <div className="bg-workwise-blue-light text-white p-4 rounded-lg text-center">
              <div className="font-semibold">Blue Light</div>
              <div className="text-sm opacity-90">#4A5568</div>
            </div>
            <div className="bg-workwise-blue-dark text-white p-4 rounded-lg text-center">
              <div className="font-semibold">Blue Dark</div>
              <div className="text-sm opacity-90">#1A202C</div>
            </div>
            <div className="bg-workwise-yellow text-workwise-blue-dark p-4 rounded-lg text-center">
              <div className="font-semibold">WorkWise Yellow</div>
              <div className="text-sm opacity-70">#F6E05E</div>
            </div>
            <div className="bg-workwise-yellow-light text-workwise-blue-dark p-4 rounded-lg text-center">
              <div className="font-semibold">Yellow Light</div>
              <div className="text-sm opacity-70">#FAF089</div>
            </div>
            <div className="bg-workwise-yellow-dark text-white p-4 rounded-lg text-center">
              <div className="font-semibold">Yellow Dark</div>
              <div className="text-sm opacity-90">#D69E2E</div>
            </div>
          </div>
          
          <div className="bg-workwise-blue text-white p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2">WorkWise SA</h3>
                <p className="text-workwise-yellow-light">Your career partner</p>
              </div>
              <div className="flex space-x-2">
                <Star className="w-6 h-6 text-workwise-yellow" />
                <Heart className="w-6 h-6 text-workwise-yellow" />
                <Zap className="w-6 h-6 text-workwise-yellow" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Interactive Examples</CardTitle>
          <CardDescription>Hover effects and interactive states</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card hover:bg-card-hover border border-border p-4 rounded-lg transition-colors cursor-pointer">
              <Shield className="w-8 h-8 text-primary mb-2" />
              <h4 className="font-semibold">Card Hover</h4>
              <p className="text-sm text-muted-foreground">Hover to see effect</p>
            </div>
            
            <div className="bg-primary hover:bg-primary-hover text-primary-foreground p-4 rounded-lg transition-colors cursor-pointer">
              <Star className="w-8 h-8 mb-2" />
              <h4 className="font-semibold">Primary Hover</h4>
              <p className="text-sm opacity-90">Hover to see effect</p>
            </div>
            
            <div className="bg-accent hover:bg-accent-hover text-accent-foreground p-4 rounded-lg transition-colors cursor-pointer">
              <Zap className="w-8 h-8 mb-2" />
              <h4 className="font-semibold">Accent Hover</h4>
              <p className="text-sm opacity-90">Hover to see effect</p>
            </div>
            
            <div className="bg-success hover:bg-success-hover text-success-foreground p-4 rounded-lg transition-colors cursor-pointer">
              <CheckCircle className="w-8 h-8 mb-2" />
              <h4 className="font-semibold">Success Hover</h4>
              <p className="text-sm opacity-90">Hover to see effect</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Guidelines</CardTitle>
          <CardDescription>Best practices for using the color scheme</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-primary mb-2">✅ Do</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Use primary colors for main CTAs</li>
                <li>• Use status colors for feedback</li>
                <li>• Maintain consistent hover states</li>
                <li>• Use sufficient contrast ratios</li>
                <li>• Test with color blind users</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-destructive mb-2">❌ Don't</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Use destructive colors for non-critical actions</li>
                <li>• Mix too many colors in one component</li>
                <li>• Ignore accessibility guidelines</li>
                <li>• Use colors as the only way to convey information</li>
                <li>• Create custom colors without updating the system</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ColorExamples;