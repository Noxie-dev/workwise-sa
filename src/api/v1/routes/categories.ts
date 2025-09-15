// src/api/v1/routes/categories.ts
import { Router, Request, Response } from 'express';

export function registerCategoryRoutes(router: Router) {
  // GET /categories - Get all categories
  router.get('/categories', async (req: Request, res: Response) => {
    try {
      // Basic response for now - can be enhanced later
      res.json({ 
        success: true, 
        data: [],
        message: 'Categories endpoint available'
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch categories' 
      });
    }
  });

  // GET /categories/:id - Get category by ID
  router.get('/categories/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      res.json({ 
        success: true, 
        data: { id },
        message: 'Category endpoint available'
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch category' 
      });
    }
  });
}
