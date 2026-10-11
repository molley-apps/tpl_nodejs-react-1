/**
 * System roles live on `User.roles` (see UserModel / AuthService additionalFields).
 * They are assigned by the application, never by the user on sign up.
 *
 * SUPER_ADMIN bypasses every permission check and may load the admin app.
 * Add further system roles here as the product needs them; each one is a
 * named bundle the admin app can gate its pages on.
 */
export const SYSTEM_SUPER_ADMIN = 'SUPER_ADMIN';

export interface SystemRoleDefinition {
  name: string;
  label: string;
  description: string;
}

export const SYSTEM_ROLES: Record<string, SystemRoleDefinition> = {
  [SYSTEM_SUPER_ADMIN]: {
    name: SYSTEM_SUPER_ADMIN,
    label: 'Super Admin',
    description: 'Full access to every user and all admin tooling.',
  },
};

export const SYSTEM_ROLE_NAMES = Object.keys(SYSTEM_ROLES);

export const isSystemRole = (role: string): boolean => role in SYSTEM_ROLES;

/** True when the user carries at least one system role (any staff member). */
export const hasAnySystemRole = (roles: string[] | undefined): boolean =>
  (roles ?? []).some((role) => isSystemRole(role));

export const isSuperAdmin = (roles: string[] | undefined): boolean => (roles ?? []).includes(SYSTEM_SUPER_ADMIN);
