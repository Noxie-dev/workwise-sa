import React from 'react';
import Tip from '../Tip';

/**
 * References section content for the CV Builder Help Guide
 */
export default function ReferencesContent() {
  return (
    <div className="space-y-4">
      <ul className="list-disc pl-5 space-y-2">
        <li>Include 2-3 professional references</li>
        <li>Provide name, job title, company, and contact information</li>
        <li>Always get permission before listing someone as a reference</li>
      </ul>
      <div className="border rounded p-4 bg-gray-50 mt-4">
        <h4 className="font-medium text-gray-700 mb-2">Example:</h4>
        <div className="space-y-3">
          <div>
            <p className="font-medium">Mrs. Sarah Naidoo</p>
            <p className="text-sm">Store Manager, ABC Retail Store</p>
            <p className="text-sm">sarah.naidoo@abcretail.co.za | +27 83 123 4567</p>
          </div>
          <div>
            <p className="font-medium">Mr. John Molefe</p>
            <p className="text-sm">Assistant Principal, Pretoria High School</p>
            <p className="text-sm">j.molefe@pretoriahigh.co.za | +27 82 987 6543</p>
          </div>
        </div>
      </div>
      <Tip>
        In South Africa, references are typically checked, so ensure your references can speak positively about your work ethic and performance.
      </Tip>
    </div>
  );
}
