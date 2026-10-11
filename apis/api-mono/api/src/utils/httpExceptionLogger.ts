import { httpErrorMessage } from '@/utils/httpErrorMessage';

/**
 * How an HttpException should be logged.
 *
 * The generated handler (`http/nodegen/middleware/handleHttpException`) logs
 * EVERY exception through `console.error`, and our logger maps console.error to
 * `severity: 'ERROR'` for Cloud Run's structured logging. So a 404 for a stale
 * tool id, an expired session's 401, or a bot probing an unknown route all
 * landed in GCP as service errors — inflating the error graph with outcomes
 * that are the API working correctly.
 *
 * A 4xx means the CLIENT got something wrong; only a 5xx is the service at
 * fault. Hence: 4xx → WARNING and a one-line summary (a stack trace for "Route
 * not found" is noise, and it's the stack that makes these read as faults),
 * 5xx and anything unrecognised → ERROR with the full stack, unchanged.
 */
export interface HttpExceptionLog {
  level: 'error' | 'warn';
  message: string;
}

/** A status is only a service fault at 5xx - or when we can't tell what it was. */
export function isClientError(status: number): boolean {
  return status >= 400 && status < 500;
}

/**
 * Decide the level and text for a thrown HttpException. Pure, and duck-typed
 * on `.status` so it copes with anything the error middleware hands it -
 * including plain Errors that never made it through
 * `createHttpExceptionFromErr` (those have no status, so they stay ERROR).
 */
export function describeHttpException(error: unknown): HttpExceptionLog {
  const status = (error as { status?: unknown } | null)?.status;

  if (typeof status === 'number' && isClientError(status)) {
    // `.message` is the generic status text and `.body` the specific reason,
    // so this reads e.g. "HTTP 404 Not Found - App not found".
    const generic = error instanceof Error && error.message.trim() ? error.message : undefined;
    const specific = httpErrorMessage(error, '');
    const detail = specific && specific !== generic ? ` - ${specific}` : '';
    return { level: 'warn', message: `HTTP ${status} ${generic ?? ''}${detail}`.replace(/\s+/g, ' ').trim() };
  }

  return {
    level: 'error',
    message: (error instanceof Error && error.stack) || String(error),
  };
}

/**
 * Drop-in `errorLogger` for the generated handleHttpException middleware,
 * wired up in `app.ts`. Nothing under `http/nodegen` is touched - the
 * middleware already accepts a logger override.
 */
export function logHttpException(error: unknown): void {
  const { level, message } = describeHttpException(error);
  if (level === 'warn') {
    console.warn(message);
    return;
  }
  console.error(message);
}
