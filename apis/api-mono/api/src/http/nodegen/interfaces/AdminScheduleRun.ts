export interface AdminScheduleRun {
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
  result?: Result;
  startedAt: Date;
  status: Status;
}

/**
 * What the handler returned, a small JSON object
 */
export interface Result {}

export enum Status {
  Failed = 'failed',
  Success = 'success',
  TimedOut = 'timed-out',
}
