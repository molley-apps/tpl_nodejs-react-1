import { OAuth2Client } from 'google-auth-library';
import { verifySchedulerOidc } from '@/utils/verifySchedulerOidc';
import { UnauthorizedException } from '@/http/nodegen/errors';

const expected = { audience: 'https://shop-dev.molley.site', invokerEmail: 'dev-shop-sched@p.iam.gserviceaccount.com' };

const clientWith = (payload: Record<string, unknown> | Error) =>
  ({
    verifyIdToken: jest.fn(async () => {
      if (payload instanceof Error) {
        throw payload;
      }
      return { getPayload: () => payload };
    }),
  }) as unknown as OAuth2Client;

const good = { iss: 'https://accounts.google.com', email: expected.invokerEmail, email_verified: true };

describe('verifySchedulerOidc', () => {
  it('accepts a verified Google token for the invoker account and the deployment audience', async () => {
    const client = clientWith(good);
    await expect(verifySchedulerOidc('Bearer tok', expected, client)).resolves.toBeUndefined();
    expect(client.verifyIdToken).toHaveBeenCalledWith({ idToken: 'tok', audience: expected.audience });
  });

  it('refuses a missing header, a non-bearer header and a missing invoker configuration', async () => {
    await expect(verifySchedulerOidc(undefined, expected, clientWith(good))).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(verifySchedulerOidc('Basic abc', expected, clientWith(good))).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(verifySchedulerOidc('Bearer tok', { ...expected, invokerEmail: '' }, clientWith(good))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('refuses a token Google rejects (wrong audience, expired, forged)', async () => {
    await expect(verifySchedulerOidc('Bearer tok', expected, clientWith(new Error('Wrong recipient')))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('refuses another account, an unverified email and a foreign issuer', async () => {
    for (const payload of [
      { ...good, email: 'someone-else@p.iam.gserviceaccount.com' },
      { ...good, email_verified: false },
      { ...good, iss: 'https://evil.example' },
    ]) {
      await expect(verifySchedulerOidc('Bearer tok', expected, clientWith(payload))).rejects.toBeInstanceOf(UnauthorizedException);
    }
  });
});
