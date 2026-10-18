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
  result?: { [key: string]: any };
  startedAt: Date;
  status: Status;
}

export enum Status {
  Failed = 'failed',
  Success = 'success',
  TimedOut = 'timed-out',
}
