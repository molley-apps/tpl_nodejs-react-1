import os from 'os';
import { randomUUID } from 'crypto';
import config from '@/config';
import ScheduledJobRepository from '@/database/ScheduledJobRepository';
import { ScheduledJobClass, ScheduledJobRun } from '@/database/models/ScheduledJobModel';
import { AdminSchedule, AdminSchedulesNamePutPut, InternalJobsRun } from '@/http/nodegen/interfaces';
import { BadRequestException, NotFoundException } from '@/http/nodegen/errors';
import { JobDefinition } from '@/jobs/defineJob';
import { jobByName, jobs } from '@/jobs';
import CloudSchedulerService from '@/services/CloudSchedulerService';
import { nextCronRun } from '@/utils/nextCronRun';
import { verifySchedulerOidc } from '@/utils/verifySchedulerOidc';

/** Identifies this process in a run claim, so a stuck claim can be traced to an instance. */
const INSTANCE_ID = `${process.env.K_REVISION || os.hostname()}:${randomUUID().slice(0, 8)}`;
/** A job gets this much less than the request timeout, so the outcome is still recorded inside the request. */
const DEADLINE_MARGIN_MS = 10_000;
const LOCAL_TIMER_MS = 30_000;

/**
 * Scheduled jobs: the code registers them (src/jobs), the administrator schedules them (admin app → Schedules),
 * Cloud Scheduler calls them (one job per enabled schedule, see CloudSchedulerService). Locally a 30 s timer runs
 * the due ones through the same executor.
 *
 * Exactly-once per due time rests on the claim in ScheduledJobRepository: a Scheduler retry or a second instance
 * finds the claim and is skipped. A claim older than the request timeout is stale and may be taken over.
 */
class ScheduleService {
  private localTimer?: NodeJS.Timeout;

  /** Once per process start: records for the code's jobs, orphans for jobs that went, Scheduler jobs for enabled ones. */
  async reconcile(): Promise<void> {
    for (const job of jobs) {
      await ScheduledJobRepository.upsertFromCode({
        name: job.name,
        description: job.description,
        defaultCron: job.defaultSchedule.cron,
        defaultTimezone: job.defaultSchedule.timezone,
      });
    }
    const orphans = await ScheduledJobRepository.markOrphaned(jobs.map((job) => job.name));
    for (const orphan of orphans) {
      console.warn(`ScheduleService: job ${orphan._id} is no longer in the code; disabled`);
      await CloudSchedulerService.remove(orphan._id).catch((e) => console.error(e));
    }
    const enabled = (await ScheduledJobRepository.findAll()).filter((record) => record.enabled && !record.orphaned);
    for (const record of enabled) {
      await this.apply(record, record.updatedBy);
    }
    console.log(
      `Scheduled jobs: ${jobs.length} registered, ${enabled.length} enabled, Cloud Scheduler ${CloudSchedulerService.enabled ? 'on' : 'off'}`,
    );
  }

  /** Local development only: there is no Cloud Scheduler, so due jobs are run from here. */
  startLocalTimer(): void {
    if (this.localTimer) {
      return;
    }
    this.localTimer = setInterval(() => {
      this.runDue().catch((e) => console.error('ScheduleService: local timer failed', e));
    }, LOCAL_TIMER_MS);
    this.localTimer.unref();
  }

  async runDue(now: Date = new Date()): Promise<void> {
    for (const record of await ScheduledJobRepository.findDue(now)) {
      await this.execute(record._id, 'local-timer', false);
    }
  }

  async list(): Promise<AdminSchedule[]> {
    return (await ScheduledJobRepository.findAll()).map((record) => this.toApi(record));
  }

  async update(name: string, input: AdminSchedulesNamePutPut, userId: string): Promise<AdminSchedule> {
    const record = await this.requireRecord(name);
    if (record.orphaned) {
      throw new BadRequestException(`Job ${name} is no longer in the code and cannot be scheduled`);
    }
    const cron = input.cron.trim();
    const timezone = input.timezone.trim();
    this.validate(cron, timezone);
    return this.apply({ ...record, cron, timezone, enabled: input.enabled }, userId);
  }

  /** Runs the job in this request, enabled or not, and returns the record with the outcome. */
  async runNow(name: string, userId: string): Promise<AdminSchedule> {
    await this.requireRecord(name);
    await this.execute(name, `admin:${userId}`, true);
    return this.toApi(await this.requireRecord(name));
  }

  /** The Cloud Scheduler entry point: verify the caller, then run once. */
  async runFromScheduler(name: string, authorization: string | undefined): Promise<InternalJobsRun> {
    await verifySchedulerOidc(authorization, {
      audience: config.appDetails.domain,
      invokerEmail: config.scheduler.invokerEmail,
    });
    const run = await this.execute(name, 'scheduler', false);
    return run
      ? { skipped: false, status: run.status as InternalJobsRun['status'], durationMs: run.durationMs }
      : { skipped: true };
  }

  /** Writes the schedule and brings the Cloud Scheduler job in line with it. */
  private async apply(
    record: Pick<ScheduledJobClass, '_id' | 'cron' | 'timezone' | 'enabled' | 'schedulerJobName'>,
    updatedBy: string,
  ): Promise<AdminSchedule> {
    const name = record._id;
    let schedulerJobName: string | undefined;
    let nextRunAt: Date | undefined;
    if (record.enabled) {
      schedulerJobName = await CloudSchedulerService.upsert({ name, cron: record.cron, timezone: record.timezone });
      nextRunAt = nextCronRun(record.cron, record.timezone);
    } else if (record.schedulerJobName) {
      await CloudSchedulerService.remove(name);
    }
    const saved = await ScheduledJobRepository.updateSchedule({
      name,
      cron: record.cron,
      timezone: record.timezone,
      enabled: record.enabled,
      nextRunAt,
      schedulerJobName,
      updatedBy,
    });
    if (!saved) {
      throw new NotFoundException(`Job ${name} not found`);
    }
    return this.toApi(saved);
  }

  private validate(cron: string, timezone: string): void {
    try {
      nextCronRun(cron, timezone);
    } catch (e) {
      throw new BadRequestException(`Invalid schedule: ${(e as Error).message}`);
    }
  }

  /**
   * Claims the record, runs the handler against a deadline, records the outcome and releases the claim.
   * Null when nothing ran: unknown job, disabled (unless allowed), or another execution holds the claim.
   */
  private async execute(name: string, by: string, allowDisabled: boolean): Promise<ScheduledJobRun | null> {
    const job = jobByName(name);
    if (!job) {
      return null;
    }
    const now = new Date();
    const claimed = await ScheduledJobRepository.claim({
      name,
      by: INSTANCE_ID,
      now,
      staleBefore: new Date(now.getTime() - config.scheduler.requestTimeoutMs),
      allowDisabled,
    });
    if (!claimed) {
      console.log(`[job ${name}] skipped: disabled or already running`);
      return null;
    }
    const run = await this.runHandler(job, now, by);
    await ScheduledJobRepository.finishRun({
      name,
      lastRun: run,
      nextRunAt: claimed.enabled ? this.safeNextRun(claimed.cron, claimed.timezone, run.finishedAt) : undefined,
    });
    console.log(`[job ${name}] ${run.status} in ${run.durationMs} ms${run.error ? `: ${run.error}` : ''}`);
    return run;
  }

  private async runHandler(job: JobDefinition, startedAt: Date, by: string): Promise<ScheduledJobRun> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.scheduler.requestTimeoutMs - DEADLINE_MARGIN_MS);
    const timedOut = new Promise<never>((_, reject) => {
      controller.signal.addEventListener('abort', () => reject(new Error('Job exceeded the request deadline')));
    });
    const ctx = {
      log: (message: string) => console.log(`[job ${job.name}] ${message}`),
      signal: controller.signal,
      startedAt,
    };
    const outcome: Partial<ScheduledJobRun> = {};
    try {
      const result = await Promise.race([job.run(ctx), timedOut]);
      outcome.status = 'success';
      outcome.result = result || undefined;
    } catch (e) {
      outcome.status = controller.signal.aborted ? 'timed-out' : 'failed';
      outcome.error = ((e as Error)?.message || String(e)).slice(0, 1000);
    } finally {
      clearTimeout(timer);
    }
    const finishedAt = new Date();
    return {
      ...outcome,
      startedAt,
      finishedAt,
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      by,
    } as ScheduledJobRun;
  }

  private safeNextRun(cron: string, timezone: string, from: Date): Date | undefined {
    try {
      return nextCronRun(cron, timezone, from);
    } catch {
      return undefined;
    }
  }

  private async requireRecord(name: string): Promise<ScheduledJobClass> {
    const record = await ScheduledJobRepository.findByName(name);
    if (!record) {
      throw new NotFoundException(`Job ${name} not found`);
    }
    return record;
  }

  private toApi(record: ScheduledJobClass): AdminSchedule {
    return {
      name: record._id,
      description: record.description,
      defaultCron: record.defaultCron,
      defaultTimezone: record.defaultTimezone,
      cron: record.cron,
      timezone: record.timezone,
      enabled: record.enabled,
      orphaned: record.orphaned,
      running: !!record.running,
      schedulerJobName: record.schedulerJobName,
      lastRun: record.lastRun as AdminSchedule['lastRun'],
      nextRunAt: record.nextRunAt,
      updatedAt: record.updatedAt,
    };
  }
}

export default new ScheduleService();
