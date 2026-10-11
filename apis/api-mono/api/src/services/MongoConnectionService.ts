import mongoose, { ConnectOptions } from 'mongoose';
import config, { MongoDbConfig } from '@/config';

/**
 * Owns the single Mongoose connection for the process.
 *
 * Replaces the `load-mongoose` package, whose loader raced two failure
 * channels against one promise: it called `mongoose.connect()` AND attached a
 * `connection.on('error')` handler that rejected the same promise. A
 * connection error event fired while `connect()` was still in flight rejected
 * the caller, which then retried and called `mongoose.connect()` a SECOND time
 * on a connection still in `connecting` state. That builds a second
 * MongoClient, orphans the first (sockets and all), and leaves `readyState`
 * driven by two competing topologies — a wedged pod that no longer recovers on
 * its own. That is the shape of the 2026-08-18 outage: every request 500'd
 * with `Operation \`sessions.findOne()\` buffering timed out` while Atlas
 * itself sat idle.
 *
 * The rules this class exists to enforce:
 *   1. At most ONE `mongoose.connect()` in flight at a time, ever.
 *   2. Retries are driven ONLY by the connect promise rejecting — never by a
 *      stray `error` event.
 *   3. Once connected, we never call `connect()` again. The driver's own
 *      topology monitoring (SDAM heartbeat) reconnects after a blip; calling
 *      `connect()` on a live connection is what breaks it.
 *   4. Connection state changes are logged, so "did this pod ever reach
 *      Mongo?" is a log query rather than a forensic exercise.
 */

// A failing attempt should fail fast so the backoff can do its job — the
// driver's 30s default meant one bad attempt burned 30s before the first retry.
const SERVER_SELECTION_TIMEOUT_MS = Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || 10_000;

const MAX_CONNECT_ATTEMPTS = Number(process.env.MONGO_MAX_CONNECT_ATTEMPTS) || 10;
const MAX_BACKOFF_MS = 30_000;

// How long a model operation waits for the connection before erroring. The
// connection is established in the BACKGROUND (the port opens first, see
// server.ts), so an early request can arrive mid-connect and Mongoose buffers
// it until the connection is open.
//
// This was 30s, which is why a transient wobble became a full outage: every
// in-flight request held a Cloud Run concurrency slot for 30 seconds, the pod
// saturated at container_concurrency=80, and Cloud Run scaled out into more
// cold pods. Failing fast sheds load instead of accumulating it — the caller
// gets a prompt error and can retry against a healthy pod.
const BUFFER_TIMEOUT_MS = Number(process.env.MONGO_BUFFER_TIMEOUT_MS) || 2_000;

// Set at module load — before the port opens — so no operation can ever be
// buffered under the old default.
mongoose.set('bufferTimeoutMS', BUFFER_TIMEOUT_MS);

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

class MongoConnectionService {
  /** The in-flight connect, if any. Guarantees rule 1. */
  private connecting: Promise<void> | null = null;
  private listenersBound = false;

  /**
   * True only when the connection is live and operations will go straight to
   * the server rather than being buffered.
   */
  public get isConnected(): boolean {
    return mongoose.connection.readyState === mongoose.STATES.connected;
  }

  /**
   * Build the connection URI. An explicit MONGO_URI wins; otherwise it is
   * assembled from the discrete parts.
   *
   * Credentials are percent-encoded, so a password containing a URI-reserved
   * character (`@`, `/`, `:`) still produces a valid URI whatever the deployer
   * generates.
   */
  public buildUri(dbConfig: MongoDbConfig = config.mongoDb): string {
    if (dbConfig.mongoUri) {
      return dbConfig.mongoUri;
    }

    const protocol = dbConfig.mongoProtocol || 'mongodb+srv';
    const credentials = dbConfig.mongoUser
      ? `${encodeURIComponent(dbConfig.mongoUser)}:${encodeURIComponent(dbConfig.mongoPassword || '')}@`
      : '';
    const port = dbConfig.mongoPort ? `:${dbConfig.mongoPort}` : '';
    const params = dbConfig.mongoAdditionalParams ? `?${dbConfig.mongoAdditionalParams}` : '';

    return `${protocol}://${credentials}${dbConfig.mongoHost}${port}/${dbConfig.mongoDatabase}${params}`;
  }

  /**
   * Connect, retrying with exponential backoff. Idempotent and safe to call
   * concurrently: callers share a single in-flight attempt, and a caller
   * arriving once connected resolves immediately.
   *
   * Rejects only after MAX_CONNECT_ATTEMPTS have failed — at which point the
   * caller (startup) exits the process so Cloud Run replaces the pod.
   */
  public connect(): Promise<void> {
    if (this.isConnected) {
      return Promise.resolve();
    }

    if (!this.connecting) {
      this.connecting = this.connectWithRetry().finally(() => {
        this.connecting = null;
      });
    }

    return this.connecting;
  }

  private connectOptions(): ConnectOptions {
    return {
      ...config.mongoDb.mongoOpts,
      serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
    };
  }

  private async connectWithRetry(): Promise<void> {
    this.bindListeners();

    for (let attempt = 1; attempt <= MAX_CONNECT_ATTEMPTS; attempt++) {
      try {
        // Awaited, so only one connect is ever in flight (rule 1). The retry
        // is driven by THIS promise rejecting and nothing else (rule 2).
        await mongoose.connect(this.buildUri(), this.connectOptions());
        return;
      } catch (error) {
        if (attempt >= MAX_CONNECT_ATTEMPTS) {
          console.error(`[Mongo] connect failed after ${attempt} attempts, giving up`, error);
          throw error;
        }

        const delayMs = Math.min(1000 * 2 ** (attempt - 1), MAX_BACKOFF_MS);
        console.error(
          `[Mongo] connect failed (attempt ${attempt}/${MAX_CONNECT_ATTEMPTS}), retrying in ${delayMs}ms:`,
          error,
        );
        await sleep(delayMs);
      }
    }
  }

  /**
   * Bind connection lifecycle logging. Bound once per process — the old
   * implementation re-bound an `error` listener on every retry, leaking
   * listeners and re-arming the faulty retry trigger.
   *
   * Note what these handlers do NOT do: reconnect. A `disconnected` event is
   * the driver telling us it has already started recovering. Calling
   * `connect()` here would be the exact bug this class was written to remove.
   */
  private bindListeners(): void {
    if (this.listenersBound) {
      return;
    }
    this.listenersBound = true;

    const connection = mongoose.connection;

    connection.on('connected', () => {
      console.log(`[Mongo] connected to ${config.mongoDb.mongoHost}`);
    });

    connection.on('disconnected', () => {
      console.warn('[Mongo] disconnected — the driver will re-establish automatically');
    });

    connection.on('reconnected', () => {
      console.log('[Mongo] reconnected');
    });

    connection.on('error', (error) => {
      console.error('[Mongo] connection error', error);
    });
  }
}

export default new MongoConnectionService();
