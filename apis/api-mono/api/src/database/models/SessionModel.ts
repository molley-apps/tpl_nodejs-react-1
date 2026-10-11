import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose';

/**
 * Read view of the `sessions` collection, which Better Auth creates and owns
 * (see src/services/AuthService.ts). Nothing here is written by the app except
 * deletion; the shape mirrors Better Auth's session document.
 *
 * autoIndex is off on purpose: Better Auth manages this collection's indexes,
 * and a stray index declared here (a unique one above all) would break its
 * writes.
 */
@modelOptions({
  schemaOptions: {
    collection: 'sessions',
    timestamps: true,
    versionKey: false,
    autoIndex: false,
  },
})
export class SessionClass {
  @prop({ type: String })
  _id!: string;

  @prop({ required: true })
  userId!: string;

  /** The bearer/cookie token. Never returned by the API. */
  @prop({ required: true })
  token!: string;

  @prop({ required: true })
  expiresAt!: Date;

  @prop()
  ipAddress?: string;

  @prop()
  userAgent?: string;

  public createdAt!: Date;
  public updatedAt!: Date;
}

export const SessionModel = getModelForClass(SessionClass);
