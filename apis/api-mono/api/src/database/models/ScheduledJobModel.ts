import { getModelForClass, modelOptions, prop, Severity } from '@typegoose/typegoose';

export const scheduledJobRunStatuses = ['success', 'failed', 'timed-out'] as const;
export type ScheduledJobRunStatus = (typeof scheduledJobRunStatuses)[number];

/** Summary of the most recent run; `result` is whatever small object the handler returned. */
export class ScheduledJobRun {
  @prop({ required: true })
  startedAt!: Date;

  @prop({ required: true })
  finishedAt!: Date;

  @prop({ type: String, enum: scheduledJobRunStatuses, required: true })
  status!: ScheduledJobRunStatus;

  @prop({ required: true })
  durationMs!: number;

  /** scheduler, local-timer or admin:<userId> */
  @prop({ required: true })
  by!: string;

  @prop()
  error?: string;

  @prop({ allowMixed: Severity.ALLOW })
  result?: Record<string, unknown>;
}

/** The claim a running execution holds, so a retry or a second instance skips the job (see ScheduleService). */
export class ScheduledJobClaim {
  @prop({ required: true })
  startedAt!: Date;

  @prop({ required: true })
  by!: string;
}

/**
 * One document per job registered in src/jobs, `_id` = job name. The code owns description and defaults
 * (refreshed at every startup); the administrator owns cron, timezone and enabled, which startup never overwrites.
 */
@modelOptions({
  schemaOptions: {
    collection: 'scheduledJob',
    timestamps: true,
    versionKey: false,
  },
  options: { allowMixed: Severity.ALLOW },
})
export class ScheduledJobClass {
  @prop({ type: String })
  _id!: string;

  @prop({ required: true })
  description!: string;

  @prop({ required: true })
  defaultCron!: string;

  @prop({ required: true })
  defaultTimezone!: string;

  @prop({ required: true })
  cron!: string;

  @prop({ required: true })
  timezone!: string;

  @prop({ required: true, default: false })
  enabled!: boolean;

  /** The code no longer registers this job; kept for its history, cannot be enabled. */
  @prop({ required: true, default: false })
  orphaned!: boolean;

  /** Full Cloud Scheduler job name while enabled in a deployed environment */
  @prop()
  schedulerJobName?: string;

  @prop({ type: () => ScheduledJobRun, _id: false })
  lastRun?: ScheduledJobRun;

  @prop()
  nextRunAt?: Date;

  @prop({ type: () => ScheduledJobClaim, _id: false })
  running?: ScheduledJobClaim;

  @prop({ required: true })
  updatedBy!: string;

  public createdAt!: Date;
  public updatedAt!: Date;
}

export const ScheduledJobModel = getModelForClass(ScheduledJobClass);
