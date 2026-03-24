import { Router } from "express";
import { categories, jobApplications, jobs, userInteractions, users } from "@shared/schema";
import { adminAnalyticsSchema } from "@shared/platform-contracts";
import { db } from "../db";
import { verifyFirebaseToken } from "../middleware/auth";
import { assertRole, resolveAuthenticatedDatabaseUser } from "../services/authenticatedUser";

const router = Router();

function bucketCount(length: number, divisor: number) {
  return Math.max(0, Math.round(length / Math.max(1, divisor)));
}

router.use(verifyFirebaseToken);

router.get("/overview", async (req, res, next) => {
  try {
    const authUser = (req as any).user;
    const dbUser = await resolveAuthenticatedDatabaseUser(authUser);
    assertRole(dbUser, ["admin"]);

    const [userRows, jobRows, applicationRows, interactionRows, categoryRows] = await Promise.all([
      db.select().from(users),
      db.select().from(jobs),
      db.select().from(jobApplications),
      db.select().from(userInteractions),
      db.select().from(categories),
    ]);

    const activeUsers = userRows.filter((user) => user.lastActive).length;
    const views = interactionRows.filter((interaction) => interaction.interactionType === "view").length;
    const interviews = applicationRows.filter((application) => application.status === "interview").length;
    const hires = applicationRows.filter((application) => application.status === "hired").length;

    const categoryCounts = categoryRows.map((category) => ({
      name: category.name,
      count: jobRows.filter((job) => job.categoryId === category.id).length,
    }));

    res.json(adminAnalyticsSchema.parse({
      overview: {
        totalUsers: userRows.length,
        activeUsers,
        jobListings: jobRows.length,
        applications: applicationRows.length,
      },
      userActivity: {
        daily: [7, 6, 5, 4, 3, 2, 1].map((divisor) => bucketCount(activeUsers || userRows.length, divisor)),
        weekly: [5, 4, 3, 2, 1].map((divisor) => bucketCount(userRows.length, divisor)),
        monthly: [6, 5, 4, 3, 2, 1].map((divisor) => bucketCount(userRows.length, divisor)),
      },
      jobMetrics: {
        categories: categoryCounts.map((item) => item.name),
        counts: categoryCounts.map((item) => item.count),
      },
      conversionRates: {
        viewToApplication: views > 0 ? Number(((applicationRows.length / views) * 100).toFixed(1)) : 0,
        applicationToInterview: applicationRows.length > 0 ? Number(((interviews / applicationRows.length) * 100).toFixed(1)) : 0,
        interviewToHire: interviews > 0 ? Number(((hires / interviews) * 100).toFixed(1)) : 0,
      },
    }));
  } catch (error) {
    next(error);
  }
});

export default router;
