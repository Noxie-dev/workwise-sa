import { Router } from 'express';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { storage } from '../storage';

const router = Router();

const triggerScrapingSchema = z.object({
  spiders: z.array(z.string()).optional(),
  maxItems: z.number().min(1).max(10000).optional(),
  concurrent: z.number().min(1).max(5).optional(),
  dryRun: z.boolean().optional(),
});

type ScrapingStatus = 'running' | 'completed' | 'failed' | 'cancelled';

type ScrapingSession = {
  id: string;
  status: ScrapingStatus;
  startTime: Date;
  endTime?: Date;
  spiders: string[];
  progress: {
    spidersCompleted: number;
    totalSpiders: number;
    itemsScraped: number;
    errors: number;
  };
  results?: unknown;
  error?: string;
};

type TriggerScrapingOptions = z.infer<typeof triggerScrapingSchema>;

const scrapingSessions = new Map<string, ScrapingSession>();

const scrapyDir = path.join(process.cwd(), 'scrapy_jobs');
const scrapingLogPath = path.join(scrapyDir, 'job_scraping.log');
const pythonScript = path.join(scrapyDir, 'run_scrapers.py');

router.get('/status', async (_req, res) => {
  try {
    const sessions = Array.from(scrapingSessions.values()).map((session) => ({
      id: session.id,
      status: session.status,
      startTime: session.startTime,
      endTime: session.endTime,
      progress: session.progress,
      spiders: session.spiders,
    }));

    res.json({
      success: true,
      sessions,
      activeSessions: sessions.filter((s) => s.status === 'running').length,
    });
  } catch (error) {
    console.error('Error getting scraping status:', error);
    res.status(500).json({ success: false, error: 'Failed to get scraping status' });
  }
});

router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = scrapingSessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    return res.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error('Error getting session details:', error);
    return res.status(500).json({ success: false, error: 'Failed to get session details' });
  }
});

router.post('/trigger', async (req, res) => {
  try {
    const validatedData = triggerScrapingSchema.parse(req.body);

    const runningSessions = Array.from(scrapingSessions.values()).filter(
      (session) => session.status === 'running'
    );

    if (runningSessions.length >= 2) {
      return res.status(429).json({
        success: false,
        error: 'Maximum number of concurrent scraping sessions reached',
      });
    }

    const sessionId = `scraping_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const spiders = validatedData.spiders ?? ['gumtree_jobs'];

    const session: ScrapingSession = {
      id: sessionId,
      status: 'running',
      startTime: new Date(),
      spiders,
      progress: {
        spidersCompleted: 0,
        totalSpiders: spiders.length,
        itemsScraped: 0,
        errors: 0,
      },
    };

    scrapingSessions.set(sessionId, session);
    startScrapingProcess(sessionId, validatedData);

    return res.json({
      success: true,
      sessionId,
      message: 'Scraping process started',
      session: {
        id: session.id,
        status: session.status,
        startTime: session.startTime,
        spiders: session.spiders,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.issues,
      });
    }

    console.error('Error triggering scraping:', error);
    return res.status(500).json({ success: false, error: 'Failed to trigger scraping' });
  }
});

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
        error: 'Session is not running',
      });
    }

    session.status = 'cancelled';
    session.endTime = new Date();

    return res.json({
      success: true,
      message: 'Scraping session cancelled',
    });
  } catch (error) {
    console.error('Error cancelling scraping session:', error);
    return res.status(500).json({ success: false, error: 'Failed to cancel session' });
  }
});

router.get('/logs/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    try {
      const logContent = await fs.readFile(scrapingLogPath, 'utf-8');
      const sessionLogs = logContent
        .split('\n')
        .filter((line) => line.includes(sessionId) || line.includes('INFO'))
        .slice(-100);

      return res.json({
        success: true,
        logs: sessionLogs,
      });
    } catch {
      return res.json({
        success: true,
        logs: ['Log file not found or not accessible'],
        warning: 'Could not access log file',
      });
    }
  } catch (error) {
    console.error('Error getting scraping logs:', error);
    return res.status(500).json({ success: false, error: 'Failed to get logs' });
  }
});

router.get('/stats', async (_req, res) => {
  try {
    const totalJobs = await storage.getJobs();
    const recentJobs = totalJobs.filter((job) => {
      const createdAt = new Date(job.createdAt!);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return createdAt > sevenDaysAgo;
    });

    const companies = await storage.getCompanies();

    return res.json({
      success: true,
      stats: {
        totalJobs: totalJobs.length,
        recentJobs: recentJobs.length,
        totalCompanies: companies.length,
        lastScrapingSession:
          Array.from(scrapingSessions.values()).sort(
            (a, b) => b.startTime.getTime() - a.startTime.getTime()
          )[0]?.id ?? null,
        scrapingHistory: {
          totalSessions: scrapingSessions.size,
          completedSessions: Array.from(scrapingSessions.values()).filter(
            (s) => s.status === 'completed'
          ).length,
          failedSessions: Array.from(scrapingSessions.values()).filter((s) => s.status === 'failed')
            .length,
        },
      },
    });
  } catch (error) {
    console.error('Error getting scraping stats:', error);
    return res.status(500).json({ success: false, error: 'Failed to get statistics' });
  }
});

function startScrapingProcess(sessionId: string, options: TriggerScrapingOptions) {
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

  const scrapingProcess = spawn(args[0], args.slice(1), {
    cwd: scrapyDir,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const session = scrapingSessions.get(sessionId);
  if (!session) return;

  scrapingProcess.stdout.on('data', (data: Buffer) => {
    const output = data.toString();
    console.log(`[${sessionId}] ${output}`);

    if (output.includes('Spider') && output.includes('completed')) {
      session.progress.spidersCompleted += 1;
    }
    if (output.includes('Scraped from')) {
      session.progress.itemsScraped += 1;
    }
  });

  scrapingProcess.stderr.on('data', (data: Buffer) => {
    const errorOutput = data.toString();
    console.error(`[${sessionId}] ERROR: ${errorOutput}`);
    session.progress.errors += 1;
  });

  scrapingProcess.on('close', (code) => {
    session.endTime = new Date();

    if (code === 0) {
      session.status = 'completed';
      console.log(`[${sessionId}] Scraping completed successfully`);
      void loadScrapingResults(sessionId);
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

async function loadScrapingResults(sessionId: string) {
  try {
    const files = await fs.readdir(scrapyDir);
    const reportFiles = files
      .filter((file) => file.startsWith('scraping_report_') && file.endsWith('.json'))
      .sort()
      .reverse();

    if (reportFiles.length === 0) return;

    const reportPath = path.join(scrapyDir, reportFiles[0]);
    const reportContent = await fs.readFile(reportPath, 'utf-8');
    const results = JSON.parse(reportContent) as {
      statistics?: { jobs_scraped?: number };
    };

    const session = scrapingSessions.get(sessionId);
    if (!session) return;

    session.results = results;
    session.progress.itemsScraped = results.statistics?.jobs_scraped ?? 0;
  } catch (error) {
    console.error(`Error loading results for session ${sessionId}:`, error);
  }
}

export default router;
