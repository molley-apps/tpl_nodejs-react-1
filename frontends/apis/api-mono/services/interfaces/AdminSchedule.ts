export interface AdminSchedule {
  /**
   * Five-field cron expression, eg "15 3 * * *"
   */
  cron?: string;
  /**
   * The schedule the code suggests; Reset to default returns to it
   */
  defaultCron: string;
  defaultTimezone: string;
  description: string;
  /**
   * Creates a Cloud Scheduler job in this environment while true. Nothing runs while false.
   */
  enabled?: boolean;
  lastRun?: LastRun;
  name: string;
  nextRunAt?: Date;
  /**
   * The code no longer registers this job; kept for its history, cannot be enabled
   */
  orphaned: boolean;
  running: boolean;
  /**
   * Full Cloud Scheduler job name while enabled in a deployed environment
   */
  schedulerJobName?: string;
  /**
   * IANA timezone name the cron is read in, eg Europe/London
   */
  timezone?: string;
  updatedAt?: Date;
}

export interface LastRun {
  /**
   * scheduler, local-timer or admin:<userId>
   */
  by: string;
  durationMs: number;
  error?: string;
  finishedAt: Date;
  /**
   * What the handler returned, a small JSON object
   */
  result?: { [key: string]: any };
  startedAt: Date;
  status: Status;
}

export enum Status {
  Failed = 'failed',
  Success = 'success',
  TimedOut = 'timed-out',
}
