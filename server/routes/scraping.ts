// server/routes/scraping.ts
import { Router } from 'express';
import { spawn, exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { storage } from '../storage';

const router = Router();

// Validation schemas
const triggerScrapingSchema = z.object({
  spiders: z.array(z.string()).optional(),
  maxItems: z.number().min(1).max(10000).optional(),
  concurrent: z.number().min(1).max(5).optional(),
  dryRun: z.boolean().optional(),
});

// In-memory store for scraping sessions
const scrapingSessions: Map<string, {
  id: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  spiders: string[];
  progress: {
    spidersCompleted: number;
    totalSpiders: number;
    itemsScraped: number;
    errors: number;
  };
  results?: any;
  error?: string;
}> = new Map();

/**
 * GET /api/scraping/status
 * Get status of all scraping sessions
 */
router.get('/status', async (req, res) => {
  try {
    const sessions = Array.from(scrapingSessions.values()).map(session => ({
      id: session.id,
      status: session.status,
      startTime: session.startTime,
      endTime: session.endTime,
      progress: session.progress,
      spiders: session.spiders
    }));
    
    res.json({
      success: true,
      sessions,
      activeSessions: sessions.filter(s => s.status === 'running').length
    });
  } catch (error) {
    console.error('Error getting scraping status:', error);
    res.status(500).json({ success: false, error: 'Failed to get scraping status' });
  }
});

/**
 * GET /api/scraping/session/:sessionId
 * Get detailed status of a specific scraping session
 */
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = scrapingSessions.get(sessionId);
    
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    
    res.json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Error getting session details:', error);
    res.status(500).json({ success: false, error: 'Failed to get session details' });
  }
});

/**
 * POST /api/scraping/trigger
 * Trigger job scraping process
 */
router.post('/trigger', async (req, res) => {
  try {
    // Validate request body
    const validatedData = triggerScrapingSchema.parse(req.body);
    
    // Check if there's already a running session
    const runningSessions = Array.from(scrapingSessions.values())
      .filter(session => session.status === 'running');
    
    if (runningSessions.length >= 2) {
      return res.status(429).json({
        success: false,
        error: 'Maximum number of concurrent scraping sessions reached'
      });
    }
    
    // Generate session ID
    const sessionId = `scraping_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create session record
    const session = {
      id: sessionId,
      status: 'running' as const,
      startTime: new Date(),
      spiders: validatedData.spiders || ['gumtree_jobs'],
      progress: {
        spidersCompleted: 0,
        totalSpiders: validatedData.spiders?.length || 1,
        itemsScraped: 0,
        errors: 0
      }
    };
    
    scrapingSessions.set(sessionId, session);
    
    // Start scraping process
    startScrapingProcess(sessionId, validatedData);
    
    res.json({
      success: true,
      sessionId,
      message: 'Scraping process started',
      session: {
        id: session.id,
        status: session.status,
        startTime: session.startTime,
        spiders: session.spiders
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.issues
      });
    }
    
    console.error('Error triggering scraping:', error);
    res.status(500).json({ success: false, error: 'Failed to trigger scraping' });
  }
});

/**
 * POST /api/scraping/cancel/:sessionId
 * Cancel a running scraping session
 */
router.post('/cancel/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = scrapingSessions.get(sessionId);
    
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    
    if (session.status !== 'running') {
      return res.status(400).json({ 
        success: false, 
        error: 'Session is not running' 
      });
    }
    
    // Update session status
    session.status = 'cancelled';
    session.endTime = new Date();
    
    // TODO: Kill the actual scraping process
    // This would require tracking the process PID
    
    res.json({
      success: true,
      message: 'Scraping session cancelled'
    });
  } catch (error) {
    console.error('Error cancelling scraping session:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel session' });
  }
});

/**
 * GET /api/scraping/logs/:sessionId
 * Get logs for a scraping session
 */
router.get('/logs/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const logPath = path.join(__dirname, '../../scrapy_jobs/job_scraping.log');
    
    try {
      const logContent = await fs.readFile(logPath, 'utf-8');
      const sessionLogs = logContent
        .split('\n')
        .filter(line => line.includes(sessionId) || line.includes('INFO'))
        .slice(-100); // Last 100 relevant lines
      
      res.json({
        success: true,
        logs: sessionLogs
      });
    } catch (fileError) {
      res.json({
        success: true,
        logs: ['Log file not found or not accessible'],
        warning: 'Could not access log file'
      });
    }
  } catch (error) {
    console.error('Error getting scraping logs:', error);
    res.status(500).json({ success: false, error: 'Failed to get logs' });
  }
});

/**
 * GET /api/scraping/stats
 * Get overall scraping statistics
 */
router.get('/stats', async (req, res) => {
  try {
    // Get database statistics
    const totalJobs = await storage.getJobs();
    const recentJobs = totalJobs.filter(job => {
      const createdAt = new Date(job.createdAt!);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return createdAt > sevenDaysAgo;
    });
    
    const companies = await storage.getCompanies();
    
    res.json({
      success: true,
      stats: {
        totalJobs: totalJobs.length,
        recentJobs: recentJobs.length,
        totalCompanies: companies.length,
        lastScrapingSession: Array.from(scrapingSessions.values())
          .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())[0]?.id || null,
        scrapingHistory: {
          totalSessions: scrapingSessions.size,
          completedSessions: Array.from(scrapingSessions.values())
            .filter(s => s.status === 'completed').length,
          failedSessions: Array.from(scrapingSessions.values())
            .filter(s => s.status === 'failed').length
        }
      }
    });
  } catch (error) {
    console.error('Error getting scraping stats:', error);
    res.status(500).json({ success: false, error: 'Failed to get statistics' });
  }
});

/**
 * Internal function to start the scraping process
 */
function startScrapingProcess(sessionId: string, options: any) {
  const scrapyDir = path.join(__dirname, '../../scrapy_jobs');
  const pythonScript = path.join(scrapyDir, 'run_scrapers.py');
  
  // Build command arguments
  const args = ['python3', pythonScript];
  
  if (options.spiders && options.spiders.length === 1) {
    args.push('--spider', options.spiders[0]);
  }
  
  if (options.maxItems) {
    args.push('--max-items', options.maxItems.toString());
  }
  
  if (options.concurrent) {
    args.push('--concurrent', options.concurrent.toString());
  }
  
  if (options.dryRun) {
    args.push('--dry-run');
  }
  
  console.log(`Starting scraping process: ${args.join(' ')}`);
  
  // Start the process
  const scrapingProcess = spawn(args[0], args.slice(1), {
    cwd: scrapyDir,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  const session = scrapingSessions.get(sessionId)!;
  
  // Handle process output
  scrapingProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`[${sessionId}] ${output}`);
    
    // Parse progress from output (implement based on your logging format)
    // This is a simple example - you'd want more sophisticated parsing
    if (output.includes('Spider') && output.includes('completed')) {
      session.progress.spidersCompleted++;
    }
    if (output.includes('Scraped from')) {
      session.progress.itemsScraped++;
    }
  });
  
  scrapingProcess.stderr.on('data', (data) => {
    const error = data.toString();
    console.error(`[${sessionId}] ERROR: ${error}`);
    session.progress.errors++;
  });
  
  scrapingProcess.on('close', (code) => {
    session.endTime = new Date();
    
    if (code === 0) {
      session.status = 'completed';
      console.log(`[${sessionId}] Scraping completed successfully`);
      
      // Load and store results
      loadScrapingResults(sessionId);
    } else {
      session.status = 'failed';
      session.error = `Process exited with code ${code}`;
      console.error(`[${sessionId}] Scraping failed with code ${code}`);
    }
  });
  
  scrapingProcess.on('error', (error) => {
    session.status = 'failed';
    session.endTime = new Date();
    session.error = error.message;
    console.error(`[${sessionId}] Process error:`, error);
  });
}

/**
 * Load scraping results from the report file
 */
async function loadScrapingResults(sessionId: string) {
  try {
    const scrapyDir = path.join(__dirname, '../../scrapy_jobs');
    
    // Find the most recent scraping report
    const files = await fs.readdir(scrapyDir);
    const reportFiles = files
      .filter(file => file.startsWith('scraping_report_') && file.endsWith('.json'))
      .sort()
      .reverse();
    
    if (reportFiles.length > 0) {
      const reportPath = path.join(scrapyDir, reportFiles[0]);
      const reportContent = await fs.readFile(reportPath, 'utf-8');
      const results = JSON.parse(reportContent);
      
      const session = scrapingSessions.get(sessionId);
      if (session) {
        session.results = results;
        session.progress.itemsScraped = results.statistics?.jobs_scraped || 0;
      }
    }
  } catch (error) {
    console.error(`Error loading results for session ${sessionId}:`, error);
  }
}

export default router;
