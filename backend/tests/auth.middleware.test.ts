import { beforeEach, describe, expect, it, vi } from 'vitest';

const { verifyMock, tokenExpiredErrorCtor, findByIdMock, loggerWarnMock } = vi.hoisted(() => {
  class TokenExpiredError extends Error {}

  return {
    verifyMock: vi.fn(),
    tokenExpiredErrorCtor: TokenExpiredError,
    findByIdMock: vi.fn(),
    loggerWarnMock: vi.fn(),
  };
});

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: verifyMock,
    TokenExpiredError: tokenExpiredErrorCtor,
  },
}));

vi.mock('../src/models/User', () => ({
  User: {
    findById: findByIdMock,
  },
}));

vi.mock('../src/utils/logger', () => ({
  logger: {
    warn: loggerWarnMock,
  },
}));

import { authenticate, requireRole } from '../src/middleware/auth';

function createRes() {
  const res = {} as {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('auth middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when no token is provided', async () => {
    const req = { cookies: {}, headers: {} } as any;
    const res = createRes();
    const next = vi.fn();

    await authenticate(req, res as any, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('attaches user and calls next for a valid bearer token', async () => {
    const user = { _id: 'user-1', role: 'user' };
    verifyMock.mockReturnValue({ userId: 'user-1', email: 'a@b.com', role: 'user' });
    findByIdMock.mockResolvedValue(user);

    const req = { cookies: {}, headers: { authorization: 'Bearer token-123' } } as any;
    const res = createRes();
    const next = vi.fn();

    await authenticate(req, res as any, next);

    expect(findByIdMock).toHaveBeenCalledWith('user-1');
    expect(req.user).toBe(user);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('returns 401 when token is valid but user does not exist', async () => {
    verifyMock.mockReturnValue({ userId: 'missing-user', email: 'a@b.com', role: 'user' });
    findByIdMock.mockResolvedValue(null);

    const req = { cookies: {}, headers: { authorization: 'Bearer token-123' } } as any;
    const res = createRes();
    const next = vi.fn();

    await authenticate(req, res as any, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 with token-expired message for expired tokens', async () => {
    verifyMock.mockImplementation(() => {
      throw new tokenExpiredErrorCtor('expired');
    });

    const req = { cookies: {}, headers: { authorization: 'Bearer token-123' } } as any;
    const res = createRes();
    const next = vi.fn();

    await authenticate(req, res as any, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token expired' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 with invalid-token message for other verify errors', async () => {
    verifyMock.mockImplementation(() => {
      throw new Error('bad token');
    });

    const req = { cookies: {}, headers: { authorization: 'Bearer token-123' } } as any;
    const res = createRes();
    const next = vi.fn();

    await authenticate(req, res as any, next);

    expect(loggerWarnMock).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('requireRole middleware', () => {
  it('returns 401 if req.user is missing', () => {
    const req = {} as any;
    const res = createRes();
    const next = vi.fn();

    requireRole('admin')(req, res as any, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 if user role is not allowed', () => {
    const req = { user: { role: 'user' } } as any;
    const res = createRes();
    const next = vi.fn();

    requireRole('admin')(req, res as any, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Insufficient permissions' });
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next when user role is allowed', () => {
    const req = { user: { role: 'admin' } } as any;
    const res = createRes();
    const next = vi.fn();

    requireRole('admin')(req, res as any, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
