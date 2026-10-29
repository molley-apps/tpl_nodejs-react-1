const mockSettings = { get: jest.fn(), save: jest.fn(), test: jest.fn(), clear: jest.fn() };
const mockEmail = { isEnabled: jest.fn() };
jest.mock('@/services/EmailSettingsService', () => ({ __esModule: true, default: mockSettings }));
jest.mock('@/services/EmailService', () => ({ __esModule: true, default: mockEmail }));

import AdminEmailDomain from '@/domains/AdminEmailDomain';
import MetaDomain from '@/domains/MetaDomain';
import { Provider } from '@/http/nodegen/interfaces/AdminSettingsEmailPutPut';
import NodegenRequest from '@/http/interfaces/NodegenRequest';

const req = {
  sessionData: { userId: 'admin-1', user: { email: 'ada@acme.com', name: 'Ada' } },
} as unknown as NodegenRequest;

beforeEach(() => jest.clearAllMocks());

describe('AdminEmailDomain', () => {
  it('reads, saves as the signed-in admin, tests to the admin and clears', async () => {
    mockSettings.get.mockResolvedValue({ configured: false, verified: false });
    mockSettings.save.mockResolvedValue({ configured: true, verified: false });
    mockSettings.test.mockResolvedValue({ success: true, providerResponse: '250 OK' });
    const body = { provider: Provider.Brevo, host: 'h', port: 587, username: 'u', password: 'p', fromAddress: 'f@acme.com' };

    expect(await AdminEmailDomain.adminSettingsEmailGet(req)).toEqual({ configured: false, verified: false });
    expect(await AdminEmailDomain.adminSettingsEmailPut(body, req)).toEqual({ configured: true, verified: false });
    expect(mockSettings.save).toHaveBeenCalledWith(body, 'admin-1');
    expect(await AdminEmailDomain.adminSettingsEmailTestPost(req)).toEqual({ success: true, providerResponse: '250 OK' });
    expect(mockSettings.test).toHaveBeenCalledWith({ email: 'ada@acme.com', name: 'Ada' });
    expect(await AdminEmailDomain.adminSettingsEmailDelete(req)).toEqual({ success: true });
    expect(mockSettings.clear).toHaveBeenCalledTimes(1);
  });
});

describe('MetaDomain', () => {
  it('exposes the app name and whether email is on, and nothing else', async () => {
    mockEmail.isEnabled.mockResolvedValue(true);
    expect(await MetaDomain.metaGet(req)).toEqual({ appName: expect.any(String), features: { email: true } });
  });
});
