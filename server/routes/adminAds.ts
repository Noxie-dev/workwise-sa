import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { and, desc, eq } from 'drizzle-orm';
import { adCampaigns } from '@shared/schema';
import { adPlacementSchema } from '@shared/monetization';
import { db } from '../db';
import { Errors } from '../middleware/errorHandler';
import { type AuthenticatedRequest, verifyFirebaseToken } from '../middleware/auth';
import { assertRole, resolveAuthenticatedDatabaseUser } from '../services/authenticatedUser';

const router = Router();

const upload = multer({
  dest: 'uploads/temp/',
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
    }
  },
});

router.use(verifyFirebaseToken);

async function requireAdmin(req: AuthenticatedRequest) {
  const user = await resolveAuthenticatedDatabaseUser(req.user!);
  assertRole(user, ['admin']);
  return user;
}

const parseOptionalDate = (value: unknown) => {
  if (!value || typeof value !== 'string') return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw Errors.validation('Invalid date value');
  }
  return parsed;
};

const parseBudgetCents = (value: unknown) => {
  if (value === undefined || value === null || value === '') return 0;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw Errors.validation('Budget must be a positive number');
  }
  return Math.round(parsed * 100);
};

const parseCampaignBody = (body: Record<string, unknown>) => {
  const placement = typeof body.placement === 'string' ? body.placement : '';
  const parsedPlacement = adPlacementSchema.safeParse(placement);
  if (!parsedPlacement.success) {
    throw Errors.validation('Invalid ad placement');
  }

  const advertiserName = typeof body.advertiserName === 'string' ? body.advertiserName.trim() : '';
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const targetUrl = typeof body.targetUrl === 'string' ? body.targetUrl.trim() : '';
  const status = typeof body.status === 'string' ? body.status : 'draft';

  if (!advertiserName) throw Errors.validation('Advertiser name is required');
  if (!title) throw Errors.validation('Creative title is required');
  if (!targetUrl) throw Errors.validation('Advertiser URL is required');
  if (!['draft', 'active', 'paused', 'archived'].includes(status)) {
    throw Errors.validation('Invalid campaign status');
  }

  const startAt = parseOptionalDate(body.startAt);
  const endAt = parseOptionalDate(body.endAt);
  if (startAt && endAt && startAt > endAt) {
    throw Errors.validation('Start date must be before end date');
  }

  return {
    advertiserName,
    title,
    description: typeof body.description === 'string' ? body.description.trim() || null : null,
    placement: parsedPlacement.data,
    imageUrl: typeof body.imageUrl === 'string' ? body.imageUrl.trim() || null : null,
    targetUrl,
    startAt,
    endAt,
    budgetCents: parseBudgetCents(body.budget),
    currency: typeof body.currency === 'string' && body.currency.trim() ? body.currency.trim() : 'ZAR',
    status,
  };
};

router.get('/campaigns', async (req, res, next) => {
  try {
    await requireAdmin(req as AuthenticatedRequest);
    const placement = typeof req.query.placement === 'string' ? req.query.placement : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;

    const filters = [
      placement ? eq(adCampaigns.placement, placement) : undefined,
      status && status !== 'all' ? eq(adCampaigns.status, status) : undefined,
    ].filter(Boolean);

    const campaigns = await db
      .select()
      .from(adCampaigns)
      .where(filters.length ? and(...(filters as any[])) : undefined)
      .orderBy(desc(adCampaigns.updatedAt));

    res.json({ campaigns });
  } catch (error) {
    next(error);
  }
});

router.post('/campaigns', async (req, res, next) => {
  try {
    const user = await requireAdmin(req as AuthenticatedRequest);
    const payload = parseCampaignBody(req.body);
    const [campaign] = await db
      .insert(adCampaigns)
      .values({
        ...payload,
        createdByUserId: user.id,
        updatedAt: new Date(),
      })
      .returning();

    res.status(201).json({ campaign });
  } catch (error) {
    next(error);
  }
});

router.put('/campaigns/:id', async (req, res, next) => {
  try {
    await requireAdmin(req as AuthenticatedRequest);
    const campaignId = Number(req.params.id);
    if (!Number.isInteger(campaignId)) throw Errors.validation('Invalid campaign ID');

    const payload = parseCampaignBody(req.body);
    const [campaign] = await db
      .update(adCampaigns)
      .set({
        ...payload,
        updatedAt: new Date(),
      })
      .where(eq(adCampaigns.id, campaignId))
      .returning();

    if (!campaign) throw Errors.notFound('Ad campaign not found');
    res.json({ campaign });
  } catch (error) {
    next(error);
  }
});

router.delete('/campaigns/:id', async (req, res, next) => {
  try {
    await requireAdmin(req as AuthenticatedRequest);
    const campaignId = Number(req.params.id);
    if (!Number.isInteger(campaignId)) throw Errors.validation('Invalid campaign ID');

    const [existing] = await db.select().from(adCampaigns).where(eq(adCampaigns.id, campaignId));
    if (!existing) throw Errors.notFound('Ad campaign not found');

    if (existing.status === 'draft') {
      await db.delete(adCampaigns).where(eq(adCampaigns.id, campaignId));
      return res.status(204).send();
    }

    await db
      .update(adCampaigns)
      .set({ status: 'archived', updatedAt: new Date() })
      .where(eq(adCampaigns.id, campaignId));
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    await requireAdmin(req as AuthenticatedRequest);
    const file = req.file;
    if (!file) throw Errors.badRequest('No file uploaded');

    const uploadDir = path.join(process.cwd(), 'uploads', 'ad-creatives');
    fs.mkdirSync(uploadDir, { recursive: true });

    const extension = path.extname(file.originalname).toLowerCase() || '.png';
    const filename = `ad-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extension}`;
    const finalPath = path.join(uploadDir, filename);
    fs.copyFileSync(file.path, finalPath);
    fs.unlinkSync(file.path);

    const baseUrl = process.env.FILE_SERVE_URL || '';
    const fileUrl = `${baseUrl}/uploads/ad-creatives/${filename}`;

    res.status(201).json({
      imageUrl: fileUrl,
      filename,
    });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
});

export default router;
