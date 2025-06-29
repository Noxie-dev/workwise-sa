import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CheckCircle2,
  HelpCircle,
  BookOpen
} from 'lucide-react';

const CvBuilderHelpTabContent = () => {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="mr-2 h-5 w-5 text-primary" />
              Quick Start Guide
            </CardTitle>
            <CardDescription>
              Learn how to create your CV quickly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 list-disc pl-5">
              <li>Getting started with CV Builder</li>
              <li>Adding your personal information</li>
              <li>Including work experience</li>
              <li>Adding education history</li>
              <li>Listing your professional skills</li>
              <li>Generating AI-powered content</li>
              <li>Exporting and sharing your CV</li>
            </ul>
            <Button className="w-full mt-4 bg-primary">
              Read Full Guide
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HelpCircle className="mr-2 h-5 w-5 text-primary" />
              AI CV Builder FAQ
            </CardTitle>
            <CardDescription>
              Frequently asked questions about our AI-powered CV building tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>What is the AI-powered CV generator?</AccordionTrigger>
                <AccordionContent>
                  Our AI-powered CV generator uses Google's Gemini AI to help you create professional content for your CV. It can generate professional summaries, enhance job descriptions, and translate your CV into different languages, all based on the information you provide.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2">
                <AccordionTrigger>How do I use the AI to generate a professional summary?</AccordionTrigger>
                <AccordionContent>
                  Fill in your basic information, skills, work experience, and education details in the CV builder form. Then click the "Generate with AI" button in the professional summary section. The AI will create a personalized summary highlighting your key qualities and experience.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3">
                <AccordionTrigger>Can I edit the AI-generated content?</AccordionTrigger>
                <AccordionContent>
                  Yes! The AI suggestions are just starting points. You can edit, modify, or completely rewrite any AI-generated content to better match your personal style or add specific details the AI might have missed.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-4">
                <AccordionTrigger>What languages are supported for translation?</AccordionTrigger>
                <AccordionContent>
                  Our AI translation feature supports multiple South African languages including English, Afrikaans, Zulu, Xhosa, and more. This allows you to create CVs tailored for different language requirements.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-5">
                <AccordionTrigger>How can I get the best results from the AI generator?</AccordionTrigger>
                <AccordionContent>
                  For best results, provide detailed information about your skills, experience, and education. Be specific about your job titles, responsibilities, and achievements. The more information you provide, the better the AI can generate relevant and personalized content for your CV.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-6">
                <AccordionTrigger>Is my data secure when using the AI features?</AccordionTrigger>
                <AccordionContent>
                  Yes, we take your privacy seriously. The information you provide is only used to generate content for your CV and is processed securely. We do not store your personal data for any other purposes than providing the service to you.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-7">
                <AccordionTrigger>What if I'm not happy with the AI-generated content?</AccordionTrigger>
                <AccordionContent>
                  You can regenerate the content by clicking the "Regenerate" button, or you can edit it manually. If you're consistently unhappy with the results, please provide feedback through our feedback form so we can improve the service.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle2 className="mr-2 h-5 w-5 text-primary" />
              Tips for Optimizing AI-Generated Content
            </CardTitle>
            <CardDescription>
              Get the most out of our AI CV builder tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-muted/20">
                <h4 className="font-medium mb-2">Professional Summary Tips</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>List at least 5-7 relevant skills for your target position</li>
                  <li>Include any certifications or special qualifications</li>
                  <li>Mention years of experience in relevant roles</li>
                  <li>Edit the AI-generated summary to add your personal touch</li>
                </ul>
              </div>
              
              <div className="border rounded-lg p-4 bg-muted/20">
                <h4 className="font-medium mb-2">Job Description Tips</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Be specific about your responsibilities in each role</li>
                  <li>Mention any achievements or improvements you made</li>
                  <li>Include numbers where possible (e.g., "served 50+ customers daily")</li>
                  <li>Keep descriptions concise but informative</li>
                </ul>
              </div>
              
              <div className="border rounded-lg p-4 bg-muted/20">
                <h4 className="font-medium mb-2">Translation Tips</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Proofread translated content if you know the target language</li>
                  <li>Keep sentences clear and straightforward for better translation results</li>
                  <li>Consider cultural context when translating to different languages</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CvBuilderHelpTabContent;
