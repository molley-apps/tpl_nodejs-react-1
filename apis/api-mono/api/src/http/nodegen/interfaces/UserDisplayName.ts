export interface UserDisplayName {
  /**
   * User ID
   */
  _id: string;
  /**
   * User's display name (firstName + lastName or email fallback)
   */
  displayName: string;
}
