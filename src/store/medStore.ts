import { create } from "zustand";
import { Med, Alarm, Log } from "../database/schema";
import * as dbOps from "../database/operations";

interface MedWithAlarms extends Med {
    alarms: Alarm[];
}

interface TodayMedItem {
    med: Med;
    alarm: Alarm;
    log: Log | null;
}

interface MedStore {
    // State
    meds: Med[];
    logs: Log[];
    todayMeds: TodayMedItem[];
    isLoading: boolean;
    error: string | null;

    // Actions
    loadMeds: () => Promise<void>;
    loadTodayLogs: () => Promise<void>;
    loadTodayMeds: () => Promise<void>;
    addMed: (med: Omit<Med, "id">, times: string[]) => Promise<number>;
    deleteMed: (id: number) => Promise<void>;
    markAsTaken: (medId: number, alarmTime?: string) => Promise<void>;
    markAsSkipped: (medId: number, alarmTime: string) => Promise<void>;
    clearError: () => void;
}

export const useMedStore = create<MedStore>((set, get) => ({
    meds: [],
    logs: [],
    todayMeds: [],
    isLoading: false,
    error: null,

    loadMeds: async () => {
        set({ isLoading: true, error: null });
        try {
            const meds = await dbOps.getAllMeds();
            set({ meds, isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "Failed to load medications",
                isLoading: false,
            });
        }
    },

    loadTodayLogs: async () => {
        try {
            const today = new Date().toISOString().split("T")[0];
            const logs = await dbOps.getTodayLogs();
            set({ logs });
        } catch (error) {
            console.error("Failed to load today's logs:", error);
        }
    },

    loadTodayMeds: async () => {
        set({ isLoading: true, error: null });
        try {
            const activeMeds = await dbOps.getActiveMeds();
            const today = new Date().toISOString().split("T")[0];
            const todayMeds: TodayMedItem[] = [];

            for (const med of activeMeds) {
                const alarms = await dbOps.getAlarmsByMedId(med.id!);

                for (const alarm of alarms) {
                    if (!alarm.is_active) continue;

                    const log = await dbOps.getLogByMedIdAndTime(
                        med.id!,
                        alarm.time,
                        today
                    );

                    todayMeds.push({
                        med,
                        alarm,
                        log,
                    });
                }
            }

            // Sort by alarm time
            todayMeds.sort((a, b) => a.alarm.time.localeCompare(b.alarm.time));

            set({ todayMeds, isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "Failed to load today's medications",
                isLoading: false,
            });
        }
    },

    addMed: async (med, times) => {
        set({ isLoading: true, error: null });
        try {
            const medId = await dbOps.addMed(med);

            // Add alarms for each time
            for (const time of times) {
                await dbOps.addAlarm({
                    med_id: medId,
                    time,
                    is_active: 1,
                });
            }

            // Reload meds
            await get().loadMeds();
            await get().loadTodayMeds();

            set({ isLoading: false });
            return medId;
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "Failed to add medication",
                isLoading: false,
            });
            throw error;
        }
    },

    deleteMed: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await dbOps.deleteAlarmsByMedId(id);
            await dbOps.deleteMed(id);
            await get().loadMeds();
            await get().loadTodayMeds();
            set({ isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "Failed to delete medication",
                isLoading: false,
            });
        }
    },

    markAsTaken: async (medId, alarmTime) => {
        set({ isLoading: true, error: null });
        try {
            const now = new Date();
            const today = now.toISOString().split("T")[0];
            const timeStr = alarmTime || now.toTimeString().slice(0, 5);
            const takenAt = `${today}T${timeStr}:00`;

            await dbOps.addLog({
                med_id: medId,
                taken_at: takenAt,
                status: "taken",
            });

            await get().loadTodayMeds();
            await get().loadTodayLogs();
            set({ isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "Failed to mark as taken",
                isLoading: false,
            });
        }
    },

    markAsSkipped: async (medId, alarmTime) => {
        set({ isLoading: true, error: null });
        try {
            const now = new Date();
            const today = now.toISOString().split("T")[0];
            const takenAt = `${today}T${alarmTime}:00`;

            await dbOps.addLog({
                med_id: medId,
                taken_at: takenAt,
                status: "skipped",
            });

            await get().loadTodayMeds();
            set({ isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "Failed to mark as skipped",
                isLoading: false,
            });
        }
    },

    clearError: () => set({ error: null }),
}));
