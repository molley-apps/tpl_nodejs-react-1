const mockSecrets = { list: jest.fn(), save: jest.fn(), remove: jest.fn() };
jest.mock('@/services/AppSecretsService', () => ({ __esModule: true, default: mockSecrets }));
jest.mock('@/services/AdminUserService', () => ({ __esModule: true, default: { list: jest.fn() } }));
jest.mock('@/services/ScheduleService', () => ({ __esModule: true, default: { list: jest.fn() } }));

import AdminDomain from '@/domains/AdminDomain';
import AdminSecretKeyDomain from '@/domains/AdminSecretKeyDomain';
import NodegenRequest from '@/http/interfaces/NodegenRequest';

const req = { sessionData: { userId: 'admin-1' } } as unknown as NodegenRequest;
const secret = { key: 'ANTHROPIC_API_KEY', description: 'Summariser', valueLast4: 'alue', updatedAt: new Date() };

beforeEach(() => jest.clearAllMocks());

describe('App secrets admin API', () => {
  it('lists the secrets', async () => {
    mockSecrets.list.mockResolvedValue([secret]);
    expect(await AdminDomain.adminSecretsGet(req)).toEqual([secret]);
  });

  it('saves a secret under the path key as the signed-in admin', async () => {
    mockSecrets.save.mockResolvedValue(secret);
    const body = { value: 'sk-ant-api03-secret-value', description: 'Summariser' };

    expect(await AdminSecretKeyDomain.adminSecretsSecretKeyPut(body, { secretKey: 'ANTHROPIC_API_KEY' }, req)).toEqual(secret);
    expect(mockSecrets.save).toHaveBeenCalledWith('ANTHROPIC_API_KEY', body, 'admin-1');
  });

  it('removes a secret', async () => {
    expect(await AdminSecretKeyDomain.adminSecretsSecretKeyDelete({ secretKey: 'MAPS_KEY' }, req)).toEqual({ success: true });
    expect(mockSecrets.remove).toHaveBeenCalledWith('MAPS_KEY');
  });
});
