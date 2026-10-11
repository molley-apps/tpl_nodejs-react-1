/**
 * A Better Auth session document, as stored in the sessions collection. The token is never
 * returned.
 */
export interface AdminSession {
  _id: string;
  createdAt: Date;
  expiresAt: Date;
  ipAddress?: string;
  updatedAt: Date;
  userAgent?: string;
  userId: string;
}
