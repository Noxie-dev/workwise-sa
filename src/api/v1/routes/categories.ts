// src/api/v1/routes/categories.ts
import { Router } from 'express';
import { storage } from '../../../../server/storage';

export function registerCategoryRoutes(router: Router) {
  // Categories routes
  router.get("/categories", async (req, res) => {
    try {
      console.log("Fetching categories...");
      const categories = await storage.getCategories();
      console.log(`Found ${categories.length} categories`);
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch categories",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  router.get("/categories/:slug", async (req, res) => {
    try {
      const category = await storage.getCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });
}
