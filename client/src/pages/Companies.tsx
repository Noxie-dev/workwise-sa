import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  MapPin,
  Users,
  Building2,
  Star,
  Briefcase,
  Globe,
  Zap,
  TrendingUp,
  Award,
  CheckCircle,
  Heart,
  Eye,
  ArrowRight,
  Sparkles
} from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

import { mockCompanies, createMockResponse } from '@/services/mockData';
import { type Company } from '@shared/schema';
import CompanySearchAssistant from '@/components/CompanySearchAssistant';
import FeaturedCompaniesWidget from '@/components/FeaturedCompaniesWidget';

// Extended company interface for the enhanced page
interface ExtendedCompany extends Company {
  slug: string;
  openPositions: number;
  rating?: number;
  reviews?: number;
  isVerified?: boolean;
  isHiringNow?: boolean;
  isRemoteFriendly?: boolean;
  techStack?: string[];
  benefits?: string[];
  culture?: string[];
  funding?: string;
  growthRate?: number;
  employeeCount?: string;
  glassdoorRating?: number;
  tags?: string[];
}

// Mock extended companies data - focused on entry-level employers
export const mockExtendedCompanies: ExtendedCompany[] = [
  {
    id: 1,
    name: 'Shoprite Holdings',
    logo: 'https://via.placeholder.com/150',
    description: 'Africa\'s largest food retailer offering entry-level opportunities in retail, warehousing, and customer service across South Africa.',
    location: 'Cape Town, Western Cape',
    industry: 'Retail',
    size: '10,000+ employees',
    website: 'https://shoprite.co.za',
    foundedYear: 1979,
    slug: 'shoprite-holdings',
    openPositions: 245,
    rating: 4.1,
    reviews: 1247,
    isVerified: true,
    isHiringNow: true,
    isRemoteFriendly: false,
    benefits: ['Medical Aid', 'Staff Discount', 'Training Programs', 'Career Growth'],
    culture: ['Team Work', 'Customer Focus', 'Growth Opportunities'],
    growthRate: 12,
    employeeCount: '10,000+',
    glassdoorRating: 4.0,
    tags: ['Retail', 'Entry-Level Friendly', 'Large Employer', 'Training Provided']
  },
  {
    id: 2,
    name: 'Pick n Pay',
    logo: 'https://via.placeholder.com/150',
    description: 'Leading South African retailer providing thousands of entry-level jobs in stores, distribution centers, and customer service.',
    location: 'Johannesburg, Gauteng',
    industry: 'Retail',
    size: '5,000+ employees',
    website: 'https://picknpay.co.za',
    foundedYear: 1967,
    slug: 'pick-n-pay',
    openPositions: 189,
    rating: 4.2,
    reviews: 892,
    isVerified: true,
    isHiringNow: true,
    isRemoteFriendly: false,
    benefits: ['Medical Aid', 'Employee Discount', 'Skills Development', 'Pension Fund'],
    culture: ['Community', 'Respect', 'Opportunity'],
    growthRate: 8,
    employeeCount: '5,000+',
    glassdoorRating: 4.1,
    tags: ['Retail', 'Community Focused', 'Skills Development', 'Stable Employment']
  },
  {
    id: 3,
    name: 'Transnet SOC Ltd',
    logo: 'https://via.placeholder.com/150',
    description: 'State-owned freight transport and logistics company offering general worker, security, and maintenance positions.',
    location: 'Durban, KwaZulu-Natal',
    industry: 'Transport & Logistics',
    size: '50,000+ employees',
    website: 'https://transnet.net',
    foundedYear: 1990,
    slug: 'transnet',
    openPositions: 156,
    rating: 3.8,
    reviews: 2341,
    isVerified: true,
    isHiringNow: true,
    isRemoteFriendly: false,
    benefits: ['Medical Aid', 'Pension Fund', 'Housing Allowance', 'Training'],
    culture: ['Safety First', 'Teamwork', 'Nation Building'],
    growthRate: 5,
    employeeCount: '50,000+',
    glassdoorRating: 3.7,
    tags: ['Government', 'General Worker', 'Benefits', 'Job Security']
  },
  {
    id: 4,
    name: 'Woolworths Holdings',
    logo: 'https://via.placeholder.com/150',
    description: 'Premium retailer offering entry-level positions in retail, warehousing, and customer service with excellent training programs.',
    location: 'Cape Town, Western Cape',
    industry: 'Retail',
    size: '3,000+ employees',
    website: 'https://woolworths.co.za',
    foundedYear: 1931,
    slug: 'woolworths',
    openPositions: 134,
    rating: 4.3,
    reviews: 567,
    isVerified: true,
    isHiringNow: true,
    isRemoteFriendly: false,
    benefits: ['Medical Aid', 'Staff Discount', 'Learning & Development', 'Performance Bonus'],
    culture: ['Quality', 'Sustainability', 'People Development'],
    growthRate: 15,
    employeeCount: '3,000+',
    glassdoorRating: 4.2,
    tags: ['Premium Retail', 'Training Excellence', 'Career Growth', 'Quality Focus']
  },
  {
    id: 5,
    name: 'Bidvest Group',
    logo: 'https://via.placeholder.com/150',
    description: 'Diversified services group offering entry-level opportunities in cleaning, security, catering, and general services.',
    location: 'Johannesburg, Gauteng',
    industry: 'Services',
    size: '8,000+ employees',
    website: 'https://bidvest.com',
    foundedYear: 1988,
    slug: 'bidvest-group',
    openPositions: 203,
    rating: 4.0,
    reviews: 1156,
    isVerified: true,
    isHiringNow: true,
    isRemoteFriendly: false,
    benefits: ['Medical Aid', 'Uniform Provided', 'Transport Allowance', 'Skills Training'],
    culture: ['Service Excellence', 'Diversity', 'Growth'],
    growthRate: 18,
    employeeCount: '8,000+',
    glassdoorRating: 3.9,
    tags: ['Services', 'Diverse Opportunities', 'Entry-Level', 'Growing']
  },
  {
    id: 6,
    name: 'Massmart Holdings',
    logo: 'https://via.placeholder.com/150',
    description: 'Wholesale and retail group (Game, Makro, Builders) offering numerous entry-level positions across South Africa.',
    location: 'Johannesburg, Gauteng',
    industry: 'Retail & Wholesale',
    size: '15,000+ employees',
    website: 'https://massmart.co.za',
    foundedYear: 1990,
    slug: 'massmart',
    openPositions: 167,
    rating: 3.9,
    reviews: 934,
    isVerified: true,
    isHiringNow: true,
    isRemoteFriendly: false,
    benefits: ['Medical Aid', 'Employee Discount', 'Training Programs', 'Career Progression'],
    culture: ['Customer First', 'Teamwork', 'Excellence'],
    growthRate: 10,
    employeeCount: '15,000+',
    glassdoorRating: 3.8,
    tags: ['Retail', 'Wholesale', 'Multiple Brands', 'Career Progression']
  },
  {
    id: 7,
    name: 'Clicks Group',
    logo: 'https://via.placeholder.com/150',
    description: 'Leading health and beauty retailer offering entry-level positions in retail, pharmacy support, and customer service.',
    location: 'Cape Town, Western Cape',
    industry: 'Health & Beauty Retail',
    size: '2,500+ employees',
    website: 'https://clicks.co.za',
    foundedYear: 1968,
    slug: 'clicks-group',
    openPositions: 98,
    rating: 4.4,
    reviews: 445,
    isVerified: true,
    isHiringNow: true,
    isRemoteFriendly: false,
    benefits: ['Medical Aid', 'Staff Discount', 'Study Assistance', 'Wellness Programs'],
    culture: ['Health & Wellness', 'Customer Care', 'Professional Growth'],
    growthRate: 22,
    employeeCount: '2,500+',
    glassdoorRating: 4.3,
    tags: ['Health & Beauty', 'Professional Environment', 'Study Support', 'Growing']
  },
  {
    id: 8,
    name: 'ADT Security',
    logo: 'https://via.placeholder.com/150',
    description: 'Leading security services provider offering entry-level security guard, monitoring, and response team positions.',
    location: 'Pretoria, Gauteng',
    industry: 'Security Services',
    size: '12,000+ employees',
    website: 'https://adt.co.za',
    foundedYear: 1995,
    slug: 'adt-security',
    openPositions: 278,
    rating: 3.7,
    reviews: 1567,
    isVerified: true,
    isHiringNow: true,
    isRemoteFriendly: false,
    benefits: ['Medical Aid', 'Uniform & Equipment', 'Training Provided', 'Shift Allowances'],
    culture: ['Safety First', 'Reliability', 'Community Protection'],
    growthRate: 14,
    employeeCount: '12,000+',
    glassdoorRating: 3.6,
    tags: ['Security', 'Essential Service', 'Training Provided', 'Shift Work']
  }
];

const Companies: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedSize, setSelectedSize] = useState('all');
  const [hiringNowOnly, setHiringNowOnly] = useState(false);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('rating');

  // Fetch companies data
  const { data: companiesResponse, isLoading } = useQuery({
    queryKey: ['/api/companies'],
    queryFn: async () => {
      // Use mock data for now
      return createMockResponse(mockExtendedCompanies);
    }
  });

  const companies = companiesResponse?.data || [];

  // Filter and sort companies
  const filteredCompanies = useMemo(() => {
    let filtered = companies.filter((company) => {
      const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           company.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           company.industry?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesIndustry = selectedIndustry === 'all' || company.industry === selectedIndustry;
      const matchesLocation = selectedLocation === 'all' || company.location.includes(selectedLocation);
      const matchesSize = selectedSize === 'all' || company.size === selectedSize;
      const matchesHiring = !hiringNowOnly || company.isHiringNow;
      const matchesRemote = !remoteOnly || company.isRemoteFriendly;
      const matchesVerified = !verifiedOnly || company.isVerified;

      return matchesSearch && matchesIndustry && matchesLocation && 
             matchesSize && matchesHiring && matchesRemote && matchesVerified;
    });

    // Sort companies
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'positions':
          return b.openPositions - a.openPositions;
        case 'growth':
          return (b.growthRate || 0) - (a.growthRate || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [companies, searchQuery, selectedIndustry, selectedLocation, selectedSize, 
      hiringNowOnly, remoteOnly, verifiedOnly, sortBy]);

  const industries = [...new Set(companies.map(c => c.industry).filter(Boolean))];
  const locations = [...new Set(companies.map(c => c.location.split(',')[1]?.trim()).filter(Boolean))];
  const sizes = [...new Set(companies.map(c => c.size).filter(Boolean))];

  return (
    <>
      <Helmet>
        <title>Entry-Level Employers - Start Your Career | WorkWise SA</title>
        <meta name="description" content="Find companies hiring for entry-level positions in South Africa. No experience required - discover employers who provide training and career growth opportunities." />
        <meta name="keywords" content="entry level jobs, no experience required, general worker, retail jobs, security jobs, South Africa employers, training provided" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#1a365d] via-[#2a4365] to-[#2d3748] text-white">
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative container mx-auto px-4 py-16 md:py-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-4xl mx-auto"
            >
              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles className="h-6 w-6 text-yellow-400" />
                <span className="text-yellow-400 font-medium">Entry-Level Opportunities</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
                Start Your Career with Top South African Employers
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-white/80">
                Find companies hiring for entry-level positions. No experience required - just your willingness to learn and grow your career.
              </p>
              
              {/* Smart Search Bar */}
              <div className="relative max-w-2xl mx-auto mb-8">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search for entry-level jobs, companies, or locations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-4 py-4 text-lg bg-white/95 backdrop-blur-sm border-0 rounded-2xl shadow-lg focus:ring-2 focus:ring-yellow-400/50"
                  />
                </div>
                
                {/* Quick Filters */}
                <div className="flex flex-wrap gap-2 mt-4 justify-center">
                  {[
                    { label: 'Hiring Now', active: hiringNowOnly, onClick: () => setHiringNowOnly(!hiringNowOnly) },
                    { label: 'Remote Only', active: remoteOnly, onClick: () => setRemoteOnly(!remoteOnly) },
                    { label: 'Verified', active: verifiedOnly, onClick: () => setVerifiedOnly(!verifiedOnly) }
                  ].map((filter) => (
                    <Button
                      key={filter.label}
                      variant={filter.active ? "secondary" : "outline"}
                      size="sm"
                      onClick={filter.onClick}
                      className={`rounded-full ${filter.active ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-500' : 'bg-white/20 text-white border-white/30 hover:bg-white/30'}`}
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                {[
                  { label: 'Employers', value: '1,200+', color: 'text-yellow-400' },
                  { label: 'Entry-Level Jobs', value: '3,500+', color: 'text-orange-400' },
                  { label: 'No Experience Required', value: '85%', color: 'text-green-400' },
                  { label: 'Training Provided', value: '92%', color: 'text-blue-400' }
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className={`text-2xl md:text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                    <div className="text-sm text-white/70">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content Area */}
            <div className="lg:col-span-3 space-y-8">
                  {/* Filters and Controls */}
              <Card className="border-0 shadow-lg bg-card">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-4 items-center">
                  <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Industries</SelectItem>
                      {industries.map((industry) => (
                        <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {locations.map((location) => (
                        <SelectItem key={location} value={location}>{location}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedSize} onValueChange={setSelectedSize}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Company Size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sizes</SelectItem>
                      {sizes.map((size) => (
                        <SelectItem key={size} value={size}>{size}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-4">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rating">Top Rated</SelectItem>
                      <SelectItem value="positions">Most Positions</SelectItem>
                      <SelectItem value="growth">Fastest Growing</SelectItem>
                      <SelectItem value="name">Alphabetical</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className={viewMode === 'grid' ? 'bg-primary hover:bg-primary/90' : ''}
                    >
                      Grid
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className={viewMode === 'list' ? 'bg-primary hover:bg-primary/90' : ''}
                    >
                      List
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-600">
                Showing {filteredCompanies.length} companies
                {searchQuery && ` matching "${searchQuery}"`}
              </div>
            </CardContent>
          </Card>

              {/* Companies Grid/List */}
              {isLoading ? (
                <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} gap-6`}>
                  {Array(6).fill(0).map((_, i) => (
                    <Card key={i} className="border-0 shadow-lg bg-card">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <Skeleton className="w-16 h-16 rounded-lg" />
                          <div className="flex-1">
                            <Skeleton className="h-6 w-32 mb-2" />
                            <Skeleton className="h-4 w-24 mb-4" />
                            <Skeleton className="h-4 w-full mb-2" />
                            <Skeleton className="h-4 w-3/4" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <AnimatePresence>
                  <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} gap-6`}>
                    {filteredCompanies.map((company, index) => (
                      <motion.div
                        key={company.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                      >
                        <CompanyCard company={company} viewMode={viewMode} />
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>
              )}

              {filteredCompanies.length === 0 && !isLoading && (
                <div className="text-center py-16">
                  <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No companies found</h3>
                  <p className="text-gray-500">Try adjusting your filters or search terms</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <FeaturedCompaniesWidget />
            </div>
          </div>
        </div>

        {/* AI Search Assistant */}
        <CompanySearchAssistant />
      </div>
    </>
  );
};

// Enhanced Company Card Component
const CompanyCard: React.FC<{ company: ExtendedCompany; viewMode: 'grid' | 'list' }> = ({ company, viewMode }) => {
  const [isSaved, setIsSaved] = useState(false);

  return (
    <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-card hover:bg-card/95 overflow-hidden">
      <CardContent className="p-0">
        <div className={`${viewMode === 'list' ? 'flex items-center' : ''} p-6`}>
          {/* Company Logo and Basic Info */}
          <div className={`${viewMode === 'list' ? 'flex items-center gap-4 flex-1' : ''}`}>
            <div className="relative">
              <Avatar className="w-16 h-16 border-2 border-white shadow-lg">
                <AvatarImage src={company.logo} alt={company.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-xl">
                  {company.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {company.isVerified && (
                <CheckCircle className="absolute -bottom-1 -right-1 h-5 w-5 text-green-500 bg-white rounded-full" />
              )}
            </div>

            <div className={`${viewMode === 'list' ? 'flex-1' : 'mt-4'}`}>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                  {company.name}
                </h3>
                {company.isHiringNow && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    Hiring Now
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {company.location}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {company.employeeCount}
                </div>
                {company.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    {company.rating}
                  </div>
                )}
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {company.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-4">
                {company.tags?.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {company.isRemoteFriendly && (
                  <Badge variant="outline" className="text-xs bg-primary/10 text-primary">
                    <Globe className="h-3 w-3 mr-1" />
                    Remote
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Stats and Actions */}
          <div className={`${viewMode === 'list' ? 'flex items-center gap-6' : ''}`}>
            {viewMode === 'grid' && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-bold text-lg text-primary">{company.openPositions}</div>
                  <div className="text-xs text-muted-foreground">Open Roles</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-bold text-lg text-green-600">{company.growthRate}%</div>
                  <div className="text-xs text-muted-foreground">Growth Rate</div>
                </div>
              </div>
            )}

            {viewMode === 'list' && (
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <div className="font-bold text-primary">{company.openPositions}</div>
                  <div className="text-muted-foreground">Roles</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-green-600">{company.growthRate}%</div>
                  <div className="text-muted-foreground">Growth</div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className={`flex ${viewMode === 'list' ? 'gap-2' : 'gap-2 justify-between'}`}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSaved(!isSaved)}
                className={`${isSaved ? 'text-red-500 border-red-200' : ''}`}
              >
                <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
              </Button>
              <Button size="sm" className="flex-1">
                <Eye className="h-4 w-4 mr-2" />
                View Profile
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Companies;
