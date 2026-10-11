import { Role } from 'apis/api-mono/services/interfaces/AdminUsersUserIdRolesPutPut';

/**
 * Which parts of the admin console each system role may use.
 * Mirrors SYSTEM_ROLES on the API (src/constants/ROLES.ts): SUPER_ADMIN sees
 * everything. Add a scoped role here with the console paths it may open when
 * the product needs one; the API enforces the same split, this only decides
 * what to show.
 */
export interface SystemRoleInfo {
  role: Role;
  label: string;
  description: string;
  /** Console paths the role may open; `'*'` for everything. */
  paths: '*' | string[];
}

export const SYSTEM_ROLE_INFO: SystemRoleInfo[] = [
  {
    role: Role.SuperAdmin,
    label: 'Super Admin',
    description: 'Full access to every user and all admin tooling.',
    paths: '*',
  },
];

const infoFor = (role: string) => SYSTEM_ROLE_INFO.find((info) => info.role === role);

export const roleLabel = (role: string): string => infoFor(role)?.label ?? role;

export const isSuperAdmin = (roles: string[] | undefined): boolean => (roles ?? []).includes(Role.SuperAdmin);

/** May a user with these roles open this console path? */
export const canAccessPath = (roles: string[] | undefined, path: string): boolean =>
  (roles ?? []).some((role) => {
    const info = infoFor(role);
    return !!info && (info.paths === '*' || info.paths.some((p) => path === p || path.startsWith(`${p}/`)));
  });

/** The first page a user with these roles may open - where `/` and any refused path redirect to. */
export const homePathFor = (roles: string[] | undefined): string => {
  if (isSuperAdmin(roles)) return '/';
  for (const role of roles ?? []) {
    const info = infoFor(role);
    if (info && info.paths !== '*' && info.paths.length > 0) return info.paths[0];
  }
  return '/';
};
