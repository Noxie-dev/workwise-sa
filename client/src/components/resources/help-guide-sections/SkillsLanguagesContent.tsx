import React from 'react';
import Tip from '../Tip';

/**
 * Skills and Languages section content for the CV Builder Help Guide
 */
export default function SkillsLanguagesContent() {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-blue-800">Skills</h3>
      <ul className="list-disc pl-5 space-y-2">
        <li>List both hard skills (technical abilities) and soft skills (personal attributes)</li>
        <li>Be specific about technical skills (e.g., instead of "Computer Skills," list "Proficient in MS Excel, PowerPoint, and Word")</li>
        <li>Include level of proficiency where relevant</li>
        <li>Focus on skills mentioned in the job advertisement</li>
      </ul>
      <h3 className="font-semibold text-blue-800 mt-6">Languages</h3>
      <ul className="list-disc pl-5 space-y-2">
        <li>List all languages you speak with proficiency level</li>
        <li>South Africa has 11 official languages—knowledge of multiple South African languages is a valuable asset</li>
      </ul>
      <div className="border rounded p-4 bg-gray-50 mt-4">
        <h4 className="font-medium text-gray-700 mb-2">Example:</h4>
        <p className="font-medium">Skills:</p>
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li>MS Office Suite (Intermediate)</li>
          <li>Customer Service</li>
          <li>Cash Handling</li>
          <li>Inventory Management</li>
          <li>Problem-Solving</li>
        </ul>
        <p className="font-medium mt-3">Languages:</p>
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li>English (Fluent)</li>
          <li>isiZulu (Native)</li>
          <li>Afrikaans (Basic)</li>
        </ul>
      </div>
      <Tip>
        South African employers often use Applicant Tracking Systems (ATS) to scan CVs, so include relevant keywords from the job description.
      </Tip>
    </div>
  );
}
