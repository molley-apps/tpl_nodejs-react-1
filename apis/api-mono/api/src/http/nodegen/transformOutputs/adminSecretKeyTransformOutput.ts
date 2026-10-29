export default {
  // adminSecretsSecretKeyDelete
  adminSecretsSecretKeyDelete: { success: Boolean },

  // adminSecretsSecretKeyPut
  adminSecretsSecretKeyPut: {
    description: String,
    key: String,
    valueLast4: String,
    updatedAt: String,
  },
};
