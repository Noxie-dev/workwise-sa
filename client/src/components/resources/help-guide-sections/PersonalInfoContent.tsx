import React from 'react';
import Tip from '../Tip';

/**
 * Personal Information section content for the CV Builder Help Guide
 */
export default function PersonalInfoContent() {
  return (
    <div className="space-y-4">
      <p>The first step in creating your CV is completing your personal information:</p>
      <ul className="list-disc pl-5 space-y-3">
        <li><span className="font-medium">Full Name:</span> Enter your complete legal name as it appears on official documents</li>
        <li><span className="font-medium">Email:</span> Use a professional email address (avoid nicknames)</li>
        <li><span className="font-medium">Phone:</span> Include your mobile number with the South African country code (+27)</li>
        <li><span className="font-medium">Address:</span> Your city and province are sufficient (full street address not required)</li>
      </ul>
      <Tip>
        Make sure your contact information is up-to-date and professional. Many employers in South Africa still prefer phone contact, so ensure your number is correct.
      </Tip>
      <div className="border rounded p-4 bg-gray-50">
        <h4 className="font-medium text-gray-700 mb-2">Example:</h4>
        <p><strong>Full Name:</strong> Thabo Ndlovu</p>
        <p><strong>Email:</strong> thabo.ndlovu@email.co.za</p>
        <p><strong>Phone:</strong> +27 82 123 4567</p>
        <p><strong>Address:</strong> Cape Town, Western Cape</p>
      </div>
    </div>
  );
}
