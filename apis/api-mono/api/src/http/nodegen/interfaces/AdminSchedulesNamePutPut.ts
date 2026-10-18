export interface AdminSchedulesNamePutPut {
  /**
   * Five-field cron expression, eg "15 3 * * *"
   */
  cron: string;
  /**
   * Creates a Cloud Scheduler job in this environment while true. Nothing runs while false.
   */
  enabled: boolean;
  /**
   * IANA timezone name the cron is read in, eg Europe/London
   */
  timezone: string;
}
