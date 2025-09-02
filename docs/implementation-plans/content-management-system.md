# Content Management System Implementation

## Overview
Replace "Coming Soon" pages with fully functional content-driven pages including Success Stories, Companies Directory, Blog Platform, and Solutions.

## Database Schema for Content Management

### 1. Content Tables
```sql
-- Content pages table
CREATE TABLE content_pages (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(200) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  meta_description TEXT,
  content JSONB NOT NULL, -- Rich content with blocks
  template VARCHAR(100) DEFAULT 'default',
  status VARCHAR(20) DEFAULT 'draft', -- draft, published, archived
  featured_image TEXT,
  seo_keywords TEXT[],
  author_id INTEGER REFERENCES users(id),
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Success stories table
CREATE TABLE success_stories (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR(200) NOT NULL,
  company_logo TEXT,
  contact_person VARCHAR(200),
  position_filled VARCHAR(200) NOT NULL,
  industry VARCHAR(100),
  challenge TEXT NOT NULL,
  solution TEXT NOT NULL,
  results TEXT NOT NULL,
  testimonial TEXT,
  metrics JSONB, -- { "time_to_hire": 30, "cost_savings": 25000, "quality_improvement": 85 }
  featured BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'published',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Companies directory table
CREATE TABLE company_profiles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  logo TEXT,
  website TEXT,
  description TEXT NOT NULL,
  industry VARCHAR(100),
  company_size VARCHAR(50), -- startup, small, medium, large, enterprise
  location VARCHAR(200),
  founded_year INTEGER,
  employees_count VARCHAR(50),
  benefits TEXT[],
  culture_tags TEXT[],
  social_links JSONB, -- { "linkedin": "url", "twitter": "url", "facebook": "url" }
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  featured BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Blog posts table  
CREATE TABLE blog_posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  excerpt TEXT,
  content JSONB NOT NULL,
  featured_image TEXT,
  category VARCHAR(100),
  tags TEXT[],
  author_id INTEGER REFERENCES users(id),
  read_time INTEGER, -- estimated read time in minutes
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft',
  featured BOOLEAN DEFAULT false,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Solutions/Services table
CREATE TABLE solutions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  features JSONB NOT NULL, -- Array of feature objects
  benefits JSONB NOT NULL, -- Array of benefit objects
  target_audience TEXT[],
  pricing_model VARCHAR(100),
  starting_price DECIMAL(10,2),
  icon VARCHAR(100),
  featured_image TEXT,
  gallery JSONB, -- Array of image URLs
  testimonials JSONB, -- Array of testimonial objects
  case_studies INTEGER[], -- References to success_stories
  demo_url TEXT,
  documentation_url TEXT,
  status VARCHAR(20) DEFAULT 'active',
  featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Content API Endpoints
```typescript
// server/routes/content.ts
import { z } from 'zod';

// Success Stories API
app.get('/api/success-stories', async (req, res, next) => {
  try {
    const { featured, industry, limit = 10, page = 1 } = req.query;
    
    let query = db.select().from(successStories)
      .where(eq(successStories.status, 'published'));
    
    if (featured === 'true') {
      query = query.where(eq(successStories.featured, true));
    }
    
    if (industry) {
      query = query.where(eq(successStories.industry, industry as string));
    }
    
    const offset = (Number(page) - 1) * Number(limit);
    const stories = await query
      .orderBy(desc(successStories.createdAt))
      .limit(Number(limit))
      .offset(offset);
    
    res.json(stories);
  } catch (error) {
    next(error);
  }
});

app.get('/api/success-stories/:id', async (req, res, next) => {
  try {
    const story = await db.select()
      .from(successStories)
      .where(eq(successStories.id, parseInt(req.params.id)))
      .limit(1);
    
    if (!story.length) {
      return res.status(404).json({ error: 'Success story not found' });
    }
    
    res.json(story[0]);
  } catch (error) {
    next(error);
  }
});

// Companies Directory API
app.get('/api/companies', async (req, res, next) => {
  try {
    const { 
      industry, 
      size, 
      location, 
      featured, 
      search,
      limit = 20, 
      page = 1 
    } = req.query;
    
    let query = db.select().from(companyProfiles)
      .where(eq(companyProfiles.status, 'active'));
    
    const conditions = [];
    
    if (industry) conditions.push(eq(companyProfiles.industry, industry as string));
    if (size) conditions.push(eq(companyProfiles.companySize, size as string));
    if (location) conditions.push(ilike(companyProfiles.location, `%${location}%`));
    if (featured === 'true') conditions.push(eq(companyProfiles.featured, true));
    
    if (search) {
      conditions.push(
        or(
          ilike(companyProfiles.name, `%${search}%`),
          ilike(companyProfiles.description, `%${search}%`)
        )
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const offset = (Number(page) - 1) * Number(limit);
    const companies = await query
      .orderBy(desc(companyProfiles.featured), asc(companyProfiles.name))
      .limit(Number(limit))
      .offset(offset);
    
    // Get total count for pagination
    const totalResult = await db.select({ count: count() })
      .from(companyProfiles)
      .where(query.getSQL().where);
    
    res.json({
      companies,
      total: totalResult[0].count,
      page: Number(page),
      totalPages: Math.ceil(totalResult[0].count / Number(limit))
    });
  } catch (error) {
    next(error);
  }
});

// Blog API
app.get('/api/blog', async (req, res, next) => {
  try {
    const { category, featured, limit = 10, page = 1 } = req.query;
    
    let query = db.select({
      id: blogPosts.id,
      title: blogPosts.title,
      slug: blogPosts.slug,
      excerpt: blogPosts.excerpt,
      featuredImage: blogPosts.featuredImage,
      category: blogPosts.category,
      tags: blogPosts.tags,
      readTime: blogPosts.readTime,
      viewsCount: blogPosts.viewsCount,
      publishedAt: blogPosts.publishedAt,
      author: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        avatar: users.avatar
      }
    })
    .from(blogPosts)
    .leftJoin(users, eq(blogPosts.authorId, users.id))
    .where(eq(blogPosts.status, 'published'));
    
    if (category) {
      query = query.where(eq(blogPosts.category, category as string));
    }
    
    if (featured === 'true') {
      query = query.where(eq(blogPosts.featured, true));
    }
    
    const offset = (Number(page) - 1) * Number(limit);
    const posts = await query
      .orderBy(desc(blogPosts.publishedAt))
      .limit(Number(limit))
      .offset(offset);
    
    res.json(posts);
  } catch (error) {
    next(error);
  }
});

// Solutions API
app.get('/api/solutions', async (req, res, next) => {
  try {
    const { featured } = req.query;
    
    let query = db.select().from(solutions)
      .where(eq(solutions.status, 'active'));
    
    if (featured === 'true') {
      query = query.where(eq(solutions.featured, true));
    }
    
    const solutionsList = await query.orderBy(asc(solutions.sortOrder));
    
    res.json(solutionsList);
  } catch (error) {
    next(error);
  }
});
```

## Frontend Implementation

### 1. Success Stories Page
```typescript
// client/src/pages/employers/SuccessStories.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, TrendingUp, Clock, DollarSign } from 'lucide-react';

interface SuccessStory {
  id: number;
  companyName: string;
  companyLogo?: string;
  contactPerson: string;
  positionFilled: string;
  industry: string;
  challenge: string;
  solution: string;
  results: string;
  testimonial?: string;
  metrics?: {
    timeToHire?: number;
    costSavings?: number;
    qualityImprovement?: number;
  };
  featured: boolean;
}

export const SuccessStories = () => {
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  
  const { data: stories, isLoading } = useQuery({
    queryKey: ['successStories', selectedIndustry],
    queryFn: () => fetchSuccessStories({ industry: selectedIndustry }),
  });
  
  const { data: industries } = useQuery({
    queryKey: ['industries'],
    queryFn: fetchIndustries,
  });
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Success Stories</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Discover how companies across South Africa have transformed their hiring 
          process with WorkWise SA and found exceptional talent.
        </p>
      </div>
      
      {/* Industry Filter */}
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        <Button
          variant={selectedIndustry === '' ? 'default' : 'outline'}
          onClick={() => setSelectedIndustry('')}
        >
          All Industries
        </Button>
        {industries?.map((industry) => (
          <Button
            key={industry}
            variant={selectedIndustry === industry ? 'default' : 'outline'}
            onClick={() => setSelectedIndustry(industry)}
          >
            {industry}
          </Button>
        ))}
      </div>
      
      {/* Success Stories Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <SuccessStorySkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stories?.map((story) => (
            <SuccessStoryCard key={story.id} story={story} />
          ))}
        </div>
      )}
      
      {/* CTA Section */}
      <div className="mt-16 text-center bg-primary/5 rounded-lg p-8">
        <h2 className="text-3xl font-bold mb-4">Ready to Write Your Success Story?</h2>
        <p className="text-lg text-gray-600 mb-6">
          Join hundreds of companies who have found their perfect candidates through WorkWise SA
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/employers/post-job">Post a Job</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/employers/pricing">View Pricing</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

const SuccessStoryCard = ({ story }: { story: SuccessStory }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center gap-3 mb-3">
          {story.companyLogo && (
            <img 
              src={story.companyLogo} 
              alt={story.companyName}
              className="w-12 h-12 object-contain rounded"
            />
          )}
          <div>
            <CardTitle className="text-lg">{story.companyName}</CardTitle>
            <Badge variant="secondary">{story.industry}</Badge>
          </div>
        </div>
        <h3 className="font-semibold text-primary">
          Successfully hired: {story.positionFilled}
        </h3>
      </CardHeader>
      
      <CardContent>
        {/* Metrics */}
        {story.metrics && (
          <div className="grid grid-cols-3 gap-4 mb-4">
            {story.metrics.timeToHire && (
              <div className="text-center">
                <Clock className="h-5 w-5 mx-auto text-green-600 mb-1" />
                <div className="text-2xl font-bold text-green-600">
                  {story.metrics.timeToHire}
                </div>
                <div className="text-xs text-gray-500">days to hire</div>
              </div>
            )}
            {story.metrics.costSavings && (
              <div className="text-center">
                <DollarSign className="h-5 w-5 mx-auto text-blue-600 mb-1" />
                <div className="text-2xl font-bold text-blue-600">
                  R{story.metrics.costSavings.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">saved</div>
              </div>
            )}
            {story.metrics.qualityImprovement && (
              <div className="text-center">
                <TrendingUp className="h-5 w-5 mx-auto text-purple-600 mb-1" />
                <div className="text-2xl font-bold text-purple-600">
                  {story.metrics.qualityImprovement}%
                </div>
                <div className="text-xs text-gray-500">quality boost</div>
              </div>
            )}
          </div>
        )}
        
        {/* Challenge */}
        <div className="mb-4">
          <h4 className="font-semibold mb-2">Challenge:</h4>
          <p className="text-sm text-gray-600 line-clamp-3">
            {story.challenge}
          </p>
        </div>
        
        {/* Testimonial */}
        {story.testimonial && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="flex items-center mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current text-yellow-400" />
              ))}
            </div>
            <p className="text-sm italic line-clamp-3">"{story.testimonial}"</p>
            <p className="text-xs text-gray-500 mt-2">
              - {story.contactPerson}
            </p>
          </div>
        )}
        
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Show Less' : 'Read Full Story'}
        </Button>
        
        {showDetails && (
          <div className="mt-4 pt-4 border-t space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Solution:</h4>
              <p className="text-sm text-gray-600">{story.solution}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Results:</h4>
              <p className="text-sm text-gray-600">{story.results}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
```

### 2. Companies Directory Page
```typescript
// client/src/pages/Companies.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Users, Globe, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

export const Companies = () => {
  const [filters, setFilters] = useState({
    search: '',
    industry: '',
    size: '',
    location: '',
    page: 1,
  });
  
  const { data: companiesData, isLoading } = useQuery({
    queryKey: ['companies', filters],
    queryFn: () => fetchCompanies(filters),
    keepPreviousData: true,
  });
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Companies Directory</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Discover amazing companies hiring on WorkWise SA. Explore company profiles, 
          culture, benefits, and open positions.
        </p>
      </div>
      
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search companies..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                search: e.target.value, 
                page: 1 
              }))}
              className="pl-10"
            />
          </div>
          
          <Select
            value={filters.industry}
            onValueChange={(value) => setFilters(prev => ({ 
              ...prev, 
              industry: value, 
              page: 1 
            }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Industries</SelectItem>
              <SelectItem value="technology">Technology</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
              <SelectItem value="healthcare">Healthcare</SelectItem>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="retail">Retail</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={filters.size}
            onValueChange={(value) => setFilters(prev => ({ 
              ...prev, 
              size: value, 
              page: 1 
            }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Company Size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Sizes</SelectItem>
              <SelectItem value="startup">Startup (1-10)</SelectItem>
              <SelectItem value="small">Small (11-50)</SelectItem>
              <SelectItem value="medium">Medium (51-200)</SelectItem>
              <SelectItem value="large">Large (201-1000)</SelectItem>
              <SelectItem value="enterprise">Enterprise (1000+)</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Location"
              value={filters.location}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                location: e.target.value, 
                page: 1 
              }))}
              className="pl-10"
            />
          </div>
        </div>
      </div>
      
      {/* Results Count */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-600">
          {companiesData?.total || 0} companies found
        </p>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          More Filters
        </Button>
      </div>
      
      {/* Companies Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(9)].map((_, i) => (
            <CompanySkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companiesData?.companies.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
          
          {/* Pagination */}
          {companiesData && companiesData.totalPages > 1 && (
            <Pagination
              currentPage={filters.page}
              totalPages={companiesData.totalPages}
              onPageChange={(page) => setFilters(prev => ({ ...prev, page }))}
            />
          )}
        </>
      )}
    </div>
  );
};

const CompanyCard = ({ company }) => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardHeader className="pb-4">
      <div className="flex items-start gap-4">
        {company.logo && (
          <img 
            src={company.logo} 
            alt={company.name}
            className="w-16 h-16 object-contain rounded-lg"
          />
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-lg line-clamp-1">{company.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary">{company.industry}</Badge>
            {company.featured && (
              <Badge variant="default">Featured</Badge>
            )}
          </div>
        </div>
      </div>
    </CardHeader>
    
    <CardContent>
      <p className="text-gray-600 text-sm line-clamp-3 mb-4">
        {company.description}
      </p>
      
      <div className="space-y-2 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {company.location}
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          {company.employeesCount} employees
        </div>
        {company.website && (
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <a 
              href={company.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Visit Website
            </a>
          </div>
        )}
      </div>
      
      {/* Culture Tags */}
      {company.cultureTags && company.cultureTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-4">
          {company.cultureTags.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {company.cultureTags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{company.cultureTags.length - 3} more
            </Badge>
          )}
        </div>
      )}
      
      <div className="flex gap-2 mt-4">
        <Button variant="outline" size="sm" className="flex-1">
          View Profile
        </Button>
        <Button size="sm" className="flex-1">
          View Jobs
        </Button>
      </div>
    </CardContent>
  </Card>
);
```

## Implementation Timeline
- **Week 1**: Database schema, API endpoints, and data seeding
- **Week 2**: Frontend components and page implementations
- **Additional**: Content creation and migration from ComingSoon components
