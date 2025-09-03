import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Sparkles, 
  RefreshCw, 
  Copy, 
  Check, 
  Edit3,
  FileText,
  Wand2,
  Download
} from 'lucide-react';
import { coverLetterApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { SuitabilityAnalysis } from '../../../shared/job-types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface CoverLetterGeneratorProps {
  jobId: string;
  userProfile: any;
  jobTitle: string;
  companyName: string;
  suitabilityAnalysis?: SuitabilityAnalysis;
  onCoverLetterGenerated?: (coverLetter: string) => void;
  className?: string;
}

/**
 * AI-Powered Cover Letter Generator Component
 * Generates personalized cover letters based on user profile and job details
 */
const CoverLetterGenerator: React.FC<CoverLetterGeneratorProps> = ({
  jobId,
  userProfile,
  jobTitle,
  companyName,
  suitabilityAnalysis,
  onCoverLetterGenerated,
  className = ''
}) => {
  const { toast } = useToast();
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCoverLetter, setEditedCoverLetter] = useState<string>('');

  const generateCoverLetter = async () => {
    if (!userProfile || !jobId) return;

    setIsGenerating(true);
    try {
      const request = {
        jobId,
        userProfile: {
          id: userProfile.id || 'user',
          firstName: userProfile.personal?.fullName?.split(' ')[0] || 'User',
          lastName: userProfile.personal?.fullName?.split(' ').slice(1).join(' ') || '',
          email: userProfile.email || '',
          skills: userProfile.skills?.skills || [],
          experience: userProfile.experience?.hasExperience ? [{
            title: userProfile.experience.jobTitle || '',
            company: userProfile.experience.employer || '',
            description: userProfile.experience.jobDescription || '',
            startDate: userProfile.experience.startDate,
            endDate: userProfile.experience.endDate,
            current: userProfile.experience.currentlyEmployed
          }] : [],
          education: userProfile.education?.highestEducation ? [{
            degree: userProfile.education.highestEducation,
            institution: userProfile.education.schoolName,
            year: userProfile.education.yearCompleted || '',
            field: userProfile.education.fieldOfStudy
          }] : [],
          summary: userProfile.personal?.bio || '',
          location: userProfile.personal?.location || '',
          phone: userProfile.personal?.phoneNumber || ''
        },
        suitabilityAnalysis
      };

      const [coverLetterData, error] = await coverLetterApi.generateCoverLetter(request);
      
      if (error) {
        throw new Error(error.message);
      }

      if (coverLetterData) {
        setGeneratedCoverLetter(coverLetterData.coverLetter);
        setEditedCoverLetter(coverLetterData.coverLetter);
        onCoverLetterGenerated?.(coverLetterData.coverLetter);
        
        toast({
          title: "Cover Letter Generated",
          description: "Your personalized cover letter has been created successfully.",
        });
      }
    } catch (error: any) {
      console.error('Failed to generate cover letter:', error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: error.message || "Could not generate your cover letter. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(editedCoverLetter);
      setIsCopied(true);
      toast({
        title: "Copied to Clipboard",
        description: "Cover letter has been copied to your clipboard.",
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Could not copy to clipboard. Please try again.",
      });
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    setGeneratedCoverLetter(editedCoverLetter);
    setIsEditing(false);
    onCoverLetterGenerated?.(editedCoverLetter);
    toast({
      title: "Cover Letter Updated",
      description: "Your changes have been saved.",
    });
  };

  const handleCancelEdit = () => {
    setEditedCoverLetter(generatedCoverLetter);
    setIsEditing(false);
  };

  /**
   * Enhanced PDF Export Function for Cover Letters
   * Creates a professional PDF with proper formatting and branding
   */
  const exportToPDF = async () => {
    if (!editedCoverLetter) {
      toast({
        variant: "destructive",
        title: "No Content",
        description: "Please generate a cover letter first.",
      });
      return;
    }

    try {
      // Create a temporary element for PDF generation
      const coverLetterElement = createCoverLetterElement();
      document.body.appendChild(coverLetterElement);

      // Convert to canvas with high quality settings
      const canvas = await html2canvas(coverLetterElement, {
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794, // A4 width in pixels at 96 DPI
        height: 1123, // A4 height in pixels at 96 DPI
        logging: false, // Disable console logging
        imageTimeout: 15000, // 15 second timeout for images
      });

      // Remove temporary element
      document.body.removeChild(coverLetterElement);

      // Create PDF with professional settings
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true, // Enable compression for smaller file size
      });

      // Calculate dimensions
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add the cover letter image to PDF
      pdf.addImage(
        canvas.toDataURL('image/png', 0.95), // High quality PNG
        'PNG',
        0,
        0,
        imgWidth,
        imgHeight
      );

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const sanitizedJobTitle = jobTitle.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
      const fileName = `Cover_Letter_${sanitizedJobTitle}_${timestamp}.pdf`;

      // Save the PDF
      pdf.save(fileName);

      toast({
        title: "PDF Downloaded",
        description: `Cover letter saved as ${fileName}`,
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        variant: "destructive",
        title: "PDF Generation Failed",
        description: "Could not generate PDF. Please try again.",
      });
    }
  };

  /**
   * Creates a styled HTML element for PDF generation
   * Optimized for professional cover letter formatting
   */
  const createCoverLetterElement = (): HTMLElement => {
    const element = document.createElement('div');
    element.style.width = '794px';
    element.style.minHeight = '1123px';
    element.style.backgroundColor = '#ffffff';
    element.style.fontFamily = 'Georgia, "Times New Roman", serif';
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    element.style.top = '0';
    element.style.padding = '40px';
    element.style.lineHeight = '1.6';
    element.style.color = '#333333';

    // Get current date for the letter
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Extract user name from profile
    const userName = userProfile?.personal?.fullName || 'Your Name';
    const userEmail = userProfile?.email || 'your.email@example.com';
    const userPhone = userProfile?.personal?.phoneNumber || 'Your Phone';

    element.innerHTML = `
      <div style="height: 100%; display: flex; flex-direction: column;">
        <!-- Header with user contact info -->
        <div style="margin-bottom: 40px; text-align: right; border-bottom: 2px solid #2563eb; padding-bottom: 20px;">
          <div style="font-size: 16px; font-weight: bold; color: #2563eb; margin-bottom: 10px;">
            ${userName}
          </div>
          <div style="font-size: 12px; color: #666; line-height: 1.4;">
            ${userEmail}<br>
            ${userPhone}
          </div>
        </div>

        <!-- Date -->
        <div style="margin-bottom: 30px; text-align: right; font-size: 14px; color: #666;">
          ${currentDate}
        </div>

        <!-- Company/Recipient Info -->
        <div style="margin-bottom: 30px;">
          <div style="font-size: 14px; color: #666;">
            Hiring Manager<br>
            ${companyName || 'Company Name'}<br>
            ${jobTitle} Position
          </div>
        </div>

        <!-- Greeting -->
        <div style="margin-bottom: 20px; font-size: 14px;">
          Dear Hiring Manager,
        </div>

        <!-- Cover Letter Content -->
        <div style="margin-bottom: 30px; font-size: 14px; text-align: justify; line-height: 1.8;">
          ${editedCoverLetter.split('\n').map(paragraph => 
            paragraph.trim() ? `<p style="margin-bottom: 15px;">${paragraph}</p>` : ''
          ).join('')}
        </div>

        <!-- Closing -->
        <div style="margin-top: 40px;">
          <div style="margin-bottom: 20px; font-size: 14px;">
            Sincerely,
          </div>
          <div style="font-size: 14px; font-weight: bold;">
            ${userName}
          </div>
        </div>

        <!-- Footer with WorkWise branding -->
        <div style="margin-top: auto; padding-top: 30px; border-top: 1px solid #e5e7eb; text-align: center;">
          <div style="font-size: 10px; color: #9ca3af;">
            Generated by WorkWise.SA - Your Career Partner
          </div>
        </div>
      </div>
    `;

    return element;
  };

  if (!generatedCoverLetter && !isGenerating) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" />
            AI Cover Letter Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Generate Your Cover Letter</h3>
            <p className="text-muted-foreground mb-6">
              Let AI create a personalized cover letter for {jobTitle} at {companyName} based on your profile.
            </p>
            <Button onClick={generateCoverLetter} disabled={!userProfile}>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Cover Letter
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isGenerating) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary animate-spin" />
            Generating Cover Letter...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Generated Cover Letter
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={generateCoverLetter}
              disabled={isGenerating}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToPDF}
              disabled={!editedCoverLetter}
            >
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
            >
              {isCopied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {isCopied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="coverLetter">Edit Cover Letter</Label>
              <Textarea
                id="coverLetter"
                value={editedCoverLetter}
                onChange={(e) => setEditedCoverLetter(e.target.value)}
                rows={12}
                className="mt-2"
                placeholder="Edit your cover letter..."
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveEdit}>
                <Check className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
              <Button variant="outline" onClick={exportToPDF}>
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {generatedCoverLetter}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToPDF}
              >
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
              >
                {isCopied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {isCopied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>
        )}

        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertDescription>
            <strong>AI-Generated:</strong> This cover letter was created using AI based on your profile and the job requirements. 
            Feel free to edit it to make it more personal and authentic.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default CoverLetterGenerator;