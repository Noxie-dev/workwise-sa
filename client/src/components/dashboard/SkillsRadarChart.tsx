import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Download } from 'lucide-react';
import { SkillsAnalysisData } from '@/services/dashboardService';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface SkillsRadarChartProps {
  data?: SkillsAnalysisData;
  isLoading: boolean;
  onExport?: () => void;
}

const SkillsRadarChart: React.FC<SkillsRadarChartProps> = ({ 
  data, 
  isLoading,
  onExport 
}) => {
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
          <Skeleton className="h-full w-full rounded-md" />
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.marketDemand || data.marketDemand.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Skills Radar Analysis</CardTitle>
          <CardDescription>Comparison of your skills vs market demand</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <div className="flex items-center justify-center h-full text-gray-500">
            No skills data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Transform data for radar chart
  const radarData = data.marketDemand.slice(0, 8).map(skill => {
    // Find if user has this skill
    const userSkill = data.userSkills.find(us => us.skill.toLowerCase() === skill.skill.toLowerCase());
    
    // Convert user skill level to a numeric value
    let userSkillValue = 0;
    if (userSkill) {
      switch (userSkill.level.toLowerCase()) {
        case 'beginner': userSkillValue = 25; break;
        case 'basic': userSkillValue = 35; break;
        case 'intermediate': userSkillValue = 60; break;
        case 'advanced': userSkillValue = 85; break;
        case 'expert': userSkillValue = 95; break;
        default: userSkillValue = 30;
      }
    }
    
    return {
      skill: skill.skill,
      marketDemand: skill.demand,
      userSkill: userSkillValue,
      growth: skill.growth
    };
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Skills Radar Analysis</CardTitle>
          <CardDescription>Comparison of your skills vs market demand</CardDescription>
        </div>
        {onExport && (
          <Button variant="outline" size="icon" onClick={onExport}>
            <Download className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="skill" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} />
            <Radar
              name="Market Demand"
              dataKey="marketDemand"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.6}
            />
            <Radar
              name="Your Skills"
              dataKey="userSkill"
              stroke="#82ca9d"
              fill="#82ca9d"
              fillOpacity={0.6}
            />
            <Radar
              name="Growth Rate"
              dataKey="growth"
              stroke="#ffc658"
              fill="#ffc658"
              fillOpacity={0.6}
            />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default SkillsRadarChart;
