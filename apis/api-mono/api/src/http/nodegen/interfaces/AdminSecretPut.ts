export interface AdminSecretPut {
  /**
   * What the secret is for, eg "Anthropic API key used by the summariser"
   */
  description?: string;
  /**
   * The secret itself. Required when creating; omit later to keep the stored value and change
   * only the description.
   */
  value?: string;
}
