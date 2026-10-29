import config from '@/config';
import AppSecretRepository from '@/database/AppSecretRepository';
import { AppSecretClass } from '@/database/models/AppSecretModel';
import { AdminSecret, AdminSecrets, AdminSecretsSecretKeyPutPut } from '@/http/nodegen/interfaces';
import { BadRequestException, ConflictException } from '@/http/nodegen/errors';
import { SECRET_NOT_CONFIGURED, secretNotConfiguredMessage } from '@/constants/SECRETS';
import { decryptSecret } from '@/utils/decryptSecret';
import { deriveSettingsKey } from '@/utils/deriveSettingsKey';
import { encryptSecret } from '@/utils/encryptSecret';

const KEY_INFO = 'app-secrets';

/** Values this short would be revealed by their last four characters, so nothing is shown for them. */
const MIN_LENGTH_FOR_LAST4 = 8;

/**
 * The app's secrets: API keys and tokens for outside services, saved by the administrator in the admin app
 * (App secrets) and read by the code with `get` or `require` at the moment they are used.
 *
 * Values are encrypted with a key derived from AUTH_SECRET and leave this service decrypted only through
 * `get`/`require`, never through the admin API, which sees the last four characters at most. Reading per use
 * (one indexed lookup) means a value changed in the admin app applies to the next request, no redeploy.
 */
class AppSecretsService {
  private key?: Buffer;

  async list(): Promise<AdminSecrets> {
    return (await AppSecretRepository.list()).map((secret) => this.toApi(secret));
  }

  async save(secretKey: string, input: AdminSecretsSecretKeyPutPut, actorId: string): Promise<AdminSecret> {
    const stored = await this.storedValue(secretKey, input.value?.trim());
    const saved = await AppSecretRepository.save({
      _id: secretKey,
      description: input.description?.trim() || undefined,
      ...stored,
      updatedBy: actorId,
    });
    if (!saved) {
      throw new Error(`The secret ${secretKey} was not saved`);
    }
    return this.toApi(saved);
  }

  /** A new value is encrypted; no value keeps what is stored, which must exist. */
  private async storedValue(
    secretKey: string,
    value: string | undefined,
  ): Promise<Pick<AppSecretClass, 'valueEncrypted' | 'valueLast4'>> {
    if (value) {
      return { valueEncrypted: encryptSecret(value, this.secretKey()), valueLast4: this.last4(value) };
    }
    const existing = await AppSecretRepository.fetch(secretKey);
    if (!existing) {
      throw new BadRequestException('A value is required when creating a secret');
    }
    return { valueEncrypted: existing.valueEncrypted, valueLast4: existing.valueLast4 };
  }

  async remove(secretKey: string): Promise<void> {
    await AppSecretRepository.remove(secretKey);
  }

  /** For the code: the decrypted value, or null while the administrator has not saved it. */
  async get(secretKey: string): Promise<string | null> {
    const secret = await AppSecretRepository.fetch(secretKey);
    return secret ? decryptSecret(secret.valueEncrypted, this.secretKey()) : null;
  }

  /** For the code: the decrypted value, or a 409 SECRET_NOT_CONFIGURED that names the missing key. */
  async require(secretKey: string): Promise<string> {
    const value = await this.get(secretKey);
    if (value === null) {
      throw new ConflictException({ code: SECRET_NOT_CONFIGURED, message: secretNotConfiguredMessage(secretKey) });
    }
    return value;
  }

  private last4(value: string): string {
    return value.length >= MIN_LENGTH_FOR_LAST4 ? value.slice(-4) : '';
  }

  /** Everything but the value. */
  private toApi(secret: AppSecretClass): AdminSecret {
    return {
      key: secret._id,
      description: secret.description,
      valueLast4: secret.valueLast4,
      updatedAt: secret.updatedAt,
    };
  }

  private secretKey(): Buffer {
    if (!this.key) {
      this.key = deriveSettingsKey(config.auth.secret, KEY_INFO);
    }
    return this.key;
  }
}

export default new AppSecretsService();
