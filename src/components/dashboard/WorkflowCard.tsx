// src/components/dashboard/WorkflowCard.tsx
import React from 'react';

interface WorkflowCardProps {
  icon: React.ReactNode;
  title: string;
  count: number | string;
  description: string;
}

export const WorkflowCard: React.FC<WorkflowCardProps> = ({ 
  icon, 
  title, 
  count, 
  description 
}) => {
  return (
    <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-lg">
      <div className="mb-2">
        {icon}
      </div>
      <h3 className="font-medium">{title}</h3>
      <div className="text-2xl font-bold my-1">{count}</div>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
};
