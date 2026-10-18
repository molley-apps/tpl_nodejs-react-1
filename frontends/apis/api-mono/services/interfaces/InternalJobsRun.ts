export interface InternalJobsRun {
  durationMs?: number;
  /**
   * True when the job was disabled, unknown or already running, so nothing ran
   */
  skipped: boolean;
  status?: Status;
}

export enum Status {
  Failed = 'failed',
  Success = 'success',
  TimedOut = 'timed-out',
}
