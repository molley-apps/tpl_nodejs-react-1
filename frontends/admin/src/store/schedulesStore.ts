import { create } from 'zustand';
import AdminService from 'apis/api-mono/services/AdminService';
import { AdminSchedule } from 'apis/api-mono/services/interfaces/AdminSchedule';
import { AdminSchedulesNamePutPut } from 'apis/api-mono/services/interfaces/AdminSchedulesNamePutPut';

interface SchedulesState {
  schedules: AdminSchedule[];
  loading: boolean;
  fetchSchedules: () => Promise<void>;
  saveSchedule: (name: string, body: AdminSchedulesNamePutPut) => Promise<AdminSchedule>;
  runNow: (name: string) => Promise<AdminSchedule>;
}

const replace = (schedules: AdminSchedule[], updated: AdminSchedule) =>
  schedules.map((schedule) => (schedule.name === updated.name ? updated : schedule));

/** The scheduled jobs of the app (GET /api/admin/schedules, PUT and POST .../run per job). */
export const useSchedulesStore = create<SchedulesState>((set, get) => ({
  schedules: [],
  loading: false,

  fetchSchedules: async () => {
    set({ loading: true });
    try {
      set({ schedules: await AdminService.adminSchedulesGet() });
    } catch (error) {
      console.error('Failed to load schedules:', error);
    } finally {
      set({ loading: false });
    }
  },

  saveSchedule: async (name, body) => {
    const updated = await AdminService.adminSchedulesNamePut(body, { name });
    set({ schedules: replace(get().schedules, updated) });
    return updated;
  },

  runNow: async (name) => {
    const updated = await AdminService.adminSchedulesNameRunPost({ name });
    set({ schedules: replace(get().schedules, updated) });
    return updated;
  },
}));
