import React from 'react';
import { 
  Card, 
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import {
  AlertCircle,
  Sparkles,
  Globe,
  Lightbulb,
  Info
} from 'lucide-react';

export const AiGenerationTips: React.FC = () => {
  return (
    <Card className="mb-6 border-blue-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center text-blue-700">
          <Sparkles className="mr-2 h-4 w-4" />
          AI-Powered CV Builder Tips
        </CardTitle>
        <CardDescription>
          Get the most out of our AI features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-sm py-2">
              <div className="flex items-center">
                <Sparkles className="mr-2 h-4 w-4 text-blue-500" />
                <span>Professional Summary Generation</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-sm">
              <ul className="space-y-1 list-disc pl-5">
                <li>Fill out your personal info, experience, education and skills first</li>
                <li>Click "Generate with AI" next to Professional Summary</li>
                <li>The AI uses your information to create a customized summary</li>
                <li>Edit the generated content to add your personal touch</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-2">
            <AccordionTrigger className="text-sm py-2">
              <div className="flex items-center">
                <Lightbulb className="mr-2 h-4 w-4 text-amber-500" />
                <span>Job Description Enhancement</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-sm">
              <ul className="space-y-1 list-disc pl-5">
                <li>Enter your job title and employer name first</li>
                <li>Click "Generate with AI" in the job description section</li>
                <li>The AI creates a professional description of your responsibilities</li>
                <li>For best results, review and customize the text with specific achievements</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-3">
            <AccordionTrigger className="text-sm py-2">
              <div className="flex items-center">
                <Globe className="mr-2 h-4 w-4 text-green-500" />
                <span>Multi-Language Translation</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-sm">
              <ul className="space-y-1 list-disc pl-5">
                <li>Select your desired language from the dropdown</li>
                <li>Complete your CV content in your primary language first</li>
                <li>Click "Translate CV" to translate all content</li>
                <li>Review translations for any needed adjustments</li>
                <li>Supports multiple South African and international languages</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-4">
            <AccordionTrigger className="text-sm py-2">
              <div className="flex items-center">
                <Info className="mr-2 h-4 w-4 text-purple-500" />
                <span>Tips for Best Results</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-sm">
              <ul className="space-y-1 list-disc pl-5">
                <li>Be detailed in your work experience descriptions</li>
                <li>List specific skills relevant to the job you're applying for</li>
                <li>Include all education, even if not directly related</li>
                <li>The more information you provide, the better the AI results</li>
                <li>Always review and personalize AI-generated content</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export const SamplePrompts: React.FC = () => {
  return (
    <Card className="mb-6 border-blue-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center text-blue-700">
          <Lightbulb className="mr-2 h-4 w-4" />
          Example Prompts for AI Generation
        </CardTitle>
        <CardDescription>
          Sample inputs that work well with our AI
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="border-l-4 border-blue-300 pl-3">
            <h4 className="text-sm font-medium">For Cashier Position:</h4>
            <p className="text-sm text-gray-600">
              "Managed cash register operations, processed customer transactions accurately, and maintained a balanced drawer. Provided friendly customer service and resolved payment issues."
            </p>
          </div>
          
          <div className="border-l-4 border-green-300 pl-3">
            <h4 className="text-sm font-medium">For Security Guard:</h4>
            <p className="text-sm text-gray-600">
              "Monitored premises, conducted regular security patrols, and maintained detailed incident reports. Ensured compliance with safety protocols and responded to emergency situations."
            </p>
          </div>
          
          <div className="border-l-4 border-amber-300 pl-3">
            <h4 className="text-sm font-medium">For Domestic Worker:</h4>
            <p className="text-sm text-gray-600">
              "Maintained household cleanliness, organized living spaces, and managed daily cleaning schedules. Handled laundry, meal preparation, and special cleaning projects as needed."
            </p>
          </div>
          
          <div className="border-l-4 border-purple-300 pl-3">
            <h4 className="text-sm font-medium">For General Worker:</h4>
            <p className="text-sm text-gray-600">
              "Performed various maintenance tasks, assisted with inventory management, and supported team operations. Maintained workspace organization and followed all safety procedures."
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};