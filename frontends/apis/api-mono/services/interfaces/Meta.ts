export interface Meta {
  /**
   * The app's display name, for titles and copy
   */
  appName: string;
  features: Features;
}

export interface Features {
  /**
   * Outgoing email is configured and verified, so password reset and magic links work
   */
  email: boolean;
}
