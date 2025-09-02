# Candidate Browsing System Implementation

## Overview
Enhance the BrowseCandidates page with advanced search, filtering, and candidate management features.

## Database Schema Enhancements

### 1. Candidate Profile Extensions
```sql
-- Add to existing users table or create candidate_profiles table
ALTER TABLE users ADD COLUMN IF NOT EXISTS
  availability VARCHAR(50),
  salary_expectation_min INTEGER,
  salary_expectation_max INTEGER,
  preferred_locations TEXT[],
  willing_to_relocate BOOLEAN DEFAULT false,
  work_authorization VARCHAR(100),
  notice_period VARCHAR(50),
  profile_visibility VARCHAR(20) DEFAULT 'public',
  last_active TIMESTAMP DEFAULT NOW();

-- Skills table for candidates
CREATE TABLE IF NOT EXISTS candidate_skills (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  skill_name VARCHAR(100) NOT NULL,
  proficiency_level VARCHAR(20) DEFAULT 'intermediate', -- beginner, intermediate, advanced, expert
  years_experience INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Experience table
CREATE TABLE IF NOT EXISTS candidate_experience (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(200) NOT NULL,
  position VARCHAR(200) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE, -- NULL if current job
  description TEXT,
  achievements TEXT[],
  skills_used TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- Education table
CREATE TABLE IF NOT EXISTS candidate_education (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  institution_name VARCHAR(200) NOT NULL,
  degree VARCHAR(200) NOT NULL,
  field_of_study VARCHAR(200),
  start_date DATE,
  end_date DATE,
  gpa DECIMAL(3,2),
  achievements TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- Saved candidates for employers
CREATE TABLE IF NOT EXISTS saved_candidates (
  id SERIAL PRIMARY KEY,
  employer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  candidate_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  status VARCHAR(50) DEFAULT 'saved', -- saved, contacted, interviewing, hired, rejected
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(employer_id, candidate_id)
);
```

### 2. Advanced Search API
```typescript
// server/routes/candidates.ts
import { z } from 'zod';

const candidateSearchSchema = z.object({
  query: z.object({
    // Basic search
    keywords: z.string().optional(),
    location: z.string().optional(),
    remote: z.boolean().optional(),
    
    // Experience filters
    experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']).optional(),
    minExperience: z.number().min(0).optional(),
    maxExperience: z.number().max(50).optional(),
    
    // Skills filters
    skills: z.array(z.string()).optional(),
    skillsMatchType: z.enum(['any', 'all']).default('any'),
    
    // Salary filters
    minSalary: z.number().optional(),
    maxSalary: z.number().optional(),
    
    // Availability
    availability: z.enum(['immediate', 'two-weeks', 'one-month', 'three-months']).optional(),
    willingToRelocate: z.boolean().optional(),
    
    // Sorting
    sortBy: z.enum(['relevance', 'experience', 'salary', 'lastActive']).default('relevance'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    
    // Pagination
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(50).default(20),
  })
});

app.get('/api/candidates/search', validate(candidateSearchSchema), async (req, res, next) => {
  try {
    const {
      keywords, location, remote, experienceLevel, minExperience, maxExperience,
      skills, skillsMatchType, minSalary, maxSalary, availability, willingToRelocate,
      sortBy, sortOrder, page, limit
    } = req.query;
    
    let query = db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      title: users.title,
      bio: users.bio,
      location: users.location,
      avatar: users.avatar,
      experienceLevel: users.experienceLevel,
      availability: users.availability,
      salaryExpectationMin: users.salaryExpectationMin,
      salaryExpectationMax: users.salaryExpectationMax,
      lastActive: users.lastActive,
    })
    .from(users)
    .where(
      and(
        eq(users.profileVisibility, 'public'),
        eq(users.userType, 'candidate')
      )
    );
    
    // Apply filters
    const conditions = [];
    
    if (keywords) {
      conditions.push(
        or(
          ilike(users.firstName, `%${keywords}%`),
          ilike(users.lastName, `%${keywords}%`),
          ilike(users.title, `%${keywords}%`),
          ilike(users.bio, `%${keywords}%`)
        )
      );
    }
    
    if (location && !remote) {
      conditions.push(ilike(users.location, `%${location}%`));
    }
    
    if (experienceLevel) {
      conditions.push(eq(users.experienceLevel, experienceLevel));
    }
    
    if (minSalary || maxSalary) {
      if (minSalary) conditions.push(gte(users.salaryExpectationMin, minSalary));
      if (maxSalary) conditions.push(lte(users.salaryExpectationMax, maxSalary));
    }
    
    if (availability) {
      conditions.push(eq(users.availability, availability));
    }
    
    if (willingToRelocate !== undefined) {
      conditions.push(eq(users.willingToRelocate, willingToRelocate));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Handle skills filtering
    if (skills && skills.length > 0) {
      const skillsQuery = db.select({ userId: candidateSkills.userId })
        .from(candidateSkills)
        .where(inArray(candidateSkills.skillName, skills))
        .groupBy(candidateSkills.userId);
        
      if (skillsMatchType === 'all') {
        skillsQuery.having(eq(count(), skills.length));
      }
      
      const candidateIds = await skillsQuery;
      if (candidateIds.length > 0) {
        query = query.where(inArray(users.id, candidateIds.map(c => c.userId)));
      } else {
        // No candidates match all required skills
        return res.json({ candidates: [], total: 0, page, totalPages: 0 });
      }
    }
    
    // Apply sorting
    const orderBy = [];
    switch (sortBy) {
      case 'experience':
        orderBy.push(sortOrder === 'desc' ? desc(users.experienceLevel) : asc(users.experienceLevel));
        break;
      case 'salary':
        orderBy.push(sortOrder === 'desc' ? desc(users.salaryExpectationMax) : asc(users.salaryExpectationMin));
        break;
      case 'lastActive':
        orderBy.push(sortOrder === 'desc' ? desc(users.lastActive) : asc(users.lastActive));
        break;
      default:
        // Relevance sorting - could be enhanced with search scoring
        orderBy.push(desc(users.lastActive));
    }
    
    // Get total count
    const totalResult = await db.select({ count: count() })
      .from(users)
      .where(query.getSQL().where);
    const total = totalResult[0].count;
    
    // Apply pagination
    const offset = (page - 1) * limit;
    const candidates = await query
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset);
    
    // Get skills for each candidate
    const candidateIds = candidates.map(c => c.id);
    const skillsData = await db.select()
      .from(candidateSkills)
      .where(inArray(candidateSkills.userId, candidateIds));
    
    // Group skills by candidate
    const candidatesWithSkills = candidates.map(candidate => ({
      ...candidate,
      skills: skillsData
        .filter(skill => skill.userId === candidate.id)
        .map(skill => ({
          name: skill.skillName,
          proficiency: skill.proficiencyLevel,
          yearsExperience: skill.yearsExperience
        }))
    }));
    
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      candidates: candidatesWithSkills,
      total,
      page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    });
    
  } catch (error) {
    next(error);
  }
});
```

### 3. Enhanced Frontend Components
```typescript
// client/src/pages/employers/BrowseCandidates.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SearchFilters } from '@/components/candidates/SearchFilters';
import { CandidateCard } from '@/components/candidates/CandidateCard';
import { CandidateModal } from '@/components/candidates/CandidateModal';

export const BrowseCandidates = () => {
  const [filters, setFilters] = useState({
    keywords: '',
    location: '',
    skills: [],
    experienceLevel: '',
    minSalary: '',
    maxSalary: '',
    availability: '',
    sortBy: 'relevance',
    page: 1,
  });
  
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  
  const { data, isLoading } = useQuery({
    queryKey: ['candidates', filters],
    queryFn: () => searchCandidates(filters),
    keepPreviousData: true,
  });
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="lg:w-1/4">
          <SearchFilters filters={filters} onFiltersChange={setFilters} />
        </div>
        
        {/* Results */}
        <div className="lg:w-3/4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">
              {data?.total || 0} Candidates Found
            </h1>
            <SortSelect value={filters.sortBy} onChange={(value) => 
              setFilters(prev => ({ ...prev, sortBy: value, page: 1 }))
            } />
          </div>
          
          {isLoading ? (
            <CandidatesSkeleton />
          ) : (
            <>
              <div className="grid gap-6">
                {data?.candidates.map(candidate => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    onViewProfile={() => setSelectedCandidate(candidate)}
                    onSave={() => saveCandidate(candidate.id)}
                    onContact={() => contactCandidate(candidate.id)}
                  />
                ))}
              </div>
              
              {data && data.totalPages > 1 && (
                <Pagination
                  currentPage={filters.page}
                  totalPages={data.totalPages}
                  onPageChange={(page) => setFilters(prev => ({ ...prev, page }))}
                />
              )}
            </>
          )}
        </div>
      </div>
      
      {selectedCandidate && (
        <CandidateModal
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
        />
      )}
    </div>
  );
};
```

### 4. Candidate Card Component
```typescript
// client/src/components/candidates/CandidateCard.tsx
export const CandidateCard = ({ candidate, onViewProfile, onSave, onContact }) => {
  const [isSaved, setIsSaved] = useState(false);
  
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          <Avatar className="h-16 w-16">
            <AvatarImage src={candidate.avatar} />
            <AvatarFallback>
              {candidate.firstName[0]}{candidate.lastName[0]}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">
                {candidate.firstName} {candidate.lastName}
              </h3>
              <Badge variant={getAvailabilityVariant(candidate.availability)}>
                {candidate.availability}
              </Badge>
            </div>
            
            <p className="text-lg text-gray-600 mt-1">{candidate.title}</p>
            <p className="text-sm text-gray-500 flex items-center mt-1">
              <MapPin className="h-4 w-4 mr-1" />
              {candidate.location}
            </p>
            
            <p className="text-sm text-gray-700 mt-3 line-clamp-2">
              {candidate.bio}
            </p>
            
            {/* Skills */}
            <div className="flex flex-wrap gap-2 mt-3">
              {candidate.skills.slice(0, 5).map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {skill.name}
                </Badge>
              ))}
              {candidate.skills.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{candidate.skills.length - 5} more
                </Badge>
              )}
            </div>
            
            {/* Salary Expectation */}
            {candidate.salaryExpectationMin && (
              <p className="text-sm text-gray-600 mt-2">
                <DollarSign className="h-4 w-4 inline mr-1" />
                R{candidate.salaryExpectationMin.toLocaleString()} - 
                R{candidate.salaryExpectationMax?.toLocaleString()} per month
              </p>
            )}
          </div>
        </div>
        
        <div className="flex flex-col space-y-2 ml-4">
          <Button onClick={onViewProfile} variant="outline" size="sm">
            View Profile
          </Button>
          <Button
            onClick={() => {
              setIsSaved(!isSaved);
              onSave();
            }}
            variant={isSaved ? "default" : "outline"}
            size="sm"
          >
            {isSaved ? <Heart className="h-4 w-4 fill-current" /> : <Heart className="h-4 w-4" />}
            {isSaved ? 'Saved' : 'Save'}
          </Button>
          <Button onClick={onContact} size="sm">
            Contact
          </Button>
        </div>
      </div>
    </Card>
  );
};
```

## Implementation Timeline
- **Days 1-2**: Database schema and API endpoints
- **Days 3-4**: Search filters and results components
- **Days 5-6**: Candidate cards and profile modals
- **Day 7**: Testing and optimization
