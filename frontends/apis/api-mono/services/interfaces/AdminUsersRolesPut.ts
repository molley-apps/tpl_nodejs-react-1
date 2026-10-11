export interface AdminUsersRolesPut {
  /**
   * The system roles the user should hold. Empty makes them a standard user.
   */
  roles: Role[];
}

export enum Role {
  SuperAdmin = 'SUPER_ADMIN',
}
