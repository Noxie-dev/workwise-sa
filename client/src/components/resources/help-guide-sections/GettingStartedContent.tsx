import React from 'react';
import { FileText } from 'lucide-react';

/**
 * Getting Started section content for the CV Builder Help Guide
 */
export default function GettingStartedContent() {
  return (
    <div className="space-y-4">
      <p>
        Welcome to WorkWise SA's AI CV Builder! Our tool is designed specifically for the South African job market to help you create a professional CV in minutes.
      </p>
      <h3 className="font-semibold text-blue-800 mt-4 flex items-center">
        <FileText className="h-5 w-5 mr-2" />
        Why Use the AI CV Builder?
      </h3>
      <ul className="list-disc pl-5 space-y-2">
        <li><span className="font-medium">Professional Format:</span> Creates industry-standard CV layouts preferred by South African employers</li>
        <li><span className="font-medium">Time-Saving:</span> Complete your CV in minutes instead of hours</li>
        <li><span className="font-medium">Tailored Content:</span> AI suggestions specific to South African job market requirements</li>
        <li><span className="font-medium">Error-Free:</span> Spelling and grammar checks built in</li>
        <li><span className="font-medium">Mobile-Friendly:</span> Build your CV on any device</li>
      </ul>
      <div className="bg-blue-50 p-4 rounded-lg mt-4">
        <p className="text-center text-blue-800">
          <strong>To get started, click on "CV Builder" in the main navigation and follow the step-by-step process.</strong>
        </p>
      </div>
    </div>
  );
}
