import { db } from './utils/db.js';
import { verifyFirebaseToken } from './utils/auth.js';

/**
 * Authenticated API endpoint for full job details
 * Requires valid Firebase authentication token
 */
export const handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Verify authentication
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          error: 'Authentication required',
          message: 'Please sign in to view full job details'
        }),
      };
    }

    const token = authHeader.substring(7);
    const user = await verifyFirebaseToken(token);
    
    if (!user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid authentication token',
          message: 'Please sign in again to continue'
        }),
      };
    }

    // Get job ID from path
    const pathParts = event.path.split('/');
    const jobId = pathParts[pathParts.length - 1];

    if (!jobId || isNaN(parseInt(jobId))) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid job ID' }),
      };
    }

    // Get full job details
    const jobQuery = `
      SELECT 
        j.id,
        j.title,
        j.description as "fullDescription",
        j.location,
        j.salary,
        j.job_type as "jobType",
        j.work_mode as "workMode",
        j.is_featured as featured,
        j.created_at as "createdAt",
        -- Company details
        jsonb_build_object(
          'id', comp.id,
          'name', comp.name,
          'location', comp.location,
          'logo', comp.logo,
          'about', COALESCE(comp.description, 'No company description available'),
          'website', comp.website,
          'size', comp.size,
          'industry', cat.name
        ) as "companyDetails",
        -- Category info
        jsonb_build_object(
          'id', cat.id,
          'name', cat.name
        ) as category,
        -- Salary details (parsed from salary text)
        CASE 
          WHEN j.salary IS NOT NULL AND j.salary != '' THEN
            jsonb_build_object(
              'displayText', j.salary,
              'currency', 'ZAR',
              'negotiable', j.salary ILIKE '%negotiable%'
            )
          ELSE NULL
        END as "salaryDetails",
        -- Experience level
        CASE 
          WHEN j.title ILIKE '%senior%' OR j.title ILIKE '%lead%' OR j.title ILIKE '%manager%' THEN 'senior'
          WHEN j.title ILIKE '%junior%' OR j.title ILIKE '%entry%' OR j.title ILIKE '%graduate%' THEN 'entry'
          ELSE 'mid'
        END as "experienceLevel",
        -- Tags
        ARRAY[j.job_type, j.work_mode, cat.name] as tags,
        -- Is remote
        CASE WHEN j.work_mode = 'Remote' THEN true ELSE false END as "isRemote"
      FROM jobs j
      JOIN companies comp ON j.company_id = comp.id
      JOIN categories cat ON j.category_id = cat.id
      WHERE j.id = $1
    `;

    const result = await db.query(jobQuery, [parseInt(jobId)]);

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Job not found' }),
      };
    }

    const job = result.rows[0];

    // Parse description to extract structured information
    const description = job.fullDescription || '';
    
    // Simple parsing logic - in a real app, you might want more sophisticated parsing
    const requirements = extractSection(description, ['requirements', 'qualifications', 'skills needed']);
    const responsibilities = extractSection(description, ['responsibilities', 'duties', 'role']);
    const benefits = extractSection(description, ['benefits', 'perks', 'what we offer']);

    // Build the complete job details response
    const jobDetails = {
      // Basic info (same as preview)
      id: job.id,
      title: job.title,
      company: {
        id: job.companyDetails.id,
        name: job.companyDetails.name,
        location: job.companyDetails.location,
      },
      location: job.location,
      jobType: job.jobType,
      workMode: job.workMode,
      category: job.category,
      shortDescription: description.substring(0, 150) + (description.length > 150 ? '...' : ''),
      tags: job.tags.filter(Boolean),
      postedDate: new Date(job.createdAt),
      isRemote: job.isRemote,
      experienceLevel: job.experienceLevel,
      featured: job.featured,
      
      // Detailed info (authenticated only)
      details: {
        id: job.id,
        fullDescription: job.fullDescription,
        requirements: requirements.length > 0 ? requirements : ['Requirements not specified'],
        responsibilities: responsibilities.length > 0 ? responsibilities : ['Responsibilities not specified'],
        benefits: benefits.length > 0 ? benefits : ['Benefits not specified'],
        applicationInstructions: 'Please submit your application through the WorkWise SA platform.',
        companyDetails: job.companyDetails,
        salaryDetails: job.salaryDetails,
        createdAt: new Date(job.createdAt),
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(jobDetails),
    };

  } catch (error) {
    console.error('Error fetching job details:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to fetch job details',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      }),
    };
  }
};

/**
 * Extract sections from job description based on keywords
 */
function extractSection(description, keywords) {
  const lines = description.split('\n').map(line => line.trim()).filter(Boolean);
  const items = [];
  let inSection = false;
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Check if this line starts a relevant section
    if (keywords.some(keyword => lowerLine.includes(keyword))) {
      inSection = true;
      continue;
    }
    
    // Check if we've moved to a different section
    if (inSection && (lowerLine.includes(':') || lowerLine.match(/^[a-z\s]+:$/))) {
      // If it's not one of our keywords, we've moved to a different section
      if (!keywords.some(keyword => lowerLine.includes(keyword))) {
        inSection = false;
      }
    }
    
    // If we're in the section, collect items
    if (inSection) {
      // Look for bullet points or numbered items
      if (line.match(/^[-•*]\s+/) || line.match(/^\d+\.\s+/)) {
        items.push(line.replace(/^[-•*]\s+/, '').replace(/^\d+\.\s+/, '').trim());
      } else if (line.length > 10 && !line.includes(':')) {
        // Add non-header lines that seem like content
        items.push(line);
      }
    }
  }
  
  return items.slice(0, 10); // Limit to 10 items max
}