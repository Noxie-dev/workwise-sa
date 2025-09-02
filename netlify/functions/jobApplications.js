import { db } from './utils/db.js';
import { verifyFirebaseToken } from './utils/auth.js';

/**
 * Job applications endpoint - authenticated users only
 * Handles creating and retrieving job applications
 */
export const handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

  try {
    // Verify authentication
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          error: 'Authentication required',
          message: 'Please sign in to apply for jobs'
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

    if (event.httpMethod === 'GET') {
      return await getUserApplications(user.uid, headers);
    } else if (event.httpMethod === 'POST') {
      return await createJobApplication(user.uid, event.body, headers);
    } else {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }

  } catch (error) {
    console.error('Error in job applications endpoint:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      }),
    };
  }
};

/**
 * Get user's job applications
 */
async function getUserApplications(firebaseUid, headers) {
  try {
    // First, get the user ID from Firebase UID
    const userQuery = 'SELECT id FROM users WHERE firebase_uid = $1';
    const userResult = await db.query(userQuery, [firebaseUid]);
    
    if (userResult.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    const userId = userResult.rows[0].id;

    // Get user's applications with job details
    const applicationsQuery = `
      SELECT 
        ja.id,
        ja.job_id as "jobId",
        ja.status,
        ja.applied_at as "appliedAt",
        ja.cover_letter as "coverLetter",
        ja.resume_url as "resumeUrl",
        ja.notes,
        -- Job info
        j.title as "jobTitle",
        j.location as "jobLocation",
        j.job_type as "jobType",
        -- Company info
        c.name as "companyName",
        c.logo as "companyLogo"
      FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      JOIN companies c ON j.company_id = c.id
      WHERE ja.user_id = $1
      ORDER BY ja.applied_at DESC
    `;

    const result = await db.query(applicationsQuery, [userId]);
    
    const applications = result.rows.map(row => ({
      id: row.id,
      jobId: row.jobId,
      status: row.status,
      appliedAt: new Date(row.appliedAt),
      coverLetter: row.coverLetter,
      resumeUrl: row.resumeUrl,
      notes: row.notes,
      job: {
        title: row.jobTitle,
        location: row.jobLocation,
        jobType: row.jobType,
        company: {
          name: row.companyName,
          logo: row.companyLogo,
        }
      }
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ applications }),
    };

  } catch (error) {
    console.error('Error fetching user applications:', error);
    throw error;
  }
}

/**
 * Create a new job application
 */
async function createJobApplication(firebaseUid, requestBody, headers) {
  try {
    if (!requestBody) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const { jobId, coverLetter, resumeUrl, customAnswers } = JSON.parse(requestBody);

    if (!jobId || isNaN(parseInt(jobId))) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Valid job ID is required' }),
      };
    }

    // Get the user ID from Firebase UID
    const userQuery = 'SELECT id FROM users WHERE firebase_uid = $1';
    const userResult = await db.query(userQuery, [firebaseUid]);
    
    if (userResult.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    const userId = userResult.rows[0].id;

    // Check if job exists
    const jobQuery = 'SELECT id, title FROM jobs WHERE id = $1';
    const jobResult = await db.query(jobQuery, [parseInt(jobId)]);
    
    if (jobResult.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Job not found' }),
      };
    }

    // Check if user has already applied for this job
    const existingApplicationQuery = 'SELECT id FROM job_applications WHERE user_id = $1 AND job_id = $2';
    const existingResult = await db.query(existingApplicationQuery, [userId, parseInt(jobId)]);
    
    if (existingResult.rows.length > 0) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ 
          error: 'Application already exists',
          message: 'You have already applied for this job'
        }),
      };
    }

    // Create the application
    const insertQuery = `
      INSERT INTO job_applications (user_id, job_id, status, cover_letter, resume_url, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, applied_at as "appliedAt"
    `;

    const notes = customAnswers ? JSON.stringify(customAnswers) : null;
    const insertResult = await db.query(insertQuery, [
      userId,
      parseInt(jobId),
      'pending',
      coverLetter || null,
      resumeUrl || null,
      notes
    ]);

    const application = insertResult.rows[0];

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        applicationId: application.id,
        appliedAt: new Date(application.appliedAt),
        message: 'Application submitted successfully'
      }),
    };

  } catch (error) {
    console.error('Error creating job application:', error);
    throw error;
  }
}