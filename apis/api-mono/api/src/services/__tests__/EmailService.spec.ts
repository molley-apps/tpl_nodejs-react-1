const mockSettings = { verifiedTransport: jest.fn(), recordSendOutcome: jest.fn() };
const mockTransport = { deliver: jest.fn() };
const mockEmailer = { send: jest.fn() };

jest.mock('@/services/EmailSettingsService', () => ({ __esModule: true, default: mockSettings }));
jest.mock('@/services/EmailTransportService', () => ({ __esModule: true, default: mockTransport }));
jest.mock('nunjucks-emailer', () => ({ Emailer: mockEmailer, EmailerSendTypes: { nodemailer: 'NODEMAILER' } }));

import config from '@/config';
import EmailService from '@/services/EmailService';

const transport = { host: 'smtp.resend.com', updatedAt: new Date() };
const message = { to: { email: 'Ada@acme.com', name: 'Ada' }, tplRelativePath: 'auth/resetPassword', tplObject: { url: 'u' } };

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  config.env = 'test';
});

describe('EmailService.send', () => {
  it('reports not-configured without throwing while no verified provider exists', async () => {
    mockSettings.verifiedTransport.mockResolvedValue(null);

    expect(await EmailService.send(message)).toEqual({ sent: false, reason: 'not-configured' });
    expect(mockTransport.deliver).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalled();
  });

  it('delivers through the verified settings and records the success', async () => {
    mockSettings.verifiedTransport.mockResolvedValue(transport);
    mockTransport.deliver.mockResolvedValue({ ok: true, response: '250 OK' });

    expect(await EmailService.send(message)).toEqual({ sent: true });
    expect(mockTransport.deliver).toHaveBeenCalledWith(transport, message);
    expect(mockSettings.recordSendOutcome).toHaveBeenCalledWith();
  });

  it('returns the provider error and records it', async () => {
    mockSettings.verifiedTransport.mockResolvedValue(transport);
    mockTransport.deliver.mockResolvedValue({ ok: false, error: '550 Unverified domain' });

    expect(await EmailService.send(message)).toEqual({ sent: false, reason: 'provider', error: '550 Unverified domain' });
    expect(mockSettings.recordSendOutcome).toHaveBeenCalledWith('550 Unverified domain');
  });

  it('falls back to the env-configured emailer in local development only', async () => {
    mockSettings.verifiedTransport.mockResolvedValue(null);
    config.env = 'local';

    expect(await EmailService.send(message)).toEqual({ sent: true });
    expect(mockEmailer.send).toHaveBeenCalledWith({
      to: { email: 'Ada@acme.com', name: 'Ada' },
      tplRelativePath: 'auth/resetPassword',
      tplObject: { url: 'u' },
    });
    expect(mockTransport.deliver).not.toHaveBeenCalled();
  });

  it('stops after 20 messages to one recipient within the hour, case-insensitively', async () => {
    mockSettings.verifiedTransport.mockResolvedValue(transport);
    mockTransport.deliver.mockResolvedValue({ ok: true, response: '250 OK' });
    const to = { email: 'loop@acme.com' };

    for (let i = 0; i < 20; i += 1) {
      expect(await EmailService.send({ ...message, to: i % 2 ? to : { email: 'LOOP@acme.com' } })).toEqual({ sent: true });
    }
    expect(await EmailService.send({ ...message, to })).toEqual({ sent: false, reason: 'rate-limited' });
    expect(await EmailService.send({ ...message, to: { email: 'other@acme.com' } })).toEqual({ sent: true });
    expect(mockTransport.deliver).toHaveBeenCalledTimes(21);
  });
});

describe('EmailService.isEnabled', () => {
  it('follows the verified settings outside local development', async () => {
    mockSettings.verifiedTransport.mockResolvedValue(null);
    expect(await EmailService.isEnabled()).toBe(false);
    mockSettings.verifiedTransport.mockResolvedValue(transport);
    expect(await EmailService.isEnabled()).toBe(true);
  });

  it('is always on locally', async () => {
    config.env = 'local';
    expect(await EmailService.isEnabled()).toBe(true);
    expect(mockSettings.verifiedTransport).not.toHaveBeenCalled();
  });
});
