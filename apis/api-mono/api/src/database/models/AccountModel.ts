import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose';

/**
 * Read view of the `accounts` collection, which Better Auth creates and owns:
 * one document per credential or social provider linked to a user (the
 * password hash lives here). The app only ever deletes these, when a user is
 * removed. autoIndex is off for the same reason as SessionModel.
 */
@modelOptions({
  schemaOptions: {
    collection: 'accounts',
    timestamps: true,
    versionKey: false,
    autoIndex: false,
  },
})
export class AccountClass {
  @prop({ type: String })
  _id!: string;

  @prop({ required: true })
  userId!: string;

  @prop({ required: true })
  providerId!: string;

  @prop({ required: true })
  accountId!: string;
}

export const AccountModel = getModelForClass(AccountClass);
