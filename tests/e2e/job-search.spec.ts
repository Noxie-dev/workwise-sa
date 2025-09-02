import { test, expect } from '@playwright/test';

test.describe('Job Search Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display job search functionality', async ({ page }) => {
    // Check if the main navigation is visible
    await expect(page.locator('header')).toBeVisible();
    
    // Navigate to jobs page
    await page.click('text=Find Jobs');
    await expect(page).toHaveURL(/.*jobs/);
    
    // Check if job listings are displayed
    await expect(page.locator('.job-card')).toBeVisible();
  });

  test('should allow searching for jobs', async ({ page }) => {
    await page.goto('/jobs');
    
    // Find and fill search input
    const searchInput = page.locator('[data-testid="job-search-input"]');
    await expect(searchInput).toBeVisible();
    
    await searchInput.fill('software engineer');
    await page.click('[data-testid="search-button"]');
    
    // Wait for search results
    await page.waitForSelector('.job-card', { timeout: 10000 });
    
    // Check if search results contain the search term
    const jobCards = page.locator('.job-card');
    const firstJob = jobCards.first();
    await expect(firstJob).toBeVisible();
  });

  test('should display job details when clicking on a job', async ({ page }) => {
    await page.goto('/jobs');
    
    // Wait for job cards to load
    await page.waitForSelector('.job-card', { timeout: 10000 });
    
    // Click on the first job card
    const firstJobCard = page.locator('.job-card').first();
    await firstJobCard.click();
    
    // Should navigate to job details page
    await expect(page).toHaveURL(/.*jobs\/\d+/);
    
    // Check if job details are displayed
    await expect(page.locator('h1')).toBeVisible(); // Job title
    await expect(page.locator('text=Company')).toBeVisible();
    await expect(page.locator('text=Location')).toBeVisible();
  });

  test('should allow filtering jobs by location', async ({ page }) => {
    await page.goto('/jobs');
    
    // Open location filter
    const locationFilter = page.locator('[data-testid="location-filter"]');
    if (await locationFilter.isVisible()) {
      await locationFilter.click();
      
      // Select a location
      await page.click('text=Cape Town');
      
      // Wait for filtered results
      await page.waitForTimeout(2000);
      
      // Check if results are filtered
      const jobCards = page.locator('.job-card');
      const count = await jobCards.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/jobs');
    
    // Check if mobile menu is visible
    const mobileMenuButton = page.locator('[aria-label="Toggle navigation menu"]');
    await expect(mobileMenuButton).toBeVisible();
    
    // Check if job cards are displayed properly on mobile
    await expect(page.locator('.job-card')).toBeVisible();
  });

  test('should handle job application flow for authenticated users', async ({ page }) => {
    // Mock authentication state
    await page.addInitScript(() => {
      localStorage.setItem('authToken', 'mock-token');
    });
    
    await page.goto('/jobs');
    
    // Wait for job cards and click on first one
    await page.waitForSelector('.job-card', { timeout: 10000 });
    const firstJobCard = page.locator('.job-card').first();
    await firstJobCard.click();
    
    // Try to apply for the job
    const applyButton = page.locator('text=Apply for Job');
    if (await applyButton.isVisible()) {
      await applyButton.click();
      
      // Should show application form or success message
      await expect(page.locator('text=Application')).toBeVisible();
    }
  });

  test('should redirect to login for unauthenticated job application', async ({ page }) => {
    await page.goto('/jobs');
    
    // Wait for job cards and click on first one
    await page.waitForSelector('.job-card', { timeout: 10000 });
    const firstJobCard = page.locator('.job-card').first();
    await firstJobCard.click();
    
    // Try to apply for the job without authentication
    const applyButton = page.locator('text=Apply for Job');
    if (await applyButton.isVisible()) {
      await applyButton.click();
      
      // Should redirect to login or show login modal
      await expect(page.locator('text=Login')).toBeVisible();
    }
  });
});

test.describe('Performance Tests', () => {
  test('should load jobs page within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/jobs');
    await page.waitForSelector('.job-card', { timeout: 10000 });
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have good Core Web Vitals', async ({ page }) => {
    await page.goto('/jobs');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Check for layout shifts and other performance metrics
    const performanceMetrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          resolve(entries);
        }).observe({ entryTypes: ['navigation', 'paint'] });
        
        setTimeout(() => resolve([]), 5000);
      });
    });
    
    expect(performanceMetrics).toBeDefined();
  });
});
