export default {
  // adminSettingsEmailDelete
  adminSettingsEmailDelete: { success: Boolean },

  // adminSettingsEmailGet
  adminSettingsEmailGet: {
    provider: String,
    host: String,
    port: Number,
    secure: Boolean,
    username: String,
    fromAddress: String,
    fromName: String,
    replyTo: String,
    configured: Boolean,
    verified: Boolean,
    passwordLast4: String,
    verifiedAt: String,
    lastSendAt: String,
    lastError: String,
    updatedAt: String,
  },

  // adminSettingsEmailPut
  adminSettingsEmailPut: {
    provider: String,
    host: String,
    port: Number,
    secure: Boolean,
    username: String,
    fromAddress: String,
    fromName: String,
    replyTo: String,
    configured: Boolean,
    verified: Boolean,
    passwordLast4: String,
    verifiedAt: String,
    lastSendAt: String,
    lastError: String,
    updatedAt: String,
  },

  // adminSettingsEmailTestPost
  adminSettingsEmailTestPost: { success: Boolean, providerResponse: String },
};
