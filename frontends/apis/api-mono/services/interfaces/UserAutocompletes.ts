export type UserAutocompletes = UserAutocomplete[];

export interface UserAutocomplete {
  /**
   * User ID
   */
  _id: string;
  /**
   * Full display name
   */
  displayName?: string;
  /**
   * User's email address
   */
  email: string;
  /**
   * User's first name
   */
  firstName?: string;
  /**
   * User's last name
   */
  lastName?: string;
}
