import { getDatabase, Med, Alarm, Log } from "./schema";

// ==================== Meds Operations ====================

export async function addMed(med: Omit<Med, "id">): Promise<number> {
    const db = await getDatabase();
    const result = await db.runAsync(
        `INSERT INTO Meds (name, daily_freq, duration_days, start_date) VALUES (?, ?, ?, ?)`,
        [med.name, med.daily_freq, med.duration_days, med.start_date]
    );
    return result.lastInsertRowId;
}

export async function getAllMeds(): Promise<Med[]> {
    const db = await getDatabase();
    return await db.getAllAsync<Med>("SELECT * FROM Meds ORDER BY start_date DESC");
}

export async function getMedById(id: number): Promise<Med | null> {
    const db = await getDatabase();
    return await db.getFirstAsync<Med>("SELECT * FROM Meds WHERE id = ?", [id]);
}

export async function deleteMed(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM Meds WHERE id = ?", [id]);
}

export async function getActiveMeds(): Promise<Med[]> {
    const db = await getDatabase();
    const today = new Date().toISOString().split("T")[0];
    return await db.getAllAsync<Med>(
        `SELECT * FROM Meds 
     WHERE date(start_date, '+' || duration_days || ' days') >= date(?)
     ORDER BY start_date DESC`,
        [today]
    );
}

// ==================== Alarms Operations ====================

export async function addAlarm(alarm: Omit<Alarm, "id">): Promise<number> {
    const db = await getDatabase();
    const result = await db.runAsync(
        `INSERT INTO Alarms (med_id, time, is_active) VALUES (?, ?, ?)`,
        [alarm.med_id, alarm.time, alarm.is_active]
    );
    return result.lastInsertRowId;
}

export async function getAlarmsByMedId(medId: number): Promise<Alarm[]> {
    const db = await getDatabase();
    return await db.getAllAsync<Alarm>(
        "SELECT * FROM Alarms WHERE med_id = ? ORDER BY time",
        [medId]
    );
}

export async function getAllActiveAlarms(): Promise<(Alarm & { med_name: string })[]> {
    const db = await getDatabase();
    return await db.getAllAsync<Alarm & { med_name: string }>(
        `SELECT a.*, m.name as med_name 
     FROM Alarms a 
     JOIN Meds m ON a.med_id = m.id 
     WHERE a.is_active = 1
     ORDER BY a.time`
    );
}

export async function toggleAlarm(id: number, isActive: boolean): Promise<void> {
    const db = await getDatabase();
    await db.runAsync("UPDATE Alarms SET is_active = ? WHERE id = ?", [
        isActive ? 1 : 0,
        id,
    ]);
}

export async function deleteAlarmsByMedId(medId: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM Alarms WHERE med_id = ?", [medId]);
}

// ==================== Logs Operations ====================

export async function addLog(log: Omit<Log, "id">): Promise<number> {
    const db = await getDatabase();
    const result = await db.runAsync(
        `INSERT INTO Logs (med_id, taken_at, status) VALUES (?, ?, ?)`,
        [log.med_id, log.taken_at, log.status]
    );
    return result.lastInsertRowId;
}

export async function getLogsByMedId(medId: number): Promise<Log[]> {
    const db = await getDatabase();
    return await db.getAllAsync<Log>(
        "SELECT * FROM Logs WHERE med_id = ? ORDER BY taken_at DESC",
        [medId]
    );
}

export async function getTodayLogs(): Promise<(Log & { med_name: string })[]> {
    const db = await getDatabase();
    const today = new Date().toISOString().split("T")[0];
    return await db.getAllAsync<Log & { med_name: string }>(
        `SELECT l.*, m.name as med_name 
     FROM Logs l 
     JOIN Meds m ON l.med_id = m.id 
     WHERE date(l.taken_at) = date(?)
     ORDER BY l.taken_at DESC`,
        [today]
    );
}

export async function getLogByMedIdAndTime(
    medId: number,
    timeSlot: string, // HH:mm
    date: string // YYYY-MM-DD
): Promise<Log | null> {
    const db = await getDatabase();
    const startOfSlot = `${date}T${timeSlot}:00`;
    const endOfSlot = `${date}T${timeSlot}:59`;

    return await db.getFirstAsync<Log>(
        `SELECT * FROM Logs 
     WHERE med_id = ? 
     AND taken_at >= ? 
     AND taken_at <= ?`,
        [medId, startOfSlot, endOfSlot]
    );
}

// 기간별 로그 조회 (일주일, 한달 등)
export async function getLogsByDateRange(
    startDate: string, // YYYY-MM-DD
    endDate: string // YYYY-MM-DD
): Promise<(Log & { med_name: string })[]> {
    const db = await getDatabase();
    return await db.getAllAsync<Log & { med_name: string }>(
        `SELECT l.*, m.name as med_name 
     FROM Logs l 
     JOIN Meds m ON l.med_id = m.id 
     WHERE date(l.taken_at) >= date(?) 
     AND date(l.taken_at) <= date(?)
     ORDER BY l.taken_at DESC`,
        [startDate, endDate]
    );
}

// 기간 내 예상 복용 횟수 계산 (일수 * 각 약의 daily_freq)
export async function getExpectedDosesByDateRange(
    startDate: string,
    endDate: string
): Promise<number> {
    const db = await getDatabase();

    // 시작일과 종료일 사이의 일수 계산
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // 해당 기간에 활성화된 약들의 daily_freq 합계
    const meds = await db.getAllAsync<Med>(
        `SELECT * FROM Meds 
     WHERE date(start_date) <= date(?)
     AND date(start_date, '+' || duration_days || ' days') >= date(?)`,
        [endDate, startDate]
    );

    return meds.reduce((sum, med) => sum + (med.daily_freq * days), 0);
}

// 일별 복용 통계 (달력용)
export interface DailyStats {
    date: string;
    completed: number;
    total: number;
    percentage: number;
}

export async function getDailyComplianceStats(
    startDate: string,
    endDate: string
): Promise<DailyStats[]> {
    const db = await getDatabase();
    const results: DailyStats[] = [];

    // 시작일부터 종료일까지 순회
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
        const dateStr = current.toISOString().split("T")[0];

        // 해당 날짜에 활성화된 약 목록
        const activeMeds = await db.getAllAsync<Med>(
            `SELECT * FROM Meds 
             WHERE date(start_date) <= date(?)
             AND date(start_date, '+' || duration_days || ' days') >= date(?)`,
            [dateStr, dateStr]
        );

        // 해당 날짜의 예상 복용 횟수
        const totalDoses = activeMeds.reduce((sum, med) => sum + med.daily_freq, 0);

        // 해당 날짜의 실제 복용 횟수
        const logs = await db.getAllAsync<Log>(
            `SELECT * FROM Logs 
             WHERE date(taken_at) = date(?)
             AND status = 'taken'`,
            [dateStr]
        );

        const completedDoses = logs.length;
        const percentage = totalDoses > 0 ? (completedDoses / totalDoses) * 100 : 0;

        results.push({
            date: dateStr,
            completed: completedDoses,
            total: totalDoses,
            percentage,
        });

        current.setDate(current.getDate() + 1);
    }

    return results;
}
