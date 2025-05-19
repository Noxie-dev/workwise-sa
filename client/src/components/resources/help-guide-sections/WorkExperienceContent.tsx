import React from 'react';
import Tip from '../Tip';

/**
 * Work Experience section content for the CV Builder Help Guide
 */
export default function WorkExperienceContent() {
  return (
    <div className="space-y-4">
      <ul className="list-disc pl-5 space-y-2">
        <li>List your work history in reverse chronological order (most recent first)</li>
        <li>Include company name, location, your job title, and employment dates</li>
        <li>For each position, add 3-5 bullet points describing your responsibilities and achievements</li>
        <li>Use action verbs (managed, created, increased, reduced, etc.)</li>
        <li>Quantify achievements where possible (percentages, numbers, rand amounts)</li>
      </ul>
      <div className="border rounded p-4 bg-gray-50 mt-4">
        <h4 className="font-medium text-gray-700 mb-2">Example:</h4>
        <p className="font-medium">Sales Associate | ABC Retail Store, Durban</p>
        <p className="text-sm text-gray-600 mb-2">January 2023 - Present</p>
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li>Process an average of 45 transactions daily while maintaining 100% cash drawer accuracy</li>
          <li>Increased store membership sign-ups by 20% through personalized customer approach</li>
          <li>Train and mentor 3 new staff members on POS systems and store procedures</li>
          <li>Organize and maintain store displays, consistently receiving positive feedback from management</li>
        </ul>
      </div>
      <Tip>
        South African employers value detailed work experience. Include contract and temporary positions, especially if you're early in your career.
      </Tip>
    </div>
  );
}
