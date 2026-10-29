const mockRepo = { list: jest.fn(), fetch: jest.fn(), save: jest.fn(), remove: jest.fn() };

jest.mock('@/database/AppSecretRepository', () => ({ __esModule: true, default: mockRepo }));

import AppSecretsService from '@/services/AppSecretsService';
import { SECRET_NOT_CONFIGURED } from '@/constants/SECRETS';
import { BadRequestException, ConflictException } from '@/http/nodegen/errors';
import { decryptSecret } from '@/utils/decryptSecret';
import { deriveSettingsKey } from '@/utils/deriveSettingsKey';
import { encryptSecret } from '@/utils/encryptSecret';

const key = deriveSettingsKey(process.env.AUTH_SECRET as string, 'app-secrets');

const stored = (overrides: Record<string, unknown> = {}) => ({
  _id: 'ANTHROPIC_API_KEY',
  description: 'Summariser',
  valueEncrypted: encryptSecret('sk-ant-api03-secret-value', key),
  valueLast4: 'alue',
  updatedBy: 'admin-1',
  createdAt: new Date('2026-10-29T10:00:00Z'),
  updatedAt: new Date('2026-10-29T10:00:00Z'),
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockRepo.save.mockImplementation(async (doc) => ({ ...stored(), ...doc }));
});

describe('AppSecretsService.save', () => {
  it('encrypts the value under its name, keeps its last four characters and records who saved it', async () => {
    const result = await AppSecretsService.save('ANTHROPIC_API_KEY', { value: ' sk-ant-api03-secret-value ', description: ' Summariser ' }, 'admin-1');

    const saved = mockRepo.save.mock.calls[0][0];
    expect(saved._id).toBe('ANTHROPIC_API_KEY');
    expect(saved.valueEncrypted).not.toContain('sk-ant');
    expect(decryptSecret(saved.valueEncrypted, key)).toBe('sk-ant-api03-secret-value');
    expect(saved).toMatchObject({ valueLast4: 'alue', description: 'Summariser', updatedBy: 'admin-1' });
    expect(result).toEqual({ key: 'ANTHROPIC_API_KEY', description: 'Summariser', valueLast4: 'alue', updatedAt: expect.any(Date) });
    expect(JSON.stringify(result)).not.toContain('Encrypted');
    expect(mockRepo.fetch).not.toHaveBeenCalled();
  });

  it('keeps the stored value when only the description changes', async () => {
    mockRepo.fetch.mockResolvedValue(stored());

    await AppSecretsService.save('ANTHROPIC_API_KEY', { description: 'Used by the summariser' }, 'admin-2');

    const saved = mockRepo.save.mock.calls[0][0];
    expect(decryptSecret(saved.valueEncrypted, key)).toBe('sk-ant-api03-secret-value');
    expect(saved).toMatchObject({ valueLast4: 'alue', description: 'Used by the summariser', updatedBy: 'admin-2' });
  });

  it('refuses to create a secret without a value', async () => {
    mockRepo.fetch.mockResolvedValue(null);

    await expect(AppSecretsService.save('STRIPE_KEY', { value: '  ' }, 'admin-1')).rejects.toBeInstanceOf(BadRequestException);
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('shows no last-four for a value short enough to be revealed by it', async () => {
    await AppSecretsService.save('PIN', { value: '1234567' }, 'admin-1');

    expect(mockRepo.save.mock.calls[0][0].valueLast4).toBe('');
  });
});

describe('AppSecretsService.list', () => {
  it('returns every secret without its value', async () => {
    mockRepo.list.mockResolvedValue([stored(), stored({ _id: 'MAPS_KEY', description: undefined, valueLast4: 'z9q1' })]);

    const result = await AppSecretsService.list();

    expect(result).toEqual([
      { key: 'ANTHROPIC_API_KEY', description: 'Summariser', valueLast4: 'alue', updatedAt: expect.any(Date) },
      { key: 'MAPS_KEY', description: undefined, valueLast4: 'z9q1', updatedAt: expect.any(Date) },
    ]);
    expect(JSON.stringify(result)).not.toContain('Encrypted');
  });
});

describe('AppSecretsService.get and require (for the code)', () => {
  it('decrypts the stored value', async () => {
    mockRepo.fetch.mockResolvedValue(stored());

    expect(await AppSecretsService.get('ANTHROPIC_API_KEY')).toBe('sk-ant-api03-secret-value');
    expect(await AppSecretsService.require('ANTHROPIC_API_KEY')).toBe('sk-ant-api03-secret-value');
    expect(mockRepo.fetch).toHaveBeenCalledWith('ANTHROPIC_API_KEY');
  });

  it('is null while the administrator has not saved it, and require answers 409 naming the key', async () => {
    mockRepo.fetch.mockResolvedValue(null);

    expect(await AppSecretsService.get('ANTHROPIC_API_KEY')).toBeNull();
    const error = await AppSecretsService.require('ANTHROPIC_API_KEY').catch((e) => e);
    expect(error).toBeInstanceOf(ConflictException);
    expect(JSON.stringify(error)).toContain(SECRET_NOT_CONFIGURED);
    expect(JSON.stringify(error)).toContain('ANTHROPIC_API_KEY');
  });
});

describe('AppSecretsService.remove', () => {
  it('deletes by name', async () => {
    await AppSecretsService.remove('MAPS_KEY');
    expect(mockRepo.remove).toHaveBeenCalledWith('MAPS_KEY');
  });
});
