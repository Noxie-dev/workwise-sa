// netlify/functions/jobsIngest.js
import { db } from "./utils/db.js";
import { jobs } from "../../../shared/schema.js";
import { sql } from "drizzle-orm";

export const handler = async (event) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  console.log(`[${requestId}] 🚀 Job ingestion request started`, {
    method: event.httpMethod,
    userAgent: event.headers['user-agent'],
    timestamp: new Date().toISOString(),
  });

  if (event.httpMethod !== "POST") {
    console.log(`[${requestId}] ❌ Method not allowed: ${event.httpMethod}`);
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        error: "Method Not Allowed",
        requestId,
        timestamp: new Date().toISOString()
      }),
    };
  }

  try {
    // Parse and validate request body
    const body = event.body || "{}";
    let parsedBody;
    
    try {
      parsedBody = JSON.parse(body);
    } catch (parseError) {
      console.error(`[${requestId}] ❌ JSON parse error:`, parseError);
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          error: "Invalid JSON in request body",
          requestId,
          timestamp: new Date().toISOString()
        }),
      };
    }

    const { items } = parsedBody;
    
    // Enhanced validation
    if (!Array.isArray(items)) {
      console.log(`[${requestId}] ❌ Invalid items format: expected array, got ${typeof items}`);
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          error: "items must be an array",
          requestId,
          timestamp: new Date().toISOString()
        }),
      };
    }

    if (items.length === 0) {
      console.log(`[${requestId}] ❌ Empty items array`);
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          error: "items array cannot be empty",
          requestId,
          timestamp: new Date().toISOString()
        }),
      };
    }

    console.log(`[${requestId}] 📊 Processing ${items.length} job items`, {
      itemCount: items.length,
      firstItemExternalId: items[0]?.externalId,
      lastItemExternalId: items[items.length - 1]?.externalId,
      sources: [...new Set(items.map(i => i.source))],
    });

    // Transform and validate items
    const values = items.map((item, index) => {
      const externalId = String(item.externalId || '').slice(0, 100);
      const title = (item.title || '').slice(0, 255);
      
      // Log any validation issues
      if (!externalId) {
        console.warn(`[${requestId}] ⚠️  Item ${index} missing externalId`);
      }
      if (!title) {
        console.warn(`[${requestId}] ⚠️  Item ${index} missing title`);
      }

      return {
        externalId,
        title,
        companyId: item.companyId || 1, // Default to company ID 1 if not provided
        location: item.location || null,
        salary: item.salary || null,
        description: item.description || null,
        jobType: item.jobType || "Full-time",
        workMode: item.workMode || "On-site",
        categoryId: item.categoryId || 1, // Default to category ID 1 if not provided
        isFeatured: item.isFeatured || false,
        source: item.source || "manual",
        ingestedAt: new Date(),
      };
    });

    // Log transformation summary
    console.log(`[${requestId}] 🔄 Transformed ${values.length} items`, {
      validExternalIds: values.filter(v => v.externalId).length,
      validTitles: values.filter(v => v.title).length,
      sources: [...new Set(values.map(v => v.source))],
      jobTypes: [...new Set(values.map(v => v.jobType))],
      workModes: [...new Set(values.map(v => v.workMode))],
    });

    // Execute upsert transaction
    console.log(`[${requestId}] 💾 Starting database transaction...`);
    const transactionStartTime = Date.now();
    
    await db.transaction(async (tx) => {
      const result = await tx
        .insert(jobs)
        .values(values)
        .onConflictDoUpdate({
          target: jobs.externalId,
          set: {
            title: sql`excluded.${jobs.title.name}`,
            companyId: sql`excluded.${jobs.companyId.name}`,
            location: sql`excluded.${jobs.location.name}`,
            salary: sql`excluded.${jobs.salary.name}`,
            description: sql`excluded.${jobs.description.name}`,
            jobType: sql`excluded.${jobs.jobType.name}`,
            workMode: sql`excluded.${jobs.workMode.name}`,
            categoryId: sql`excluded.${jobs.categoryId.name}`,
            isFeatured: sql`excluded.${jobs.isFeatured.name}`,
            source: sql`excluded.${jobs.source.name}`,
            ingestedAt: sql`excluded.${jobs.ingestedAt.name}`,
          },
        });
      
      console.log(`[${requestId}] ✅ Database transaction completed`, {
        rowsAffected: result.rowCount,
        transactionDuration: Date.now() - transactionStartTime,
      });
    });

    const totalDuration = Date.now() - startTime;
    const processingRate = values.length / (totalDuration / 1000);

    console.log(`[${requestId}] 🎉 Job ingestion completed successfully`, {
      itemsProcessed: values.length,
      totalDuration: `${totalDuration}ms`,
      processingRate: `${processingRate.toFixed(2)} jobs/second`,
      timestamp: new Date().toISOString(),
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        success: true, 
        upserted: values.length,
        requestId,
        processingTime: totalDuration,
        processingRate: processingRate.toFixed(2),
        timestamp: new Date().toISOString(),
        details: {
          itemsReceived: items.length,
          itemsProcessed: values.length,
          sources: [...new Set(values.map(v => v.source))],
        }
      }),
    };

  } catch (error) {
    const totalDuration = Date.now() - startTime;
    
    console.error(`[${requestId}] 💥 Job ingestion failed`, {
      error: error.message,
      stack: error.stack,
      duration: totalDuration,
      timestamp: new Date().toISOString(),
      requestBody: event.body ? JSON.stringify(event.body).substring(0, 500) : 'No body',
    });

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        error: "Internal Server Error",
        message: error.message,
        requestId,
        timestamp: new Date().toISOString(),
        processingTime: totalDuration,
      }),
    };
  }
};

