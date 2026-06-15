import { db } from './utils/postgres.js';

const parseZarSalary = salary => {
  if (!salary || typeof salary !== 'string') return undefined;
  const normalized = salary.replace(/\s+/g, ' ').trim();
  const values = normalized.match(/(?:r\s*)?\d[\d\s,.]*(?:k)?/gi) || [];
  const parsed = values
    .map(value => {
      const multiplier = /k\b/i.test(value) ? 1000 : 1;
      const numeric = Number(value.replace(/[^\d.]/g, ''));
      return Number.isFinite(numeric) ? Math.round(numeric * multiplier) : undefined;
    })
    .filter(Boolean)
    .sort((left, right) => left - right);

  return {
    min: parsed[0],
    max: parsed.length > 1 ? parsed[parsed.length - 1] : parsed[0],
    currency: 'ZAR',
    negotiable: /negotiable|market|competitive/i.test(normalized),
    displayText: /^r/i.test(normalized) ? normalized : `R ${normalized}`,
  };
};

const tokenize = value =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2);

const scorePublicMatch = (row, params) => {
  const reasons = [];
  let score = row.featured ? 8 : 0;
  const haystack = new Set(
    tokenize(`${row.title} ${row.shortDescription} ${row.location} ${row.company?.name} ${row.category?.name}`)
  );

  if (params.query) {
    const matched = tokenize(params.query).filter(token => haystack.has(token)).length;
    if (matched) {
      score += Math.min(24, matched * 8);
      reasons.push(`Relevant to "${params.query}"`);
    }
  }

  if (params.location && row.location?.toLowerCase().includes(params.location.toLowerCase())) {
    score += 22;
    reasons.push(`Location match: ${row.location}`);
  }

  if (/remote/i.test(`${row.workMode} ${row.location}`)) {
    score += 10;
    reasons.push('Remote-friendly role');
  }

  return score > 0
    ? {
        score: Math.min(100, Math.round(score)),
        label: score >= 52 ? 'Good match' : 'Possible match',
        reasons: reasons.length ? reasons : ['Ranked by current job relevance'],
      }
    : undefined;
};

/**
 * Public API endpoint for job previews (no authentication required)
 * Returns basic job information for browsing
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
      featured = 'false',
      minSalary = ''
    } = params;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    // Build the query
    let whereConditions = [`j.id IS NOT NULL`, `COALESCE(j.status, 'active') = 'active'`];
    let queryParams = [];
    let paramIndex = 1;

    // Add search conditions
    if (query.trim()) {
      whereConditions.push(`(j.title ILIKE $${paramIndex} OR j.description ILIKE $${paramIndex} OR comp.name ILIKE $${paramIndex} OR cat.name ILIKE $${paramIndex} OR j.location ILIKE $${paramIndex})`);
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

    if (experienceLevel.trim()) {
      if (experienceLevel === 'senior') {
        whereConditions.push(`(j.title ILIKE '%senior%' OR j.title ILIKE '%lead%' OR j.title ILIKE '%manager%')`);
      } else if (experienceLevel === 'entry') {
        whereConditions.push(`(j.title ILIKE '%junior%' OR j.title ILIKE '%entry%' OR j.title ILIKE '%graduate%' OR j.title ILIKE '%assistant%')`);
      }
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
        j.salary,
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

    const jobs = jobsResult.rows
      .map(row => ({
        ...row,
        postedDate: new Date(row.postedDate),
        tags: Array.isArray(row.tags) ? row.tags.filter(Boolean) : [],
        salaryPreview: parseZarSalary(row.salary),
        match: scorePublicMatch(row, { query, location })
      }))
      .filter(row => {
        const minimum = Number(minSalary);
        if (!Number.isFinite(minimum) || minimum <= 0) return true;
        const available = row.salaryPreview?.max || row.salaryPreview?.min || 0;
        return !available || available >= minimum;
      })
      .map(({ salary, ...row }) => row);

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
