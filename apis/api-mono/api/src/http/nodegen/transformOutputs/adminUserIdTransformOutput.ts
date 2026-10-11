export default {
  // adminUsersUserIdDelete
  adminUsersUserIdDelete: { success: Boolean },

  // adminUsersUserIdRolesPut
  adminUsersUserIdRolesPut: {
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

  // adminUsersUserIdSessionsDelete
  adminUsersUserIdSessionsDelete: { success: Boolean },

  // adminUsersUserIdSessionsGet
  adminUsersUserIdSessionsGet: [
    {
      _id: String,
      userId: String,
      createdAt: String,
      updatedAt: String,
      expiresAt: String,
      ipAddress: String,
      userAgent: String,
    },
  ],
};
