import { create } from "zustand";
import { Med, MedGroup, Alarm, Log } from "../database/schema";
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
    groups: MedGroup[];
    isLoading: boolean;
    error: string | null;

    // Actions
    loadMeds: () => Promise<void>;
    loadTodayLogs: () => Promise<void>;
    loadTodayMeds: () => Promise<void>;
    loadGroups: () => Promise<void>;
    addMed: (med: Omit<Med, "id">, times: string[]) => Promise<number>;
    deleteMed: (id: number) => Promise<void>;
    markAsTaken: (medId: number, alarmTime?: string) => Promise<void>;
    markAsSkipped: (medId: number, alarmTime: string) => Promise<void>;
    addGroup: (name: string) => Promise<number>;
    updateGroup: (id: number, name: string) => Promise<void>;
    deleteGroup: (id: number) => Promise<void>;
    assignMedToGroup: (medId: number, groupId: number | null) => Promise<void>;
    markGroupAsTaken: (groupId: number) => Promise<void>;
    clearError: () => void;
}

export const useMedStore = create<MedStore>((set, get) => ({
    meds: [],
    logs: [],
    todayMeds: [],
    groups: [],
    isLoading: false,
    error: null,

    loadMeds: async () => {
        set({ isLoading: true, error: null });
        try {
            const meds = await dbOps.getAllMeds();
            const groups = await dbOps.getAllMedGroups();
            set({ meds, groups, isLoading: false });
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

    loadGroups: async () => {
        try {
            const groups = await dbOps.getAllMedGroups();
            set({ groups });
        } catch (error) {
            console.error("Failed to load groups:", error);
        }
    },

    addGroup: async (name) => {
        try {
            const id = await dbOps.addMedGroup(name);
            await get().loadGroups();
            return id;
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "Failed to add group",
            });
            throw error;
        }
    },

    updateGroup: async (id, name) => {
        try {
            await dbOps.updateMedGroup(id, name);
            await get().loadGroups();
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "Failed to update group",
            });
        }
    },

    deleteGroup: async (id) => {
        try {
            await dbOps.deleteMedGroup(id);
            await get().loadGroups();
            await get().loadMeds();
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "Failed to delete group",
            });
        }
    },

    assignMedToGroup: async (medId, groupId) => {
        try {
            await dbOps.assignMedToGroup(medId, groupId);
            await get().loadMeds();
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "Failed to assign med to group",
            });
        }
    },

    markGroupAsTaken: async (groupId) => {
        set({ isLoading: true, error: null });
        try {
            const groupMeds = await dbOps.getMedsByGroupId(groupId);
            const now = new Date();
            const today = now.toISOString().split("T")[0];
            const timeStr = now.toTimeString().slice(0, 5);
            const takenAt = `${today}T${timeStr}:00`;

            for (const med of groupMeds) {
                // 오늘 이미 복용 완료된 횟수 확인
                const todayLogs = (await dbOps.getLogsByMedId(med.id!)).filter(
                    (log) => log.taken_at.startsWith(today) && log.status === "taken"
                );
                // 남은 복용 횟수만큼 모두 로그 추가
                const remaining = med.daily_freq - todayLogs.length;
                for (let i = 0; i < remaining; i++) {
                    await dbOps.addLog({
                        med_id: med.id!,
                        taken_at: takenAt,
                        status: "taken",
                    });
                }
            }

            await get().loadTodayMeds();
            await get().loadTodayLogs();
            set({ isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "Failed to mark group as taken",
                isLoading: false,
            });
        }
    },

    clearError: () => set({ error: null }),
}));
