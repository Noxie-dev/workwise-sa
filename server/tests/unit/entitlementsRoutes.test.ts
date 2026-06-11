import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../firebase', () => ({
  auth: {
    verifyIdToken: vi.fn(),
  },
}));

vi.mock('../../services/authenticatedUser', () => ({
  resolveAuthenticatedDatabaseUser: vi.fn(),
}));

vi.mock('../../services/entitlementService', () => ({
  entitlementService: {
    getEntitlementsForUser: vi.fn(),
  },
}));

import router from '../../routes/entitlements';
import { auth } from '../../firebase';
import { resolveAuthenticatedDatabaseUser } from '../../services/authenticatedUser';
import { entitlementService } from '../../services/entitlementService';

const mockedAuth = vi.mocked(auth);
const mockedResolveUser = vi.mocked(resolveAuthenticatedDatabaseUser);
const mockedEntitlements = vi.mocked(entitlementService);

function createMockResponse() {
  return {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
}

async function invokeGetMe(req: Record<string, any>) {
  const layer: any = router.stack.find((entry: any) => entry.route?.path === '/me');
  const handler = layer.route.stack[0].handle;
  const response = createMockResponse();
  let capturedError: unknown;

  await handler(req, response, (error?: unknown) => {
    capturedError = error;
  });

  if (capturedError) throw capturedError;
  return response;
}

describe('entitlements routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns anonymous free capabilities without requiring auth', async () => {
    mockedEntitlements.getEntitlementsForUser.mockResolvedValue({
      canGenerateCv: false,
      canGenerateCoverLetter: false,
      hasUnlimitedAiCv: false,
      hasUnlimitedAiCoverLetters: false,
      adsEnabled: true,
      candidatePromotionLite: false,
      remainingFreeCvGenerations: 0,
      remainingFreeCoverLetterGenerations: 0,
      workwisePlusActive: false,
    });

    const response = await invokeGetMe({ headers: {} });

    expect(response.body).toMatchObject({ adsEnabled: true });
    expect(mockedEntitlements.getEntitlementsForUser).toHaveBeenCalledWith(undefined);
  });

  it('resolves the database user before returning authenticated capabilities', async () => {
    mockedAuth.verifyIdToken.mockResolvedValue({
      uid: 'firebase-1',
      email: 'user@example.com',
    } as any);
    mockedResolveUser.mockResolvedValue({ id: 12, email: 'user@example.com' } as any);
    mockedEntitlements.getEntitlementsForUser.mockResolvedValue({
      canGenerateCv: true,
      canGenerateCoverLetter: true,
      hasUnlimitedAiCv: true,
      hasUnlimitedAiCoverLetters: true,
      adsEnabled: false,
      candidatePromotionLite: true,
      remainingFreeCvGenerations: 3,
      remainingFreeCoverLetterGenerations: 3,
      workwisePlusActive: true,
    });

    const response = await invokeGetMe({
      headers: { authorization: 'Bearer token' },
    });

    expect(response.body).toMatchObject({ canGenerateCv: true, adsEnabled: false });
    expect(mockedEntitlements.getEntitlementsForUser).toHaveBeenCalledWith(12);
  });
});
