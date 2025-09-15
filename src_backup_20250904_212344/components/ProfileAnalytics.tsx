import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Heart, 
  MessageSquare, 
  TrendingUp, 
  Users, 
  Calendar,
  Award,
  Target
} from 'lucide-react';

interface ProfileAnalyticsProps {
  profile: any;
  className?: string;
}

const ProfileAnalytics: React.FC<ProfileAnalyticsProps> = ({
  profile,
  className = ''
}) => {
  // Mock analytics data - in real implementation, this would come from the backend
  const analytics = {
    profileViews: {
      total: 127,
      thisWeek: 23,
      trend: '+15%'
    },
    jobMatches: {
      total: 45,
      thisWeek: 8,
      trend: '+12%'
    },
    recruiterInterest: {
      total: 12,
      thisWeek: 3,
      trend: '+25%'
    },
    applicationSuccess: {
      rate: 18,
      trend: '+5%'
    },
    profileStrength: {
      score: profile?.engagementScore || 25,
      maxScore: 100
    },
    topSkillsViewed: [
      { skill: 'Customer Service', views: 34 },
      { skill: 'Communication', views: 28 },
      { skill: 'Time Management', views: 22 },
      { skill: 'Problem Solving', views: 19 }
    ],
    recentActivity: [
      { type: 'view', count: 5, label: 'Profile views today' },
      { type: 'match', count: 2, label: 'New job matches' },
      { type: 'interest', count: 1, label: 'Recruiter saved your profile' }
    ]
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-50';
    if (score >= 60) return 'bg-blue-50';
    if (score >= 40) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Profile Strength Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Profile Strength
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Score</span>
              <Badge 
                variant="outline" 
                className={`${getScoreColor(analytics.profileStrength.score)} ${getScoreBgColor(analytics.profileStrength.score)} border-current`}
              >
                {analytics.profileStrength.score}/100
              </Badge>
            </div>
            <Progress 
              value={analytics.profileStrength.score} 
              className="h-3"
            />
            <div className="text-xs text-gray-500">
              {analytics.profileStrength.score < 50 && (
                <p>Complete more sections to improve your profile strength and visibility.</p>
              )}
              {analytics.profileStrength.score >= 50 && analytics.profileStrength.score < 80 && (
                <p>Good progress! Add more details to reach the next level.</p>
              )}
              {analytics.profileStrength.score >= 80 && (
                <p>Excellent! Your profile is highly optimized for job matching.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Profile Views</p>
                <p className="text-2xl font-bold">{analytics.profileViews.total}</p>
                <p className="text-xs text-green-600">{analytics.profileViews.trend} this week</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Job Matches</p>
                <p className="text-2xl font-bold">{analytics.jobMatches.total}</p>
                <p className="text-xs text-green-600">{analytics.jobMatches.trend} this week</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Target className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recruiter Interest</p>
                <p className="text-2xl font-bold">{analytics.recruiterInterest.total}</p>
                <p className="text-xs text-green-600">{analytics.recruiterInterest.trend} this week</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold">{analytics.applicationSuccess.rate}%</p>
                <p className="text-xs text-green-600">{analytics.applicationSuccess.trend} this month</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Skills Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Most Viewed Skills
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.topSkillsViewed.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium">{item.skill}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(item.views / analytics.topSkillsViewed[0].views) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-8">{item.views}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  {activity.type === 'view' && <Eye className="h-4 w-4 text-blue-600" />}
                  {activity.type === 'match' && <Target className="h-4 w-4 text-green-600" />}
                  {activity.type === 'interest' && <Heart className="h-4 w-4 text-red-600" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.label}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {activity.count}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileAnalytics;