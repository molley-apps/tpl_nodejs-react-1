import { create } from 'zustand';
import AdminService from 'apis/api-mono/services/AdminService';
import { AdminSecret } from 'apis/api-mono/services/interfaces/AdminSecret';
import { AdminSecretsSecretKeyPutPut } from 'apis/api-mono/services/interfaces/AdminSecretsSecretKeyPutPut';

interface AppSecretsState {
  secrets: AdminSecret[];
  loading: boolean;
  fetchSecrets: () => Promise<void>;
  saveSecret: (key: string, body: AdminSecretsSecretKeyPutPut) => Promise<AdminSecret>;
  removeSecret: (key: string) => Promise<void>;
}

const upsert = (secrets: AdminSecret[], saved: AdminSecret) =>
  [...secrets.filter((secret) => secret.key !== saved.key), saved].sort((a, b) => a.key.localeCompare(b.key));

/** The app's secrets (GET /api/admin/secrets, PUT and DELETE /api/admin/secrets/{secretKey}). Values never reach the browser. */
export const useAppSecretsStore = create<AppSecretsState>((set, get) => ({
  secrets: [],
  loading: false,

  fetchSecrets: async () => {
    set({ loading: true });
    try {
      set({ secrets: await AdminService.adminSecretsGet() });
    } catch (error) {
      console.error('Failed to load app secrets:', error);
    } finally {
      set({ loading: false });
    }
  },

  saveSecret: async (key, body) => {
    const saved = await AdminService.adminSecretsSecretKeyPut(body, { secretKey: key });
    set({ secrets: upsert(get().secrets, saved) });
    return saved;
  },

  removeSecret: async (key) => {
    await AdminService.adminSecretsSecretKeyDelete({ secretKey: key });
    set({ secrets: get().secrets.filter((secret) => secret.key !== key) });
  },
}));
