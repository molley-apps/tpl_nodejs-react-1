/**
 * Extract the most specific human message from a thrown error.
 *
 * The generated HttpException always sets `.message` to the GENERIC status
 * text (e.g. 404 → "Not found") and stores the specific reason on `.body`
 * ("User not found", …).
 * Naively reading `error.message` therefore loses the actual cause — this
 * prefers the specific `.body` string, falling back to `.message`, then a
 * caller-supplied default. Duck-typed so it works regardless of where the
 * HttpException was constructed.
 */
export function httpErrorMessage(error: unknown, fallback = 'Unexpected error'): string {
  const candidate = error as { body?: unknown; message?: unknown } | null;
  if (candidate && typeof candidate.body === 'string' && candidate.body.trim()) {
    return candidate.body;
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  if (candidate && typeof candidate.message === 'string' && candidate.message.trim()) {
    return candidate.message;
  }
  return fallback;
}
