import React from 'react';
import Tip from '../Tip';

/**
 * Education section content for the CV Builder Help Guide
 */
export default function EducationContent() {
  return (
    <div className="space-y-4">
      <ul className="list-disc pl-5 space-y-2">
        <li>List qualifications in reverse chronological order</li>
        <li>Include institution name, qualification, and graduation date</li>
        <li>For tertiary education, mention major subjects and grades if impressive</li>
        <li>For Matric, include key subjects and overall achievement level</li>
      </ul>
      <div className="border rounded p-4 bg-gray-50 mt-4">
        <h4 className="font-medium text-gray-700 mb-2">Example:</h4>
        <p className="font-medium">National Senior Certificate (Matric), NSC</p>
        <p className="text-sm">Pretoria High School, Pretoria | December 2022</p>
        <p className="text-sm mt-1">Key subjects: Mathematics (5), English (6), Life Sciences (5), Computer Applications Technology (6)</p>
        <p className="text-sm">Overall Bachelor Pass with 4 distinctions</p>
      </div>
      <Tip>
        In South Africa, specify the type of Matric certificate (NSC, IEB) and include any NQF levels for qualifications where applicable.
      </Tip>
    </div>
  );
}
