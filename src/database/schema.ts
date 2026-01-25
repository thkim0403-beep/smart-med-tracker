import * as SQLite from "expo-sqlite";

export interface Med {
    id?: number;
    name: string;
    daily_freq: number;
    duration_days: number;
    start_date: string;
}

export interface Alarm {
    id?: number;
    med_id: number;
    time: string; // HH:mm format
    is_active: number; // 0 or 1
}

export interface Log {
    id?: number;
    med_id: number;
    taken_at: string; // ISO String
    status: "taken" | "skipped";
}

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
    if (!db) {
        db = await SQLite.openDatabaseAsync("smartmedtracker.db");
    }
    return db;
}

export async function initDatabase(): Promise<void> {
    const database = await getDatabase();

    await database.execAsync(`
    CREATE TABLE IF NOT EXISTS Meds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      daily_freq INTEGER NOT NULL,
      duration_days INTEGER NOT NULL,
      start_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Alarms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      med_id INTEGER NOT NULL,
      time TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (med_id) REFERENCES Meds(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS Logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      med_id INTEGER NOT NULL,
      taken_at TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('taken', 'skipped')),
      FOREIGN KEY (med_id) REFERENCES Meds(id) ON DELETE CASCADE
    );
  `);

    console.log("Database initialized successfully");
}
