import fs from 'fs';
import path from 'path';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../utils/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../storage', () => ({
  storage: {
    createFile: vi.fn(),
    getFilesByUser: vi.fn(),
    getFile: vi.fn(),
    deleteFile: vi.fn(),
  },
}));

import { storage } from '../../storage';
import { errorHandler } from '../../middleware/errorHandler';
import router from '../../routes/files';

const mockedStorage = vi.mocked(storage);
const uploadsRoot = path.join(process.cwd(), 'uploads');

function createMockResponse() {
  const response: any = {
    statusCode: 200,
    body: undefined,
    headers: {},
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
    setHeader(key: string, value: string) {
      this.headers[key] = value;
    },
  };

  return response;
}

function getFinalRouteHandler(path: string, method: string) {
  const layer = router.stack.find(
    (entry: any) => entry.route?.path === path && entry.route.methods?.[method],
  );

  if (!layer) {
    throw new Error(`Route not found for ${method.toUpperCase()} ${path}`);
  }

  return layer.route.stack[layer.route.stack.length - 1].handle;
}

async function invokeFinalHandler({
  path,
  method,
  req,
}: {
  path: string;
  method: 'post';
  req: Record<string, any>;
}) {
  const handler = getFinalRouteHandler(path, method);
  const response = createMockResponse();
  let capturedError: unknown;

  await handler(req, response, (error?: unknown) => {
    if (error) {
      capturedError = error;
    }
  });

  if (capturedError) {
    errorHandler(capturedError, req as any, response as any, vi.fn());
  }

  return response;
}

describe('file routes', () => {
  beforeAll(() => {
    fs.mkdirSync(path.join(uploadsRoot, 'temp'), { recursive: true });
  });

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.FILE_SERVE_URL = 'http://localhost:3001';
  });

  afterEach(() => {
    fs.rmSync(path.join(uploadsRoot, 'profile-images'), { recursive: true, force: true });
    fs.rmSync(path.join(uploadsRoot, 'cvs'), { recursive: true, force: true });
    fs.rmSync(path.join(uploadsRoot, 'general'), { recursive: true, force: true });
    fs.mkdirSync(path.join(uploadsRoot, 'temp'), { recursive: true });
  });

  it('uploads a profile image and persists file metadata', async () => {
    const tempFile = path.join(uploadsRoot, 'temp', 'avatar-upload.png');
    fs.writeFileSync(tempFile, 'fake-image-content');

    mockedStorage.createFile.mockImplementation(async (fileData: any) => ({
      id: 321,
      ...fileData,
    }));

    const response = await invokeFinalHandler({
      path: '/upload-profile-image',
      method: 'post',
      req: {
        body: { userId: '42' },
        file: {
          originalname: 'avatar.png',
          mimetype: 'image/png',
          size: 18,
          path: tempFile,
          encoding: '7bit',
        },
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.fileId).toBe(321);
    expect(mockedStorage.createFile).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 42,
        originalName: 'avatar.png',
        fileType: 'profile_image',
        mimeType: 'image/png',
        fileUrl: expect.stringContaining('/uploads/profile-images/user-42/'),
      }),
    );
  });

  it('rejects cv uploads when the file is not a pdf', async () => {
    const tempFile = path.join(uploadsRoot, 'temp', 'avatar-upload.png');
    fs.writeFileSync(tempFile, 'not-a-pdf');

    const response = await invokeFinalHandler({
      path: '/upload-cv',
      method: 'post',
      req: {
        body: { userId: '42' },
        file: {
          originalname: 'avatar.png',
          mimetype: 'image/png',
          size: 9,
          path: tempFile,
          encoding: '7bit',
        },
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.error.message).toMatch(/cv must be a pdf/i);
    expect(mockedStorage.createFile).not.toHaveBeenCalled();
  });

  it('rejects generic uploads without a user id', async () => {
    const tempFile = path.join(uploadsRoot, 'temp', 'note-upload.png');
    fs.writeFileSync(tempFile, 'fake-image-content');

    const response = await invokeFinalHandler({
      path: '/upload',
      method: 'post',
      req: {
        body: { fileType: 'general' },
        file: {
          originalname: 'note.png',
          mimetype: 'image/png',
          size: 18,
          path: tempFile,
          encoding: '7bit',
        },
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.error.message).toMatch(/user id is required/i);
  });
});
