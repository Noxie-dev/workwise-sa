// netlify/functions/jobsIngest.js
import { db } from "./utils/db.js";
import { jobs } from "../../../shared/schema.js";
import { sql } from "drizzle-orm";

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const { items } = JSON.parse(event.body || "{}");
    if (!Array.isArray(items) || items.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "items[] is required and must be non-empty" }),
      };
    }

    const values = items.map((i) => ({
      externalId: String(i.externalId).slice(0, 100),
      title: (i.title || "").slice(0, 255),
      companyId: i.companyId || 1, // Default to company ID 1 if not provided
      location: i.location || null,
      salary: i.salary || null,
      description: i.description || null,
      jobType: i.jobType || "Full-time",
      workMode: i.workMode || "On-site",
      categoryId: i.categoryId || 1, // Default to category ID 1 if not provided
      isFeatured: i.isFeatured || false,
      source: i.source || "manual",
      ingestedAt: new Date(),
    }));

    await db.transaction(async (tx) => {
      await tx
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
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, upserted: values.length }),
    };
  } catch (error) {
    console.error("jobsIngest error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};

