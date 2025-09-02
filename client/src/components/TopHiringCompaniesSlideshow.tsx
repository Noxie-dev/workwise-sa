import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Users, TrendingUp, Briefcase, Award, Zap, Globe, Clock, MapPin, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getTopHiringCompanies, fetchTopHiringCompanies, type CompanyHiringMetrics } from '@/utils/topHiringAlgorithm';

// Interface for top hiring company data
interface TopHiringCompany {
  id: number;
  name: string;
  logo: string;
  description: string;
  location: string;
  industry: string;
  openPositions: number;
  rating: number;
  growthRate: number;
  employeeCount: string;
  isHiringNow: boolean;
  urgentRoles: string[];
  hiringScore: number; // Calculated score based on multiple factors
  benefits?: string[];
  featuredJobTitle?: string;
  featuredJobSalary?: string;
  featuredJobType?: string;
  color?: string; // For visual variety in the slideshow
}

// Convert company data to hiring metrics format with enhanced algorithm
const convertToHiringMetrics = (companies: any[]): CompanyHiringMetrics[] => {
  return companies.map(company => {
    // Calculate recent hires based on company size and growth rate
    const estimatedSize = parseInt(company.employeeCount?.replace(/[^0-9]/g, '') || '1000');
    const sizeMultiplier = Math.log10(Math.max(estimatedSize, 100)) / 4; // Logarithmic scaling
    
    // Calculate job posting frequency based on open positions
    const postingFrequency = Math.ceil(Math.min(company.openPositions / 30, 10));
    
    // Industry demand based on industry type
    const industryDemandMap: {[key: string]: number} = {
      'Retail': 8,
      'Technology': 10,
      'Healthcare': 9,
      'Manufacturing': 7,
      'Security Services': 8,
      'Transport & Logistics': 7,
      'Financial Services': 8,
      'Construction': 7,
      'Education': 6,
      'Hospitality': 6
    };
    
    return {
      id: company.id,
      name: company.name,
      openPositions: company.openPositions || 0,
      rating: company.rating || 0,
      growthRate: company.growthRate || 0,
      employeeCount: company.employeeCount || company.size || '',
      isHiringNow: company.isHiringNow || false,
      // Enhanced metrics with more realistic calculations
      recentHires: Math.floor((company.growthRate || 10) * sizeMultiplier),
      jobPostingFrequency: postingFrequency,
      applicationResponseRate: 60 + Math.floor(company.rating * 8) || 75,
      hiringVelocity: Math.max(5, 30 - Math.floor(company.growthRate / 2)) || 15,
      industryDemand: industryDemandMap[company.industry] || 7,
      urgentPositions: Math.ceil(company.openPositions * 0.2) || 5,
      locationActivity: Math.random() * 10 // Random for now, would be based on location data
    };
  });
};

// Generate top hiring companies using the enhanced algorithm
const generateTopHiringCompanies = (allCompanies: any[]): TopHiringCompany[] => {
  if (allCompanies.length === 0) return [];
  
  const hiringMetrics = convertToHiringMetrics(allCompanies);
  const topCompanies = getTopHiringCompanies(hiringMetrics, 3);
  
  // Brand colors for visual variety
  const brandColors = ['#3B82F6', '#10B981', '#F59E0B'];
  
  return topCompanies.map((company, index) => {
    const sourceCompany = allCompanies.find(c => c.id === company.id);
    
    // Generate featured job based on company industry
    let featuredJob = {
      title: 'General Worker',
      salary: 'R5,000 - R8,000 per month',
      type: 'Full-time'
    };
    
    if (sourceCompany?.industry === 'Retail') {
      featuredJob = {
        title: 'Sales Associate',
        salary: 'R6,000 - R9,000 per month',
        type: 'Full-time'
      };
    } else if (sourceCompany?.industry === 'Security Services') {
      featuredJob = {
        title: 'Security Guard',
        salary: 'R5,500 - R8,500 per month',
        type: 'Shift Work'
      };
    } else if (sourceCompany?.industry === 'Transport & Logistics') {
      featuredJob = {
        title: 'Warehouse Assistant',
        salary: 'R6,500 - R9,500 per month',
        type: 'Full-time'
      };
    }
    
    // Extract benefits from source company or generate placeholder ones
    const benefits = sourceCompany?.benefits || [
      'Training Provided',
      'Career Growth',
      'Medical Aid'
    ];
    
    return {
      ...company,
      logo: sourceCompany?.logo || 'https://via.placeholder.com/150',
      description: sourceCompany?.description || 'Leading employer actively hiring.',
      location: sourceCompany?.location || 'South Africa',
      industry: sourceCompany?.industry || 'Various',
      urgentRoles: sourceCompany?.tags?.slice(0, 3) || ['General Worker', 'Sales Assistant', 'Security Guard'],
      benefits: benefits.slice(0, 3),
      featuredJobTitle: featuredJob.title,
      featuredJobSalary: featuredJob.salary,
      featuredJobType: featuredJob.type,
      color: brandColors[index % brandColors.length]
    };
  });
};

// Enhanced placeholder data for when no real companies are available
const placeholderTopCompanies: TopHiringCompany[] = [
  {
    id: 1,
    name: 'Shoprite Holdings',
    logo: 'https://via.placeholder.com/150',
    description: 'Africa\'s largest food retailer offering entry-level opportunities in retail, warehousing, and customer service.',
    location: 'Cape Town, Western Cape',
    industry: 'Retail',
    openPositions: 245,
    rating: 4.2,
    growthRate: 18,
    employeeCount: '10,000+',
    isHiringNow: true,
    urgentRoles: ['Cashier', 'Stock Controller', 'Customer Service'],
    hiringScore: 92,
    benefits: ['Staff Discount', 'Training Programs', 'Career Growth'],
    featuredJobTitle: 'Retail Assistant',
    featuredJobSalary: 'R5,500 - R7,500 per month',
    featuredJobType: 'Full-time',
    color: '#3B82F6'
  },
  {
    id: 2,
    name: 'Bidvest Group',
    logo: 'https://via.placeholder.com/150',
    description: 'Diversified services group offering entry-level opportunities in cleaning, security, catering, and general services.',
    location: 'Johannesburg, Gauteng',
    industry: 'Services',
    openPositions: 203,
    rating: 4.0,
    growthRate: 22,
    employeeCount: '8,000+',
    isHiringNow: true,
    urgentRoles: ['General Worker', 'Security Officer', 'Cleaner'],
    hiringScore: 89,
    benefits: ['Medical Aid', 'Transport Allowance', 'Skills Training'],
    featuredJobTitle: 'General Services Worker',
    featuredJobSalary: 'R4,500 - R6,500 per month',
    featuredJobType: 'Full-time',
    color: '#10B981'
  },
  {
    id: 3,
    name: 'Transnet SOC Ltd',
    logo: 'https://via.placeholder.com/150',
    description: 'State-owned freight transport and logistics company offering general worker, security, and maintenance positions.',
    location: 'Durban, KwaZulu-Natal',
    industry: 'Transport & Logistics',
    openPositions: 156,
    rating: 3.8,
    growthRate: 15,
    employeeCount: '50,000+',
    isHiringNow: true,
    urgentRoles: ['General Worker', 'Security Guard', 'Maintenance Worker'],
    hiringScore: 87,
    benefits: ['Pension Fund', 'Housing Allowance', 'Job Security'],
    featuredJobTitle: 'Logistics Assistant',
    featuredJobSalary: 'R6,000 - R9,000 per month',
    featuredJobType: 'Permanent',
    color: '#F59E0B'
  }
];

interface TopHiringCompaniesSlideshowProps {
  companies?: any[]; // Real companies data when available
  autoPlay?: boolean;
  interval?: number;
  limit?: number;
}

const TopHiringCompaniesSlideshow: React.FC<TopHiringCompaniesSlideshowProps> = ({
  companies = [],
  autoPlay = true,
  interval = 5000,
  limit = 3
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [topCompanies, setTopCompanies] = useState<TopHiringCompany[]>([]);
  
  // Fetch top hiring companies - this would connect to the API when live
  const fetchTopCompanies = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // In production, this would use fetchTopHiringCompanies() to get data from API
      // For now, generate from available companies or use placeholders
      const result = companies.length > 0 
        ? generateTopHiringCompanies(companies)
        : placeholderTopCompanies;
        
      setTopCompanies(result);
    } catch (error) {
      console.error('Error fetching top hiring companies:', error);
      setTopCompanies(placeholderTopCompanies);
    } finally {
      setIsLoading(false);
    }
  }, [companies]);
  
  // Initial fetch
  useEffect(() => {
    fetchTopCompanies();
  }, [fetchTopCompanies]);

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || topCompanies.length === 0) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % topCompanies.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, topCompanies.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % topCompanies.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + topCompanies.length) % topCompanies.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  if (isLoading) {
    return (
      <div className="relative w-full max-w-4xl mx-auto">
        <div className="relative h-64 md:h-80 overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-t-transparent border-white rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/80">Loading top hiring companies...</p>
          </div>
        </div>
      </div>
    );
  }

  if (topCompanies.length === 0) {
    return null;
  }

  const company = topCompanies[currentSlide];

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Main Slideshow */}
      <div 
        className="relative h-auto md:h-96 overflow-hidden rounded-2xl shadow-lg border border-gray-100"
        style={{
          background: `linear-gradient(135deg, ${company.color || '#3B82F6'}15 0%, ${company.color || '#3B82F6'}33 100%)`,
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="absolute inset-0 p-6 md:p-8"
          >
            <div className="flex flex-col h-full">
              {/* Header with Logo and Top Badge */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16 md:w-20 md:h-20 border-4 border-white/30 shadow-lg">
                    <AvatarImage src={company.logo} alt={company.name} />
                    <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white font-bold text-2xl">
                      {company.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Badge className="bg-yellow-400/20 text-yellow-300 border-yellow-400/30 mb-1">
                      <Award className="h-3 w-3 mr-1" />
                      #{currentSlide + 1} Top Hiring
                    </Badge>
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
                      {company.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-3 w-3" />
                      {company.location}
                    </div>
                  </div>
                </div>
                
                <div className="hidden md:block">
                  <div className="text-center bg-gray-800/90 backdrop-blur-sm rounded-full px-4 py-2">
                    <div className="text-3xl font-bold text-white">{company.hiringScore}</div>
                    <div className="text-xs text-white/80">Hiring Score</div>
                  </div>
                </div>
              </div>
              
              {/* Main Content */}
              <div className="grid md:grid-cols-2 gap-6 mt-4">
                {/* Left Column - Company Info */}
                <div>
                  <p className="text-gray-700 mb-4 text-sm md:text-base">
                    {company.description}
                  </p>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                      <Briefcase className="h-4 w-4 text-yellow-400 mx-auto mb-1" />
                      <div className="font-bold text-lg text-yellow-400">{company.openPositions}</div>
                      <div className="text-xs text-white/80">Open Roles</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current mx-auto mb-1" />
                      <div className="font-bold text-lg text-white">{company.rating}</div>
                      <div className="text-xs text-white/80">Rating</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                      <TrendingUp className="h-4 w-4 text-green-400 mx-auto mb-1" />
                      <div className="font-bold text-lg text-green-400">{company.growthRate}%</div>
                      <div className="text-xs text-white/80">Growth</div>
                    </div>
                  </div>
                  
                  {/* Benefits */}
                  <div className="mb-4">
                    <h4 className="text-white/90 text-sm font-semibold mb-2">Benefits</h4>
                    <div className="flex flex-wrap gap-2">
                      {company.benefits?.map((benefit, index) => (
                        <Badge key={index} variant="outline" className="bg-white/10 text-white border-white/30 text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {benefit}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Right Column - Featured Job */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="h-4 w-4 text-yellow-400" />
                    <h4 className="text-white font-semibold">Featured Entry-Level Position</h4>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-2">{company.featuredJobTitle}</h3>
                  
                  <div className="flex items-center gap-4 text-sm text-white/80 mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {company.featuredJobType}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {company.employeeCount}
                    </div>
                  </div>
                  
                  <div className="bg-white/10 rounded-lg p-3 mb-4">
                    <div className="text-sm text-white/80">Salary Range</div>
                    <div className="text-xl font-bold text-white">{company.featuredJobSalary}</div>
                  </div>
                  
                  {/* Urgent Roles */}
                  <div className="mb-4">
                    <h4 className="text-white/90 text-sm font-semibold mb-2">Other Urgent Roles</h4>
                    <div className="flex flex-wrap gap-2">
                      {company.urgentRoles.map((role, index) => (
                        <Badge key={index} variant="outline" className="bg-white/10 text-white border-white/30 text-xs">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <Button 
                    size="lg" 
                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold"
                  >
                    View All Jobs
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        <Button
          variant="ghost"
          size="sm"
          onClick={prevSlide}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 rounded-full p-2"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={nextSlide}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 rounded-full p-2"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Slide Indicators */}
      <div className="flex justify-center mt-4 gap-2">
        {topCompanies.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'bg-yellow-400 scale-110' 
                : 'bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>

      {/* Algorithm Info (for development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-white/10 rounded-lg text-white/70 text-xs">
          <strong>Algorithm:</strong> Hiring score calculated from: Open positions (25%), Growth rate (10%), 
          Rating (15%), Hiring activity (20%), Industry demand (10%), Hiring velocity (15%), Urgency (5%)
        </div>
      )}
    </div>
  );
};

export default TopHiringCompaniesSlideshow;