import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose';

/**
 * The `appSettings` collection holds one document per settings area, keyed by a fixed string id, so areas
 * added later (schedules, realtime) follow the same pattern without sharing one blob. This is the `email` area:
 * the outgoing email provider the app's administrator configured in the admin app.
 *
 * The provider secret is stored encrypted (see EmailSettingsService) and is never returned by the API.
 */
export const EMAIL_SETTINGS_ID = 'email';

@modelOptions({
  schemaOptions: {
    collection: 'appSettings',
    timestamps: true,
    versionKey: false,
  },
})
export class EmailSettingsClass {
  @prop({ type: String, default: EMAIL_SETTINGS_ID })
  _id!: string;

  /** resend | brevo | sendgrid | mailgun | smtp, see the spec enum */
  @prop({ required: true })
  provider!: string;

  @prop({ required: true })
  host!: string;

  @prop({ required: true })
  port!: number;

  /** Implicit TLS (465). Otherwise STARTTLS is required. */
  @prop({ required: true })
  secure!: boolean;

  @prop({ required: true })
  username!: string;

  /** AES-256-GCM, key derived from AUTH_SECRET (utils/deriveSettingsKey) */
  @prop({ required: true })
  passwordEncrypted!: string;

  @prop({ required: true })
  passwordLast4!: string;

  @prop({ required: true })
  fromAddress!: string;

  @prop({ required: true })
  fromName!: string;

  @prop()
  replyTo?: string;

  /** Set by a successful test send; only verified settings are used for real sends */
  @prop()
  verifiedAt?: Date;

  @prop()
  lastSendAt?: Date;

  /** The provider's last failure, cleared by the next successful send */
  @prop()
  lastError?: string;

  @prop({ required: true })
  updatedBy!: string;

  public createdAt!: Date;
  public updatedAt!: Date;
}

export const EmailSettingsModel = getModelForClass(EmailSettingsClass);
