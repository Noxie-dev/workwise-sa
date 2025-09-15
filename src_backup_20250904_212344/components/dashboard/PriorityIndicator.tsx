// src/components/dashboard/PriorityIndicator.tsx
import React from 'react';

interface PriorityIndicatorProps {
  priority: number;
}

export const PriorityIndicator: React.FC<PriorityIndicatorProps> = ({ priority }) => {
  const getColor = (priority: number) => {
    switch (priority) {
      case 1:
        return 'bg-gray-300';
      case 2:
        return 'bg-blue-300';
      case 3:
        return 'bg-green-300';
      case 4:
        return 'bg-yellow-300';
      case 5:
        return 'bg-red-300';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <div className="flex items-center">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className={`h-2 w-2 rounded-full mx-0.5 ${
            index < priority ? getColor(priority) : 'bg-gray-100'
          }`}
        />
      ))}
      <span className="ml-2 text-xs text-gray-500">{priority}</span>
    </div>
  );
};
