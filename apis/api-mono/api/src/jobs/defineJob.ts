/** What a job handler gets: a logger that lands in the run log, a deadline signal and the start time. */
export interface JobContext {
  log: (message: string) => void;
  /** Aborted shortly before the request deadline; long loops should check it. */
  signal: AbortSignal;
  startedAt: Date;
}

export interface JobSchedule {
  /** Five-field cron expression */
  cron: string;
  /** IANA timezone name */
  timezone: string;
}

export interface JobDefinition {
  /** Stable id: the URL segment and the Cloud Scheduler job suffix. Changing it is a new job. */
  name: string;
  description: string;
  defaultSchedule: JobSchedule;
  /** One HTTP request's worth of work; returns a small JSON object stored on the run record. */
  run: (ctx: JobContext) => Promise<Record<string, unknown> | void>;
}

export const JOB_NAME_PATTERN = /^[a-z][a-z0-9-]{2,40}$/;

/**
 * Declares a scheduled job. The file lives in src/jobs and is listed in src/jobs/index.ts; the schedule it ships
 * with is only a default, an administrator enables it and sets the real cron in the admin app (Schedules).
 */
export function defineJob(definition: JobDefinition): JobDefinition {
  if (!JOB_NAME_PATTERN.test(definition.name)) {
    throw new Error(`Job name "${definition.name}" must match ${JOB_NAME_PATTERN}`);
  }
  return definition;
}
