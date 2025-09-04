// src/api/v1/routes/jobs.ts
import { Router } from 'express';
import { storage } from '../../../../server/storage';

export function registerJobRoutes(router: Router) {
  // Jobs routes
  router.get("/jobs", async (req, res) => {
    try {
      console.log("Fetching jobs...");
      const jobs = await storage.getJobsWithCompanies();
      console.log(`Found ${jobs.length} jobs`);
      res.json({
        success: true,
        data: jobs
      });
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch jobs",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  router.get("/jobs/featured", async (req, res) => {
    try {
      const featuredJobs = await storage.getFeaturedJobs();
      res.json(featuredJobs);
    } catch (error) {
      console.error("Error fetching featured jobs:", error);
      res.status(500).json({ message: "Failed to fetch featured jobs" });
    }
  });

  router.get("/jobs/search", async (req, res) => {
    try {
      const query = req.query.q as string || '';
      const results = await storage.searchJobs(query);
      res.json(results);
    } catch (error) {
      console.error("Error searching jobs:", error);
      res.status(500).json({ message: "Failed to search jobs" });
    }
  });

  router.get("/jobs/company/:id", async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      if (isNaN(companyId)) {
        return res.status(400).json({ message: "Invalid company ID" });
      }
      
      const jobs = await storage.getJobsByCompany(companyId);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching jobs by company:", error);
      res.status(500).json({ message: "Failed to fetch jobs by company" });
    }
  });

  router.get("/jobs/category/:id", async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      const jobs = await storage.getJobsByCategory(categoryId);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching jobs by category:", error);
      res.status(500).json({ message: "Failed to fetch jobs by category" });
    }
  });

  router.get("/jobs/:id", async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      if (isNaN(jobId)) {
        return res.status(400).json({ message: "Invalid job ID" });
      }
      
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      const company = await storage.getCompany(job.companyId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      res.json({ ...job, company });
    } catch (error) {
      console.error("Error fetching job:", error);
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });
}
