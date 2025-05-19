import React from 'react';

/**
 * Troubleshooting and Support section content for the CV Builder Help Guide
 */
export default function TroubleshootingSupportContent() {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="bg-gray-50 p-3 rounded border">
          <p className="font-medium">Problem: Can't proceed to the next section</p>
          <p className="text-sm mt-1">Solution: Ensure all required fields in the current section are filled out</p>
        </div>
        <div className="bg-gray-50 p-3 rounded border">
          <p className="font-medium">Problem: CV not generating</p>
          <p className="text-sm mt-1">Solution: Try refreshing the page and ensure all required sections are complete</p>
        </div>
        <div className="bg-gray-50 p-3 rounded border">
          <p className="font-medium">Problem: Information not saving</p>
          <p className="text-sm mt-1">Solution: Check your internet connection and make sure you're logged into your WorkWise SA account</p>
        </div>
      </div>
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mt-6">
        <h4 className="font-medium text-blue-800 mb-3">Need More Help?</h4>
        <ul className="space-y-2 text-blue-700">
          <li className="flex items-center">
            <span className="font-medium mr-2">Email Support:</span>
            <span>help@workwisesa.co.za</span>
          </li>
          <li className="flex items-center">
            <span className="font-medium mr-2">WhatsApp Assistance:</span>
            <span>+27 XX XXX XXXX</span>
          </li>
          <li className="flex items-center">
            <span className="font-medium mr-2">Live Chat:</span>
            <span>Available Monday-Friday, 8am-5pm</span>
          </li>
        </ul>
      </div>
      <p className="text-center text-gray-600 italic mt-6">
        Remember, a well-crafted CV is your first step toward landing your dream job.
        Take the time to make it accurate, professional, and tailored to the position you want.
      </p>
    </div>
  );
}
