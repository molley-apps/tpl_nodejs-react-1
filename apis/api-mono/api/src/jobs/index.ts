import { JobDefinition } from '@/jobs/defineJob';
import purgeExpiredSessions from '@/jobs/purgeExpiredSessions';

/**
 * Every scheduled job of this app. Add a file beside this one with defineJob and list it here; ScheduleService
 * reconciles the list with the scheduledJob collection at startup and the admin app shows one row per entry.
 */
export const jobs: JobDefinition[] = [purgeExpiredSessions];

export const jobByName = (name: string): JobDefinition | undefined => jobs.find((job) => job.name === name);
