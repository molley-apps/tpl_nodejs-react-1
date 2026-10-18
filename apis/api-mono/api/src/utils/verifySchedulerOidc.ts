import { OAuth2Client } from 'google-auth-library';
import { UnauthorizedException } from '@/http/nodegen/errors';

const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

/**
 * Checks the bearer token Cloud Scheduler sends with a job call: a Google OIDC token for this deployment's URL,
 * minted for the scheduler invoker service account. The job endpoint is reachable from the internet, so this check
 * is the only thing between it and anyone else. Throws 401 on anything short of a full match.
 */
export async function verifySchedulerOidc(
  authorization: string | undefined,
  expected: { audience: string; invokerEmail: string },
  client: OAuth2Client = new OAuth2Client(),
): Promise<void> {
  const token = authorization?.startsWith('Bearer ') ? authorization.slice('Bearer '.length).trim() : '';
  if (!token || !expected.invokerEmail) {
    throw new UnauthorizedException('A scheduler token is required');
  }
  let payload;
  try {
    payload = (await client.verifyIdToken({ idToken: token, audience: expected.audience })).getPayload();
  } catch {
    throw new UnauthorizedException('Invalid scheduler token');
  }
  const issuerOk = !!payload?.iss && GOOGLE_ISSUERS.includes(payload.iss);
  if (!payload || !issuerOk || payload.email !== expected.invokerEmail || payload.email_verified !== true) {
    throw new UnauthorizedException('Scheduler token is not from the invoker account');
  }
}
