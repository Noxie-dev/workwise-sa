import React from 'react';

/**
 * Industry Tips section content for the CV Builder Help Guide
 */
export default function IndustryTipsContent() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-blue-800">Entry-Level/Low-Skilled Positions:</h3>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Emphasize reliability, work ethic, and willingness to learn</li>
          <li>Include any relevant volunteer work or community involvement</li>
          <li>Highlight practical skills like computer literacy, customer service experience</li>
        </ul>
      </div>
      <div>
        <h3 className="font-semibold text-blue-800">Retail/Hospitality:</h3>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Focus on customer service skills and experience</li>
          <li>Mention cash handling experience if applicable</li>
          <li>Include flexible availability for shifts</li>
        </ul>
      </div>
      <div>
        <h3 className="font-semibold text-blue-800">Administrative/Clerical:</h3>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Emphasize computer literacy and specific software knowledge</li>
          <li>Highlight organizational skills and attention to detail</li>
          <li>Mention typing speed if impressive</li>
        </ul>
      </div>
      <div>
        <h3 className="font-semibold text-blue-800">Manufacturing/Construction:</h3>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>List specific technical skills and certifications</li>
          <li>Mention health and safety training</li>
          <li>Include experience with specific machinery or processes</li>
        </ul>
      </div>
    </div>
  );
}
