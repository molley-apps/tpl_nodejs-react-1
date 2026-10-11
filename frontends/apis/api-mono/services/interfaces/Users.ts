export interface Users {
  data: Datum[];
  meta: Meta;
}

export interface Datum {
  _id: string;
  createdAt: Date;
  /**
   * Managed by the auth layer, change it via the auth change-email flow, not this API
   */
  email: string;
  emailVerified: boolean;
  /**
   * User's first name
   */
  firstName: string;
  /**
   * Avatar image URL
   */
  image?: string;
  /**
   * User's last name
   */
  lastName: string;
  /**
   * Display name shown in the UI, defaults to "firstName lastName" at sign up
   */
  name?: string;
  roles: string[];
  updatedAt: Date;
}

export interface Meta {
  limit?: number;
  offset?: number;
  totalResultCount?: number;
}
