import { describe, it, expect, beforeEach } from 'vitest';
import { GET as unsubscribe } from '../app/api/unsubscribe/route';
import { User } from '../lib/models/User';
import { z } from 'zod';

describe('Security & Unsubscribe Token', () => {
  const credentialsSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  });

  it('NoSQL injection returns validation failure safely', () => {
    // Attempting NoSQL injection via object { "$ne": null }
    const payload = { email: { "$ne": null }, password: 'password123' };
    const result = credentialsSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('unsubscribe token works correctly: rejects invalid and unsubscribes valid token', async () => {
    // 1. Missing token -> 400
    const reqMissing = new Request('http://localhost/api/unsubscribe');
    const resMissing = await unsubscribe(reqMissing);
    expect(resMissing.status).toBe(400);

    // 2. Invalid token -> 404
    const reqInvalid = new Request('http://localhost/api/unsubscribe?token=nonexistent_token_xyz');
    const resInvalid = await unsubscribe(reqInvalid);
    expect(resInvalid.status).toBe(404);

    // 3. Valid token -> 200 and sets settings.dailyEmail to false
    const testUser = await User.create({
      email: 'unsubscribe-test@example.com',
      passwordHash: 'fakehash12345678',
      unsubscribeToken: 'valid-secret-token-456',
      settings: { dailyEmail: true },
    });

    const reqValid = new Request(`http://localhost/api/unsubscribe?token=${testUser.unsubscribeToken}`);
    const resValid = await unsubscribe(reqValid);
    expect(resValid.status).toBe(200);

    // Verify in database that dailyEmail is now false
    const updatedUser = await User.findById(testUser._id).lean();
    expect(updatedUser?.settings?.dailyEmail).toBe(false);
  });

  it('login rate limiting audit: credentials route does not currently throttle by default', () => {
    // Documenting current behavior: NextAuth Credentials provider does not have built-in Redis rate-limiting
    const isRateLimiterConfigured = process.env.UPSTASH_REDIS_REST_URL !== undefined;
    expect(isRateLimiterConfigured).toBe(false);
  });
});
