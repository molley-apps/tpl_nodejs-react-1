import { create } from 'zustand';
import HealthService from 'apis/api-mono/services/HealthService';
import CapabilitiesService from 'apis/api-mono/services/CapabilitiesService';

interface AppState {
  greeting: string;
  setGreeting: (greeting: string) => void;

  apiHealthy: boolean | null;
  healthLoading: boolean;
  healthError: string | null;
  checkHealth: () => Promise<void>;

  /** GET /api/capabilities: outgoing email is set up, so password reset and magic links work. null until loaded. */
  emailEnabled: boolean | null;
  fetchCapabilities: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  greeting: 'Hello, World!',
  setGreeting: (greeting) => set({ greeting }),

  apiHealthy: null,
  healthLoading: false,
  healthError: null,
  checkHealth: async () => {
    set({ healthLoading: true, healthError: null });
    try {
      const health = await HealthService.healthGet();
      set({ apiHealthy: !!health.http, healthLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      set({ apiHealthy: false, healthLoading: false, healthError: message });
    }
  },

  emailEnabled: null,
  fetchCapabilities: async () => {
    try {
      const capabilities = await CapabilitiesService.capabilitiesGet();
      set({ emailEnabled: !!capabilities.email });
    } catch (err: unknown) {
      // The sign in form still works without the answer; only the email dependent links stay hidden
      console.error('Failed to load capabilities:', err);
      set({ emailEnabled: false });
    }
  },
}));
