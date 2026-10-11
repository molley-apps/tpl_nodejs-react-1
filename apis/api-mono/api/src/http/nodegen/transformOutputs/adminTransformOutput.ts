export default {
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
