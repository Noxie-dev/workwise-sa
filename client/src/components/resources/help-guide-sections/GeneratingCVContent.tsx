import React from 'react';
import { Check } from 'lucide-react';

/**
 * Generating CV section content for the CV Builder Help Guide
 */
export default function GeneratingCVContent() {
  return (
    <div className="space-y-4">
      <p>Once you've completed all sections, click the "Generate CV" button. Our AI will:</p>
      <ol className="list-decimal pl-5 space-y-2">
        <li>Format your information into a professional layout</li>
        <li>Check for spelling and grammar errors</li>
        <li>Ensure content is optimized for ATS systems</li>
        <li>Create a downloadable PDF document</li>
      </ol>
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mt-4">
        <h4 className="font-medium text-blue-800 mb-2 flex items-center">
          <Check className="h-5 w-5 mr-2" />
          South African CV Best Practices
        </h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="font-medium text-blue-700">Do's:</p>
            <ul className="list-disc pl-5 text-sm space-y-1 text-blue-800">
              <li>Keep your CV between 2-3 pages</li>
              <li>Include a professional photo (optional but common)</li>
              <li>Mention work permit/visa status if applicable</li>
              <li>Use simple, professional fonts</li>
              <li>Save your CV as a PDF</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-red-700">Don'ts:</p>
            <ul className="list-disc pl-5 text-sm space-y-1 text-red-800">
              <li>Don't include age or marital status</li>
              <li>Avoid elaborate designs or graphics</li>
              <li>Don't exaggerate or falsify information</li>
              <li>Don't use unprofessional email addresses</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
