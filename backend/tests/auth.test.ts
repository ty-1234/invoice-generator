import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';

describe('Auth', () => {
  it('should hash password correctly', async () => {
    const password = 'testpassword123';
    const hash = await bcrypt.hash(password, 12);
    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);

    const match = await bcrypt.compare(password, hash);
    expect(match).toBe(true);

    const wrongMatch = await bcrypt.compare('wrongpassword', hash);
    expect(wrongMatch).toBe(false);
  });
});
