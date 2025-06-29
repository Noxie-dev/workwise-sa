import React from 'react';
import { AlertCircle } from 'lucide-react';

interface TipProps {
  children: React.ReactNode;
}

/**
 * A reusable Tip component for displaying helpful tips in the CV Builder Help Guide
 */
export default function Tip({ children }: TipProps) {
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4 rounded">
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
        <div>
          <p className="font-medium text-yellow-800">Pro Tip</p>
          <p className="text-yellow-700">{children}</p>
        </div>
      </div>
    </div>
  );
}
