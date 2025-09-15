// src/components/dashboard/StatCard.tsx
import React from 'react';
import { Card, CardContent } from '../ui/card';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend: number;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend }) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value.toLocaleString()}</h3>
          </div>
          <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
            {icon}
          </div>
        </div>
        
        {trend !== 0 && (
          <div className="mt-4 flex items-center">
            {trend > 0 ? (
              <div className="flex items-center text-green-500 text-sm">
                <ArrowUpIcon className="h-4 w-4 mr-1" />
                <span>{Math.abs(trend)}% increase</span>
              </div>
            ) : (
              <div className="flex items-center text-red-500 text-sm">
                <ArrowDownIcon className="h-4 w-4 mr-1" />
                <span>{Math.abs(trend)}% decrease</span>
              </div>
            )}
            <span className="text-gray-500 text-sm ml-1">from last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
