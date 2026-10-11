export interface User {
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
