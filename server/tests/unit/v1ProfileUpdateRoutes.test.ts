import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../storage', () => ({
  storage: {
    updateUser: vi.fn(),
  },
}));

import { storage } from '../../storage';
import v1Router from '../../routes/v1';

const mockedStorage = vi.mocked(storage);

function getUpdateHandler() {
  const layer = v1Router.stack.find(
    (entry: any) => entry.route?.path === '/users/:userId' && entry.route.methods?.put,
  );
  if (!layer) throw new Error('Legacy profile update route not found');
  return layer.route.stack[layer.route.stack.length - 1].handle;
}

function createResponse() {
  return {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) { this.statusCode = code; return this; },
    json(payload: unknown) { this.body = payload; return this; },
  };
}

describe('legacy v1 profile update route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects server-owned fields before storage mutation', async () => {
    const response = createResponse();
    const next = vi.fn();

    await getUpdateHandler()({
      params: { userId: '7' },
      body: { name: 'Updated', role: 'admin', firebaseUid: 'attacker-uid', password: 'changed' },
      user: { uid: 'firebase-user', userId: 7 },
    }, response, next);

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual(expect.objectContaining({ message: 'Invalid profile update' }));
    expect(mockedStorage.updateUser).not.toHaveBeenCalled();
  });

  it('forwards only editable profile fields to storage', async () => {
    mockedStorage.updateUser.mockResolvedValue({ id: 7, name: 'Updated', role: 'user' } as any);
    const response = createResponse();

    await getUpdateHandler()({
      params: { userId: '7' },
      body: { name: 'Updated', location: 'Cape Town' },
      user: { uid: 'firebase-user', userId: 7 },
    }, response, vi.fn());

    expect(response.statusCode).toBe(200);
    expect(mockedStorage.updateUser).toHaveBeenCalledWith(7, { name: 'Updated', location: 'Cape Town' });
  });
});
