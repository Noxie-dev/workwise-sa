import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Briefcase, 
  Eye, 
  Upload, 
  Shield, 
  Users,
  CheckCircle
} from 'lucide-react';

const ProfessionalImageDemo: React.FC = () => {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-4">
            <Briefcase className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Professional Image Feature
          </h2>
          <p className="text-gray-600">
            Enhance your profile with a dedicated professional image for recruiters
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* For Candidates */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">For Candidates</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Upload className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Easy Upload</p>
                  <p className="text-xs text-gray-600">Upload a professional photo separate from your profile picture</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Shield className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Privacy Control</p>
                  <p className="text-xs text-gray-600">Keep your casual profile pic while showing professionalism</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Professional Presence</p>
                  <p className="text-xs text-gray-600">Showcase workplace attire, formal headshots, or professional settings</p>
                </div>
              </div>
            </div>
          </div>

          {/* For Recruiters */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">For Recruiters</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Eye className="h-4 w-4 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Enhanced Viewer</p>
                  <p className="text-xs text-gray-600">Full-screen viewer with zoom, rotate, and download options</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Briefcase className="h-4 w-4 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Professional Context</p>
                  <p className="text-xs text-gray-600">Better assessment of candidate's professional presentation</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Clear Indicators</p>
                  <p className="text-xs text-gray-600">Easy to spot candidates with professional images</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="border-t pt-6">
          <h4 className="font-semibold text-gray-900 mb-4">Key Features</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Badge variant="outline" className="mb-2">
                15MB Max
              </Badge>
              <p className="text-xs text-gray-600">Large file support</p>
            </div>
            
            <div className="text-center">
              <Badge variant="outline" className="mb-2">
                Multiple Formats
              </Badge>
              <p className="text-xs text-gray-600">JPEG, PNG, WebP, GIF</p>
            </div>
            
            <div className="text-center">
              <Badge variant="outline" className="mb-2">
                Secure Storage
              </Badge>
              <p className="text-xs text-gray-600">User-specific directories</p>
            </div>
            
            <div className="text-center">
              <Badge variant="outline" className="mb-2">
                Easy Access
              </Badge>
              <p className="text-xs text-gray-600">Quick view buttons</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfessionalImageDemo;