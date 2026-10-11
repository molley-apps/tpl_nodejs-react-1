import { create } from 'zustand';
import HealthService from 'apis/api-mono/services/HealthService';

interface AppState {
  greeting: string;
  setGreeting: (greeting: string) => void;

  apiHealthy: boolean | null;
  healthLoading: boolean;
  healthError: string | null;
  checkHealth: () => Promise<void>;
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
}));
