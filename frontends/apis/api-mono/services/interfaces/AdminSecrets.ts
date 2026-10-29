export type AdminSecrets = AdminSecret[];

export interface AdminSecret {
  /**
   * What the secret is for, eg "Anthropic API key used by the summariser"
   */
  description?: string;
  /**
   * The secret's name, as the code reads it with AppSecretsService.get
   */
  key: string;
  updatedAt: Date;
  /**
   * The only part of the value ever returned; empty for a short value
   */
  valueLast4: string;
}
