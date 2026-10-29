/**
 * The 409 a feature answers while the administrator has not saved a secret it needs (App secrets in the admin
 * app). The message names the key so the administrator knows exactly what to add.
 */
export const SECRET_NOT_CONFIGURED = 'SECRET_NOT_CONFIGURED';
export const secretNotConfiguredMessage = (key: string): string =>
  `This feature needs the ${key} secret, which the administrator has not added yet (admin app → App secrets).`;
