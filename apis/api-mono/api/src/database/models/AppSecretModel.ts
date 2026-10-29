import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose';

/**
 * The `appSecrets` collection: one document per secret the app's administrator saved in the admin app
 * (App secrets), keyed by its name. These are the API keys and tokens for the outside services the app
 * integrates with; the code reads them through AppSecretsService, never from the environment.
 *
 * The value is stored encrypted (AES-256-GCM, key derived from AUTH_SECRET) and is never returned by the API.
 */
@modelOptions({
  schemaOptions: {
    collection: 'appSecrets',
    timestamps: true,
    versionKey: false,
  },
})
export class AppSecretClass {
  /** The secret's name, upper case with underscores, eg ANTHROPIC_API_KEY (validated by the spec) */
  @prop({ type: String })
  _id!: string;

  @prop()
  description?: string;

  /** "iv.tag.ciphertext" from utils/encryptSecret */
  @prop({ required: true })
  valueEncrypted!: string;

  /** Shown in the admin app so the administrator can tell which value is stored; empty for short values */
  @prop({ required: true })
  valueLast4!: string;

  @prop({ required: true })
  updatedBy!: string;

  public createdAt!: Date;
  public updatedAt!: Date;
}

export const AppSecretModel = getModelForClass(AppSecretClass);
