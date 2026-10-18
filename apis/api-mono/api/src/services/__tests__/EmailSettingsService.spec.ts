const mockRepo = {
  fetch: jest.fn(),
  save: jest.fn(),
  markVerified: jest.fn(),
  recordSendSuccess: jest.fn(),
  recordSendFailure: jest.fn(),
  remove: jest.fn(),
};
const mockTransport = { deliver: jest.fn() };

jest.mock('@/database/EmailSettingsRepository', () => ({ __esModule: true, default: mockRepo }));
jest.mock('@/services/EmailTransportService', () => ({ __esModule: true, default: mockTransport }));

import EmailSettingsService from '@/services/EmailSettingsService';
import { BadRequestException } from '@/http/nodegen/errors';
import { Provider } from '@/http/nodegen/interfaces/AdminSettingsEmailPutPut';
import { decryptSecret } from '@/utils/decryptSecret';
import { deriveSettingsKey } from '@/utils/deriveSettingsKey';

const key = deriveSettingsKey(process.env.AUTH_SECRET as string, 'email-settings');

const input = {
  provider: Provider.Resend,
  host: ' smtp.resend.com ',
  port: 465,
  username: 'resend',
  password: 're_live_abcdef',
  fromAddress: 'hello@acme.com',
};

const stored = (overrides: Record<string, unknown> = {}) => ({
  _id: 'email',
  provider: 'resend',
  host: 'smtp.resend.com',
  port: 465,
  secure: true,
  username: 'resend',
  passwordEncrypted: 'enc',
  passwordLast4: 'cdef',
  fromAddress: 'hello@acme.com',
  fromName: 'Acme',
  updatedBy: 'admin-1',
  createdAt: new Date('2026-10-18T10:00:00Z'),
  updatedAt: new Date('2026-10-18T10:00:00Z'),
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockRepo.save.mockImplementation(async (doc) => stored(doc));
});

describe('EmailSettingsService.save', () => {
  it('encrypts the password, keeps its last four characters and derives secure from the port', async () => {
    mockRepo.fetch.mockResolvedValue(null);

    const result = await EmailSettingsService.save(input, 'admin-1');

    const saved = mockRepo.save.mock.calls[0][0];
    expect(saved.passwordEncrypted).not.toContain('re_live');
    expect(decryptSecret(saved.passwordEncrypted, key)).toBe('re_live_abcdef');
    expect(saved).toMatchObject({ host: 'smtp.resend.com', secure: true, passwordLast4: 'cdef', updatedBy: 'admin-1' });
    expect(saved.fromName).toBe('App Template');
    expect(result).toMatchObject({ configured: true, verified: false, passwordLast4: 'cdef' });
    expect(JSON.stringify(result)).not.toContain('enc');
  });

  it('keeps the stored secret when the password is omitted, and honours an explicit secure flag', async () => {
    mockRepo.fetch.mockResolvedValue(stored());

    await EmailSettingsService.save({ ...input, password: undefined, port: 587, secure: false }, 'admin-2');

    expect(mockRepo.save.mock.calls[0][0]).toMatchObject({ passwordEncrypted: 'enc', passwordLast4: 'cdef', secure: false });
  });

  it('refuses a first save without a password', async () => {
    mockRepo.fetch.mockResolvedValue(null);

    await expect(EmailSettingsService.save({ ...input, password: '  ' }, 'admin-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(mockRepo.save).not.toHaveBeenCalled();
  });
});

describe('EmailSettingsService.get', () => {
  it('reports not configured while nothing is saved', async () => {
    mockRepo.fetch.mockResolvedValue(null);
    expect(await EmailSettingsService.get()).toEqual({ configured: false, verified: false });
  });

  it('never returns the encrypted secret', async () => {
    mockRepo.fetch.mockResolvedValue(stored({ verifiedAt: new Date('2026-10-18T11:00:00Z'), lastError: '535 bad' }));

    const result = await EmailSettingsService.get();

    expect(result).toMatchObject({ configured: true, verified: true, lastError: '535 bad', passwordLast4: 'cdef' });
    expect(result).not.toHaveProperty('passwordEncrypted');
  });
});

describe('EmailSettingsService.test', () => {
  const encrypted = () => {
    // a real payload so decryption inside toTransport works
    const { encryptSecret } = jest.requireActual('@/utils/encryptSecret');
    return encryptSecret('re_live_abcdef', key);
  };

  it('needs saved settings', async () => {
    mockRepo.fetch.mockResolvedValue(null);
    await expect(EmailSettingsService.test({ email: 'a@acme.com' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('marks the settings verified when the provider accepts the test', async () => {
    mockRepo.fetch.mockResolvedValue(stored({ passwordEncrypted: encrypted() }));
    mockTransport.deliver.mockResolvedValue({ ok: true, response: '250 OK' });

    const result = await EmailSettingsService.test({ email: 'a@acme.com', name: 'Ada' });

    expect(result).toEqual({ success: true, providerResponse: '250 OK' });
    const [transport, message] = mockTransport.deliver.mock.calls[0];
    expect(transport).toMatchObject({ host: 'smtp.resend.com', password: 're_live_abcdef', fromAddress: 'hello@acme.com' });
    expect(message).toMatchObject({ to: { email: 'a@acme.com', name: 'Ada' }, tplRelativePath: 'system/emailTest' });
    expect(message.tplObject).toMatchObject({ name: 'Ada', providerLabel: 'Resend' });
    expect(mockRepo.markVerified).toHaveBeenCalledTimes(1);
  });

  it('records the provider response verbatim on failure and stays unverified', async () => {
    mockRepo.fetch.mockResolvedValue(stored({ passwordEncrypted: encrypted() }));
    mockTransport.deliver.mockResolvedValue({ ok: false, error: '535 Authentication failed' });

    const result = await EmailSettingsService.test({ email: 'a@acme.com' });

    expect(result).toEqual({ success: false, providerResponse: '535 Authentication failed' });
    expect(mockRepo.recordSendFailure).toHaveBeenCalledWith('535 Authentication failed');
    expect(mockRepo.markVerified).not.toHaveBeenCalled();
  });
});

describe('EmailSettingsService.verifiedTransport', () => {
  it('is null until a test has passed', async () => {
    mockRepo.fetch.mockResolvedValue(stored());
    expect(await EmailSettingsService.verifiedTransport()).toBeNull();
  });
});
