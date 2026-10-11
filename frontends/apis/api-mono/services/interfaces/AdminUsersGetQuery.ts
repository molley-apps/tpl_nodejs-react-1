export interface AdminUsersGetQuery {
  /**
   * Max number of results returned
   */
  limit?: number;
  /**
   * The number of items to skip before starting to collect the result set
   */
  offset?: number;
  /**
   * Filter by role name
   */
  role?: string;
  /**
   * Search term
   */
  search?: string;
}
