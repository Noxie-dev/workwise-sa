// server/wiseup.ts
import express from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { storage } from "./storage";
import apiRouter from "../src/api";
import { errorHandler, notFoundHandler, requestIdMiddleware } from "./middleware/errorHandler";
import { setupSwagger } from "../src/api/swagger";
import { db } from "./db";
import { 
  wiseup_content, 
  wiseup_ads, 
  wiseup_bookmarks, 
  wiseup_ad_impressions, 
  wiseup_user_progress 
} from "../shared/wiseup-schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * WiseUp Service
 * 
 * Handles all operations related to the WiseUp learning platform
 */
export class WiseUpService {
  /**
   * Initialize the WiseUp service with sample data
   */
  async initializeData() {
    try {
      // Check if content already exists
      const existingContent = await db.select().from(wiseup_content).limit(1);
      
      if (existingContent.length === 0) {
        // Insert sample content
        await db.insert(wiseup_content).values([
          {
            title: "Introduction to Job Interviews",
            creator: { name: "Career Coach Sarah", avatar: "/images/coaches/sarah.jpg" },
            video: "https://storage.googleapis.com/workwise-videos/interviews-intro.mp4",
            description: "Learn the basics of job interviews and how to prepare for them.",
            resources: [
              { title: "Interview Checklist", url: "/resources/interview-checklist.pdf" },
              { title: "Common Questions", url: "/resources/common-interview-questions.pdf" }
            ],
            tags: ["interviews", "preparation", "career"]
          },
          {
            title: "CV Writing Tips",
            creator: { name: "HR Expert John", avatar: "/images/coaches/john.jpg" },
            video: "https://storage.googleapis.com/workwise-videos/cv-writing.mp4",
            description: "Master the art of CV writing with these professional tips.",
            resources: [
              { title: "CV Template", url: "/resources/cv-template.docx" },
              { title: "CV Do's and Don'ts", url: "/resources/cv-guidelines.pdf" }
            ],
            tags: ["cv", "resume", "job application"]
          },
          {
            title: "Workplace Communication",
            creator: { name: "Communication Specialist Lisa", avatar: "/images/coaches/lisa.jpg" },
            video: "https://storage.googleapis.com/workwise-videos/workplace-communication.mp4",
            description: "Improve your communication skills for better workplace relationships.",
            resources: [
              { title: "Communication Styles", url: "/resources/communication-styles.pdf" }
            ],
            tags: ["communication", "workplace", "soft skills"]
          }
        ]);
        
        console.log("Sample WiseUp content created");
      }
      
      // Check if ads already exist
      const existingAds = await db.select().from(wiseup_ads).limit(1);
      
      if (existingAds.length === 0) {
        // Insert sample ads
        await db.insert(wiseup_ads).values([
          {
            advertiser: "TechSkills Academy",
            title: "Learn Coding in 30 Days",
            video: "https://storage.googleapis.com/workwise-ads/techskills-ad.mp4",
            cta: "Enroll Now",
            description: "Start your tech career with our accelerated coding bootcamp.",
            targetInterests: ["technology", "coding", "career change"]
          },
          {
            advertiser: "JobReady Courses",
            title: "Interview Mastery Program",
            video: "https://storage.googleapis.com/workwise-ads/jobready-ad.mp4",
            cta: "Join Program",
            description: "Ace your next interview with our proven techniques.",
            targetInterests: ["interviews", "job search", "career advancement"]
          }
        ]);
        
        console.log("Sample WiseUp ads created");
      }
      
      return true;
    } catch (error) {
      console.error("Error initializing WiseUp data:", error);
      throw error;
    }
  }
  
  /**
   * Get all WiseUp content items
   * @param limit Maximum number of items to return
   * @returns Array of content items
   */
  async getContent(limit: number = 10) {
    try {
      const content = await db.select().from(wiseup_content)
        .orderBy(desc(wiseup_content.createdAt))
        .limit(limit);
      
      return content;
    } catch (error) {
      console.error("Error fetching WiseUp content:", error);
      throw error;
    }
  }
  
  /**
   * Get all WiseUp ad items
   * @param limit Maximum number of items to return
   * @param targetInterests Optional array of interests for targeting
   * @returns Array of ad items
   */
  async getAds(limit: number = 5, targetInterests: string[] = []) {
    try {
      let ads;
      
      if (targetInterests.length > 0) {
        // This is a simplified approach - in a real implementation,
        // you would use a more sophisticated targeting algorithm
        ads = await db.select().from(wiseup_ads)
          .where(eq(wiseup_ads.active, true))
          .limit(limit);
          
        // Filter ads with matching interests (client-side filtering as a simple approach)
        // In a real implementation, this would be done at the database level
        ads = ads.filter(ad => {
          const adInterests = ad.targetInterests as string[] || [];
          return adInterests.some(interest => targetInterests.includes(interest));
        });
      } else {
        ads = await db.select().from(wiseup_ads)
          .where(eq(wiseup_ads.active, true))
          .limit(limit);
      }
      
      return ads;
    } catch (error) {
      console.error("Error fetching WiseUp ads:", error);
      throw error;
    }
  }
  
  /**
   * Track an ad impression
   * @param adId ID of the ad
   * @param userId ID of the user (or 'anonymous')
   * @param platform Platform where the ad was viewed
   */
  async trackAdImpression(adId: number, userId: string, platform: string = 'web') {
    try {
      await db.insert(wiseup_ad_impressions).values({
        adId,
        userId,
        platform
      });
      
      return true;
    } catch (error) {
      console.error("Error tracking ad impression:", error);
      throw error;
    }
  }
  
  /**
   * Get user bookmarks
   * @param userId ID of the user
   * @returns Array of bookmarked items
   */
  async getUserBookmarks(userId: string) {
    try {
      const bookmarks = await db.select().from(wiseup_bookmarks)
        .where(eq(wiseup_bookmarks.userId, userId))
        .orderBy(desc(wiseup_bookmarks.bookmarkedAt));
      
      // Fetch the actual content/ad items for each bookmark
      const items = await Promise.all(
        bookmarks.map(async (bookmark) => {
          if (bookmark.itemType === 'content') {
            return await db.select().from(wiseup_content)
              .where(eq(wiseup_content.id, parseInt(bookmark.wiseUpItemId)))
              .then(results => results[0]);
          } else {
            return await db.select().from(wiseup_ads)
              .where(eq(wiseup_ads.id, parseInt(bookmark.wiseUpItemId)))
              .then(results => results[0]);
          }
        })
      );
      
      // Filter out any null items (in case a bookmarked item was deleted)
      return items.filter(Boolean);
    } catch (error) {
      console.error("Error fetching user bookmarks:", error);
      throw error;
    }
  }
}
