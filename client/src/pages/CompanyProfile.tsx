import React, { useState } from 'react';
import { useParams } from 'wouter';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  MapPin,
  Users,
  Calendar,
  Globe,
  Star,
  Building2,
  TrendingUp,
  Award,
  CheckCircle,
  Heart,
  Share2,
  ExternalLink,
  Briefcase,
  DollarSign,
  Clock,
  Filter,
  Search,
  ArrowRight,
  Play,
  LinkedIn,
  Twitter,
  Facebook,
  Instagram,
  Sparkles
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { mockExtendedCompanies } from './Companies';
import { mockJobs } from '@/services/mockData';

const CompanyProfile: React.FC = () => {
  const { slug } = useParams();
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [jobFilter, setJobFilter] = useState('all');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Find company by slug
  const company = mockExtendedCompanies.find(c => c.slug === slug);
  
  // Mock company jobs
  const companyJobs = mockJobs.filter(job => 
    job.company.toLowerCase() === company?.name.toLowerCase()
  );

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-600 mb-2">Company Not Found</h2>
          <p className="text-gray-500">The company you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{company.name} - Company Profile | WorkWise SA</title>
        <meta name="description" content={`Explore career opportunities at ${company.name}. ${company.description}`} />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Company Hero Section */}
        <section className="relative bg-gradient-to-br from-[#1a365d] via-[#2a4365] to-[#2d3748] text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative container mx-auto px-4 py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto"
            >
              <div className="flex flex-col md:flex-row items-start gap-8">
                {/* Company Logo and Basic Info */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    <Avatar className="w-32 h-32 border-4 border-white shadow-2xl">
                      <AvatarImage src={company.logo} alt={company.name} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-4xl">
                        {company.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {company.isVerified && (
                      <CheckCircle className="absolute -bottom-2 -right-2 h-8 w-8 text-green-500 bg-white rounded-full p-1" />
                    )}
                  </div>
                </div>

                {/* Company Details */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <h1 className="text-4xl md:text-5xl font-bold">{company.name}</h1>
                    {company.isHiringNow && (
                      <Badge className="bg-yellow-400 text-gray-900 px-3 py-1">
                        <Sparkles className="h-4 w-4 mr-1" />
                        Actively Hiring
                      </Badge>
                    )}
                  </div>

                  <p className="text-xl text-white/80 mb-6 max-w-2xl">
                    {company.description}
                  </p>

                  {/* Key Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-400">{company.openPositions}</div>
                      <div className="text-sm text-white/70">Open Positions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold flex items-center justify-center gap-1">
                        <span className="text-orange-400">{company.rating}</span>
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      </div>
                      <div className="text-sm text-white/70">Company Rating</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-400">{company.employeeCount}</div>
                      <div className="text-sm text-white/70">Employees</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-400">{company.growthRate}%</div>
                      <div className="text-sm text-white/70">Growth Rate</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-4">
                    <Button 
                      size="lg" 
                      className="bg-yellow-400 text-gray-900 hover:bg-yellow-500"
                      onClick={() => setIsFollowing(!isFollowing)}
                    >
                      <Heart className={`h-5 w-5 mr-2 ${isFollowing ? 'fill-current text-red-500' : ''}`} />
                      {isFollowing ? 'Following' : 'Follow Company'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="lg"
                      className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                    >
                      <Share2 className="h-5 w-5 mr-2" />
                      Share
                    </Button>
                    <Button 
                      variant="outline" 
                      size="lg"
                      className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                    >
                      <ExternalLink className="h-5 w-5 mr-2" />
                      Visit Website
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <Tabs defaultValue="overview" className="space-y-8">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="jobs">Jobs ({companyJobs.length})</TabsTrigger>
              <TabsTrigger value="culture">Culture</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                  {/* About Section */}
                  <Card className="border-0 shadow-lg bg-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        About {company.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-700 leading-relaxed">
                        {company.description}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 pt-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>Founded {company.foundedYear}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span>{company.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span>{company.size}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingUp className="h-4 w-4 text-gray-500" />
                          <span>{company.industry}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tech Stack */}
                  {company.techStack && (
                    <Card className="border-0 shadow-lg bg-card">
                      <CardHeader>
                        <CardTitle>Tech Stack</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {company.techStack.map((tech) => (
                            <Badge key={tech} variant="secondary" className="px-3 py-1">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Benefits */}
                  {company.benefits && (
                    <Card className="border-0 shadow-lg bg-card">
                      <CardHeader>
                        <CardTitle>Benefits & Perks</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {company.benefits.map((benefit) => (
                            <div key={benefit} className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm">{benefit}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Quick Stats */}
                  <Card className="border-0 shadow-lg bg-card">
                    <CardHeader>
                      <CardTitle>Company Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Glassdoor Rating</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">{company.glassdoorRating}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Reviews</span>
                        <span className="font-semibold">{company.reviews}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Funding</span>
                        <span className="font-semibold">{company.funding}</span>
                      </div>
                      <Separator />
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">Growth Rate</span>
                          <span className="font-semibold">{company.growthRate}%</span>
                        </div>
                        <Progress value={company.growthRate} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Social Links */}
                  <Card className="border-0 shadow-lg bg-card">
                    <CardHeader>
                      <CardTitle>Connect</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-3">
                        <Button variant="outline" size="sm">
                          <LinkedIn className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Twitter className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Facebook className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Instagram className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Jobs Tab */}
            <TabsContent value="jobs" className="space-y-6">
              {/* Job Search and Filters */}
              <Card className="border-0 shadow-lg bg-card">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search jobs at this company..."
                        value={jobSearchQuery}
                        onChange={(e) => setJobSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={jobFilter} onValueChange={setJobFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Jobs</SelectItem>
                        <SelectItem value="full-time">Full-time</SelectItem>
                        <SelectItem value="part-time">Part-time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Jobs List */}
              <div className="space-y-4">
                {companyJobs.map((job) => (
                  <Card key={job.id} className="border-0 shadow-lg bg-card hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold mb-2 hover:text-blue-600 cursor-pointer">
                            {job.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {job.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <Briefcase className="h-4 w-4" />
                              {job.type}
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              {job.salary}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {job.postedDate}
                            </div>
                          </div>
                          <p className="text-gray-700 mb-4 line-clamp-2">
                            {job.description}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {job.requirements?.slice(0, 3).map((req, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {req}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-6">
                          <Button size="sm">
                            Apply Now
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Heart className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Culture Tab */}
            <TabsContent value="culture" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Company Culture */}
                <Card className="border-0 shadow-lg bg-card">
                  <CardHeader>
                    <CardTitle>Our Culture</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {company.culture && (
                      <div className="space-y-4">
                        {company.culture.map((value) => (
                          <div key={value} className="flex items-center gap-3">
                            <Award className="h-5 w-5 text-blue-500" />
                            <span className="font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Company Video */}
                <Card className="border-0 shadow-lg bg-card">
                  <CardHeader>
                    <CardTitle>Day in the Life</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center cursor-pointer hover:from-blue-200 hover:to-purple-200 transition-colors">
                      <div className="text-center">
                        <Play className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Watch our company culture video</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Insights Tab */}
            <TabsContent value="insights" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="border-0 shadow-lg bg-card">
                  <CardHeader>
                    <CardTitle className="text-lg">Hiring Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">+{company.growthRate}%</div>
                      <p className="text-sm text-muted-foreground">Growth in hiring this quarter</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-card">
                  <CardHeader>
                    <CardTitle className="text-lg">Employee Satisfaction</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-2">{company.glassdoorRating}/5</div>
                      <p className="text-sm text-muted-foreground">Based on {company.reviews} reviews</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-card">
                  <CardHeader>
                    <CardTitle className="text-lg">Response Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-2">94%</div>
                      <p className="text-sm text-muted-foreground">Applications get a response</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default CompanyProfile;