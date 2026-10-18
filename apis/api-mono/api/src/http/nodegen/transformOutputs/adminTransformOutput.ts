export default {
  // adminSchedulesGet
  adminSchedulesGet: [
    {
      cron: String,
      timezone: String,
      enabled: Boolean,
      name: String,
      description: String,
      defaultCron: String,
      defaultTimezone: String,
      orphaned: Boolean,
      running: Boolean,
      schedulerJobName: String,
      lastRun: {
        startedAt: String,
        finishedAt: String,
        status: String,
        durationMs: Number,
        by: String,
        error: String,
        result: Object,
      },
      nextRunAt: String,
      updatedAt: String,
    },
  ],

  // adminUsersGet
  adminUsersGet: {
    meta: { totalResultCount: Number, offset: Number, limit: Number },
    data: [
      {
        firstName: String,
        lastName: String,
        name: String,
        image: String,
        _id: String,
        email: String,
        emailVerified: Boolean,
        roles: [String],
        createdAt: String,
        updatedAt: String,
      },
    ],
  },
};
