import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Star,
  Users,
  Zap,
  Award,
  Building2,
  ArrowRight,
  Crown,
  Rocket,
  Heart
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

interface FeaturedCompany {
  id: number;
  name: string;
  logo: string;
  industry: string;
  rating: number;
  growthRate: number;
  openPositions: number;
  isHiringNow: boolean;
  isTrending: boolean;
  isTopRated: boolean;
  employees: string;
  description: string;
}

const featuredCompanies: FeaturedCompany[] = [
  {
    id: 1,
    name: 'Shoprite Holdings',
    logo: 'https://via.placeholder.com/150',
    industry: 'Retail',
    rating: 4.1,
    growthRate: 12,
    openPositions: 245,
    isHiringNow: true,
    isTrending: true,
    isTopRated: true,
    employees: '10,000+',
    description: 'Africa\'s largest food retailer - always hiring entry-level staff'
  },
  {
    id: 2,
    name: 'ADT Security',
    logo: 'https://via.placeholder.com/150',
    industry: 'Security',
    rating: 3.7,
    growthRate: 14,
    openPositions: 278,
    isHiringNow: true,
    isTrending: true,
    isTopRated: false,
    employees: '12,000+',
    description: 'Leading security provider with training programs'
  },
  {
    id: 3,
    name: 'Pick n Pay',
    logo: 'https://via.placeholder.com/150',
    industry: 'Retail',
    rating: 4.2,
    growthRate: 8,
    openPositions: 189,
    isHiringNow: true,
    isTrending: false,
    isTopRated: false,
    employees: '5,000+',
    description: 'Community-focused retailer with growth opportunities'
  }
];

const topIndustries = [
  { name: 'Retail & Wholesale', growth: 25, companies: 340 },
  { name: 'Security Services', growth: 18, companies: 156 },
  { name: 'Transport & Logistics', growth: 15, companies: 89 },
  { name: 'Cleaning & Maintenance', growth: 22, companies: 234 }
];

const FeaturedCompaniesWidget: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Top 10 Hiring Companies This Week */}
      <Card className="border-0 shadow-lg bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Top Entry-Level Employers
            <Badge variant="secondary" className="ml-auto text-xs">This Week</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {featuredCompanies.map((company, index) => (
            <motion.div
              key={company.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="group cursor-pointer"
            >
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="relative">
                  <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                    <AvatarImage src={company.logo} alt={company.name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                      {company.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {company.isTopRated && (
                    <Crown className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm truncate group-hover:text-blue-600 transition-colors">
                      {company.name}
                    </h4>
                    {company.isTrending && (
                      <Rocket className="h-3 w-3 text-orange-500" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {company.rating}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {company.employees}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{company.industry}</span>
                    <div className="flex items-center gap-1">
                      {company.isHiringNow && (
                        <Badge className="bg-green-100 text-green-700 text-xs px-2 py-0">
                          <Zap className="h-2 w-2 mr-1" />
                          {company.openPositions}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          
          <Button variant="outline" className="w-full mt-4 text-sm">
            View All Companies
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      {/* Fastest Growing Industries */}
      <Card className="border-0 shadow-lg bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Rocket className="h-5 w-5 text-orange-500" />
            Top Industries for Entry-Level Jobs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {topIndustries.map((industry, index) => (
            <motion.div
              key={industry.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-sm">{industry.name}</h4>
                  <p className="text-xs text-gray-600">{industry.companies} companies</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-green-600">+{industry.growth}%</div>
                  <div className="text-xs text-gray-500">growth</div>
                </div>
              </div>
              <Progress value={industry.growth} className="h-2" />
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Featured Startup of the Day */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Award className="h-5 w-5 text-purple-500" />
            Entry-Level Employer Spotlight
            <Badge className="ml-auto bg-purple-100 text-purple-700 text-xs">Today</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <Avatar className="w-16 h-16 mx-auto border-4 border-white shadow-lg">
              <AvatarImage src="https://via.placeholder.com/150" alt="GrowSA" />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white font-bold text-xl">
                G
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h3 className="font-bold text-lg mb-1">Clicks Group</h3>
              <p className="text-sm text-gray-600 mb-3">
                Health & beauty retailer offering entry-level positions with excellent training and career growth
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="font-bold text-primary">98</div>
                  <div className="text-xs text-muted-foreground">Entry-Level Jobs</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-primary">4.4★</div>
                  <div className="text-xs text-muted-foreground">Rating</div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 bg-primary hover:bg-primary/90">
                  <Building2 className="h-4 w-4 mr-2" />
                  View Profile
                </Button>
                <Button variant="outline" size="sm">
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Most Followed Companies */}
      <Card className="border-0 shadow-lg bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="h-5 w-5 text-red-500" />
            Most Followed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'Shoprite Holdings', followers: '25.3K', change: '+8%' },
              { name: 'Pick n Pay', followers: '18.7K', change: '+12%' },
              { name: 'Woolworths', followers: '22.1K', change: '+6%' },
              { name: 'ADT Security', followers: '14.5K', change: '+15%' }
            ].map((company, index) => (
              <div key={company.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500 w-4">#{index + 1}</span>
                  <span className="font-medium text-sm">{company.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{company.followers}</div>
                  <div className="text-xs text-green-600">{company.change}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeaturedCompaniesWidget;