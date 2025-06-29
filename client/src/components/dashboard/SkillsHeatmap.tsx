import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Download } from 'lucide-react';
import { SkillsAnalysisData } from '@/services/dashboardService';

// Define the color scale for the heatmap
const getHeatmapColor = (value: number): string => {
  // Scale from 0-100
  if (value >= 80) return 'bg-red-600';
  if (value >= 60) return 'bg-orange-500';
  if (value >= 40) return 'bg-yellow-400';
  if (value >= 20) return 'bg-green-400';
  return 'bg-blue-300';
};

interface SkillsHeatmapProps {
  data?: SkillsAnalysisData;
  isLoading: boolean;
  onExport?: () => void;
}

const SkillsHeatmap: React.FC<SkillsHeatmapProps> = ({ 
  data, 
  isLoading,
  onExport 
}) => {
  const [view, setView] = useState<'demand' | 'growth'>('demand');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-8 w-3/4" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-1/2" />
          </CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 15 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.marketDemand || data.marketDemand.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Skills Heatmap</CardTitle>
          <CardDescription>Visualization of skills demand and growth</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <div className="flex items-center justify-center h-full text-gray-500">
            No skills data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Skills Heatmap</CardTitle>
          <CardDescription>
            {view === 'demand' 
              ? 'Current market demand for skills' 
              : 'Year-on-year growth rate for skills'}
          </CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Select
            value={view}
            onValueChange={(value) => setView(value as 'demand' | 'growth')}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="demand">Demand</SelectItem>
              <SelectItem value="growth">Growth</SelectItem>
            </SelectContent>
          </Select>
          {onExport && (
            <Button variant="outline" size="icon" onClick={onExport}>
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {data.marketDemand.map((skill) => {
            const value = view === 'demand' ? skill.demand : skill.growth;
            const colorClass = getHeatmapColor(value);
            
            return (
              <div 
                key={skill.skill} 
                className={`${colorClass} rounded-md p-3 text-center transition-all hover:scale-105`}
              >
                <div className="font-medium text-white text-shadow">{skill.skill}</div>
                <div className="text-xs font-bold text-white text-shadow">
                  {view === 'demand' ? `${value}%` : `+${value}%`}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default SkillsHeatmap;
