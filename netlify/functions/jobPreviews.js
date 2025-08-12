const { db } = require('./utils/db');

/**
 * Public API endpoint for job previews (no authentication required)
 * Returns basic job information for browsing
 */
exports.handler = async (event, context) => {
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
    // Parse query parameters
    const params = event.queryStringParameters || {};
    const {
      query = '',
      categoryId,
      location = '',
      jobType = '',
      workMode = '',
      experienceLevel = '',
      page = '1',
      limit = '20',
      featured = 'false'
    } = params;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    // Build the query
    let whereConditions = ['j.id IS NOT NULL']; // Base condition
    let queryParams = [];
    let paramIndex = 1;

    // Add search conditions
    if (query.trim()) {
      whereConditions.push(`(j.title ILIKE $${paramIndex} OR j.description ILIKE $${paramIndex} OR c.name ILIKE $${paramIndex})`);
      queryParams.push(`%${query.trim()}%`);
      paramIndex++;
    }

    if (categoryId && !isNaN(parseInt(categoryId))) {
      whereConditions.push(`j.category_id = $${paramIndex}`);
      queryParams.push(parseInt(categoryId));
      paramIndex++;
    }

    if (location.trim()) {
      whereConditions.push(`j.location ILIKE $${paramIndex}`);
      queryParams.push(`%${location.trim()}%`);
      paramIndex++;
    }

    if (jobType.trim()) {
      whereConditions.push(`j.job_type = $${paramIndex}`);
      queryParams.push(jobType.trim());
      paramIndex++;
    }

    if (workMode.trim()) {
      whereConditions.push(`j.work_mode = $${paramIndex}`);
      queryParams.push(workMode.trim());
      paramIndex++;
    }

    if (featured === 'true') {
      whereConditions.push(`j.is_featured = true`);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM jobs j
      JOIN companies comp ON j.company_id = comp.id
      JOIN categories cat ON j.category_id = cat.id
      WHERE ${whereClause}
    `;

    const countResult = await db.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limitNum);

    // Get job previews (limited information)
    const jobsQuery = `
      SELECT 
        j.id,
        j.title,
        j.location,
        j.job_type as "jobType",
        j.work_mode as "workMode",
        j.is_featured as featured,
        j.created_at as "postedDate",
        -- Limited description (first 150 characters)
        CASE 
          WHEN LENGTH(j.description) > 150 
          THEN SUBSTRING(j.description FROM 1 FOR 150) || '...'
          ELSE j.description
        END as "shortDescription",
        -- Company info (basic only)
        jsonb_build_object(
          'id', comp.id,
          'name', comp.name,
          'location', comp.location
        ) as company,
        -- Category info
        jsonb_build_object(
          'id', cat.id,
          'name', cat.name
        ) as category,
        -- Basic tags (derived from job type and work mode)
        ARRAY[j.job_type, j.work_mode] as tags,
        -- Experience level (derived from title keywords)
        CASE 
          WHEN j.title ILIKE '%senior%' OR j.title ILIKE '%lead%' OR j.title ILIKE '%manager%' THEN 'senior'
          WHEN j.title ILIKE '%junior%' OR j.title ILIKE '%entry%' OR j.title ILIKE '%graduate%' THEN 'entry'
          ELSE 'mid'
        END as "experienceLevel",
        -- Is remote check
        CASE WHEN j.work_mode = 'Remote' THEN true ELSE false END as "isRemote"
      FROM jobs j
      JOIN companies comp ON j.company_id = comp.id
      JOIN categories cat ON j.category_id = cat.id
      WHERE ${whereClause}
      ORDER BY j.is_featured DESC, j.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limitNum, offset);
    const jobsResult = await db.query(jobsQuery, queryParams);

    const jobs = jobsResult.rows.map(row => ({
      ...row,
      postedDate: new Date(row.postedDate),
      // Ensure tags is always an array
      tags: Array.isArray(row.tags) ? row.tags.filter(Boolean) : []
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        jobs,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      }),
    };

  } catch (error) {
    console.error('Error fetching job previews:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to fetch job previews',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      }),
    };
  }
};