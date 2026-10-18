import { create } from 'zustand';
import AdminService from 'apis/api-mono/services/AdminService';
import { AdminSettingsEmail } from 'apis/api-mono/services/interfaces/AdminSettingsEmail';
import { AdminSettingsEmailPutPut } from 'apis/api-mono/services/interfaces/AdminSettingsEmailPutPut';
import { AdminSettingsEmailTest } from 'apis/api-mono/services/interfaces/AdminSettingsEmailTest';

interface EmailSettingsState {
  /** null until the first fetch answers */
  settings: AdminSettingsEmail | null;
  loading: boolean;
  fetchSettings: () => Promise<void>;
  saveSettings: (body: AdminSettingsEmailPutPut) => Promise<AdminSettingsEmail>;
  sendTest: () => Promise<AdminSettingsEmailTest>;
  removeSettings: () => Promise<void>;
}

/**
 * The outgoing email provider (GET/PUT/DELETE /api/admin/settings/email, POST .../test). Shared by the settings
 * page and the banner every page shows until email is verified.
 */
export const useEmailSettingsStore = create<EmailSettingsState>((set) => ({
  settings: null,
  loading: false,

  fetchSettings: async () => {
    set({ loading: true });
    try {
      set({ settings: await AdminService.adminSettingsEmailGet() });
    } catch (error) {
      console.error('Failed to load email settings:', error);
    } finally {
      set({ loading: false });
    }
  },

  saveSettings: async (body) => {
    const settings = await AdminService.adminSettingsEmailPut(body);
    set({ settings });
    return settings;
  },

  sendTest: async () => {
    const result = await AdminService.adminSettingsEmailTestPost();
    // The test changes verified / lastError on the server, re-read rather than guess
    set({ settings: await AdminService.adminSettingsEmailGet() });
    return result;
  },

  removeSettings: async () => {
    await AdminService.adminSettingsEmailDelete();
    set({ settings: { configured: false, verified: false } });
  },
}));
