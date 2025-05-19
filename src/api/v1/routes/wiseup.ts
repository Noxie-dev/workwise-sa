// src/api/v1/routes/wiseup.ts
import { Router } from 'express';
import { db } from '../../../../server/db';
import { authenticate, AuthenticatedRequest } from '../../../middleware/auth';
import { Errors } from '../../../../server/middleware/errorHandler';
import { z } from 'zod';

// Schema for content items
const contentItemSchema = z.object({
  title: z.string().min(3).max(100),
  creator: z.object({
    name: z.string(),
    avatar: z.string().optional(),
  }),
  video: z.string().url(),
  description: z.string().min(10),
  resources: z.array(z.object({
    title: z.string(),
    url: z.string().url(),
  })).optional(),
  tags: z.array(z.string()).optional(),
});

// Schema for ad items
const adItemSchema = z.object({
  advertiser: z.string().min(3).max(100),
  title: z.string().min(3).max(100),
  video: z.string().url(),
  cta: z.string().min(3).max(50),
  description: z.string().min(10),
  notes: z.string().optional(),
  targetInterests: z.array(z.string()).optional(),
  active: z.boolean().default(true),
});

// Schema for bookmarks
const bookmarkSchema = z.object({
  wiseUpItemId: z.string(),
  itemType: z.enum(['content', 'ad']),
});

export function registerWiseUpRoutes(router: Router) {
  // Get all content items
  router.get('/content', async (req, res) => {
    try {
      const maxItems = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      // In a real implementation, this would query the database
      // For now, we'll use a mock implementation
      const contentItems = await db.query.wiseup_content.findMany({
        limit: maxItems,
        orderBy: (content, { desc }) => [desc(content.createdAt)],
      });
      
      res.json(contentItems);
    } catch (error) {
      console.error('Error fetching content:', error);
      res.status(500).json({ message: 'Failed to fetch content' });
    }
  });

  // Get all ad items
  router.get('/ads', async (req, res) => {
    try {
      const maxItems = req.query.limit ? parseInt(req.query.limit as string) : 5;
      
      // In a real implementation, this would query the database
      // For now, we'll use a mock implementation
      const adItems = await db.query.wiseup_ads.findMany({
        limit: maxItems,
        where: (ads, { eq }) => eq(ads.active, true),
      });
      
      res.json(adItems);
    } catch (error) {
      console.error('Error fetching ads:', error);
      res.status(500).json({ message: 'Failed to fetch ads' });
    }
  });

  // Track ad impression
  router.post('/ads/impression', authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const { adId } = req.body;
      
      if (!adId) {
        return res.status(400).json({ message: 'Ad ID is required' });
      }
      
      // In a real implementation, this would record the impression in the database
      // For now, we'll just log it
      console.log(`Ad impression tracked for ad ${adId} by user ${req.user?.uid || 'anonymous'}`);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error tracking ad impression:', error);
      res.status(500).json({ message: 'Failed to track ad impression' });
    }
  });

  // Get user bookmarks
  router.get('/bookmarks', authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      // In a real implementation, this would query the database for bookmarks
      // and then fetch the corresponding content/ad items
      // For now, we'll use a mock implementation
      const bookmarks = await db.query.wiseup_bookmarks.findMany({
        where: (bookmarks, { eq }) => eq(bookmarks.userId, req.user.uid),
        orderBy: (bookmarks, { desc }) => [desc(bookmarks.bookmarkedAt)],
      });
      
      // Fetch the actual content/ad items for each bookmark
      const items = await Promise.all(
        bookmarks.map(async (bookmark) => {
          if (bookmark.itemType === 'content') {
            return await db.query.wiseup_content.findFirst({
              where: (content, { eq }) => eq(content.id, bookmark.wiseUpItemId),
            });
          } else {
            return await db.query.wiseup_ads.findFirst({
              where: (ads, { eq }) => eq(ads.id, bookmark.wiseUpItemId),
            });
          }
        })
      );
      
      // Filter out any null items (in case a bookmarked item was deleted)
      const validItems = items.filter(Boolean);
      
      res.json(validItems);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      res.status(500).json({ message: 'Failed to fetch bookmarks' });
    }
  });

  // Add a bookmark
  router.post('/bookmarks', authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      // Validate request body
      const validatedData = bookmarkSchema.parse(req.body);
      
      // Check if bookmark already exists
      const existingBookmark = await db.query.wiseup_bookmarks.findFirst({
        where: (bookmarks, { eq, and }) => and(
          eq(bookmarks.userId, req.user.uid),
          eq(bookmarks.wiseUpItemId, validatedData.wiseUpItemId),
          eq(bookmarks.itemType, validatedData.itemType)
        ),
      });
      
      if (existingBookmark) {
        return res.status(409).json({ message: 'Item already bookmarked' });
      }
      
      // Add the bookmark
      const newBookmark = await db.insert(db.wiseup_bookmarks).values({
        userId: req.user.uid,
        wiseUpItemId: validatedData.wiseUpItemId,
        itemType: validatedData.itemType,
        bookmarkedAt: new Date(),
      }).returning();
      
      res.status(201).json(newBookmark[0]);
    } catch (error) {
      console.error('Error adding bookmark:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid request data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to add bookmark' });
    }
  });

  // Remove a bookmark
  router.delete('/bookmarks/:id', authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const bookmarkId = req.params.id;
      
      // Check if bookmark exists and belongs to the user
      const bookmark = await db.query.wiseup_bookmarks.findFirst({
        where: (bookmarks, { eq, and }) => and(
          eq(bookmarks.id, parseInt(bookmarkId)),
          eq(bookmarks.userId, req.user.uid)
        ),
      });
      
      if (!bookmark) {
        return res.status(404).json({ message: 'Bookmark not found' });
      }
      
      // Delete the bookmark
      await db.delete(db.wiseup_bookmarks).where(
        db.wiseup_bookmarks.id.equals(parseInt(bookmarkId))
      );
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error removing bookmark:', error);
      res.status(500).json({ message: 'Failed to remove bookmark' });
    }
  });
}
