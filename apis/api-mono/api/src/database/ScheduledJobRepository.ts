import { ScheduledJobModel, ScheduledJobClass, ScheduledJobRun } from '@/database/models/ScheduledJobModel';
import { BaseRepository } from '@/database/BaseRepository';

/**
 * The scheduledJob collection, see ScheduledJobModel. The claim methods are the only concurrency control a job has:
 * findOneAndUpdate is atomic, so exactly one caller gets the document back.
 */
class ScheduledJobRepository extends BaseRepository<ScheduledJobClass> {
  constructor() {
    super(ScheduledJobModel);
  }

  findAll() {
    return this.model.find().sort({ _id: 1 }).lean();
  }

  findByName(name: string) {
    return this.model.findById(name).lean();
  }

  /** Enabled jobs whose next run is due; the local-development timer's query. */
  findDue(now: Date) {
    return this.model.find({ enabled: true, orphaned: false, nextRunAt: { $lte: now } }).lean();
  }

  /** Startup: the code's description and defaults are refreshed, the administrator's fields only set on insert. */
  upsertFromCode(job: { name: string; description: string; defaultCron: string; defaultTimezone: string }) {
    return this.model
      .findByIdAndUpdate(
        job.name,
        {
          $set: {
            description: job.description,
            defaultCron: job.defaultCron,
            defaultTimezone: job.defaultTimezone,
            orphaned: false,
          },
          $setOnInsert: { cron: job.defaultCron, timezone: job.defaultTimezone, enabled: false, updatedBy: 'system' },
        },
        { upsert: true, returnDocument: 'after' },
      )
      .lean();
  }

  /** Records whose job is no longer in the code: kept for history, switched off. Returns them for Scheduler cleanup. */
  async markOrphaned(registeredNames: string[]) {
    const orphans = await this.model.find({ _id: { $nin: registeredNames }, orphaned: false }).lean();
    if (orphans.length > 0) {
      await this.model.updateMany(
        { _id: { $in: orphans.map((orphan) => orphan._id) } },
        { $set: { orphaned: true, enabled: false }, $unset: { schedulerJobName: 1, nextRunAt: 1 } },
      );
    }
    return orphans;
  }

  updateSchedule(params: {
    name: string;
    cron: string;
    timezone: string;
    enabled: boolean;
    nextRunAt?: Date;
    schedulerJobName?: string;
    updatedBy: string;
  }) {
    const { name, nextRunAt, schedulerJobName, ...fields } = params;
    const $set: Record<string, unknown> = { ...fields };
    const $unset: Record<string, 1> = {};
    if (nextRunAt) {
      $set.nextRunAt = nextRunAt;
    } else {
      $unset.nextRunAt = 1;
    }
    if (schedulerJobName) {
      $set.schedulerJobName = schedulerJobName;
    } else {
      $unset.schedulerJobName = 1;
    }
    return this.model
      .findByIdAndUpdate(name, Object.keys($unset).length ? { $set, $unset } : { $set }, { returnDocument: 'after' })
      .lean();
  }

  /**
   * Takes the run claim. Null when the job is unknown, disabled (unless `allowDisabled`), or another execution
   * holds a claim younger than `staleBefore`.
   */
  claim(params: { name: string; by: string; now: Date; staleBefore: Date; allowDisabled: boolean }) {
    return this.model
      .findOneAndUpdate(
        {
          _id: params.name,
          orphaned: false,
          ...(params.allowDisabled ? {} : { enabled: true }),
          $or: [{ running: { $exists: false } }, { 'running.startedAt': { $lt: params.staleBefore } }],
        },
        { $set: { running: { startedAt: params.now, by: params.by } } },
        { returnDocument: 'after' },
      )
      .lean();
  }

  /** Releases the claim and records the outcome. */
  finishRun(params: { name: string; lastRun: ScheduledJobRun; nextRunAt?: Date }) {
    return this.model
      .findByIdAndUpdate(
        params.name,
        {
          $set: { lastRun: params.lastRun, ...(params.nextRunAt ? { nextRunAt: params.nextRunAt } : {}) },
          $unset: { running: 1, ...(params.nextRunAt ? {} : { nextRunAt: 1 }) },
        },
        { returnDocument: 'after' },
      )
      .lean();
  }
}

export default new ScheduledJobRepository();
