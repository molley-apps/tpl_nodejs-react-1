export interface UserPut {
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
}
