import React from 'react';
import Tip from '../Tip';

/**
 * Professional Summary section content for the CV Builder Help Guide
 */
export default function ProfessionalSummaryContent() {
  return (
    <div className="space-y-4">
      <p>Your professional summary is your 30-second elevator pitch that appears at the top of your CV:</p>
      <ul className="list-disc pl-5 space-y-2">
        <li>Keep it between 3-5 sentences</li>
        <li>Highlight your experience, key skills, and career achievements</li>
        <li>Tailor it to match the job you're applying for</li>
        <li>Include industry-relevant keywords</li>
      </ul>
      <div className="grid gap-4 md:grid-cols-2 mt-4">
        <div className="border rounded p-4 bg-gray-50">
          <h4 className="font-medium text-gray-700 mb-2">Example for Entry-Level:</h4>
          <p className="text-sm">
            Recent Matric graduate with strong communication skills and customer service experience from part-time retail work. Proficient in MS Office with typing speed of 45 WPM. Eager to apply my reliability and attention to detail in an administrative support role.
          </p>
        </div>
        <div className="border rounded p-4 bg-gray-50">
          <h4 className="font-medium text-gray-700 mb-2">Example for Experienced:</h4>
          <p className="text-sm">
            Dedicated Sales Representative with 5+ years of experience in FMCG sector across Gauteng region. Consistently exceeded targets by 15% and built strong relationships with over 50 retail clients. Known for excellent negotiation skills and deep product knowledge.
          </p>
        </div>
      </div>
      <Tip>
        The AI will suggest a professional summary based on your input, but you should always customize it for the specific job you're applying for.
      </Tip>
    </div>
  );
}
