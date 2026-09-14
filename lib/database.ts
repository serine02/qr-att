import * as SQLite from "expo-sqlite";

// =====================================================
// TYPES
// =====================================================

export type AttendanceRecord = {
  id: number;
  studentId: string;
  eventId: string;
  scannedAt: string;
};

export type Event = {
  eventId: string;
  title: string;
  start: string;
  end: string;
};

export type Student = {
  studentId: string;
  name: string;
};

type EventPayload = {
  v: number;
  event: string;
  title?: string;
  start?: string;
  end?: string;
};

export type RegisterResult = {
  success: boolean;
  message: string;
};

// =====================================================
// DATABASE
// =====================================================

const dbPromise = SQLite.openDatabaseAsync("qr-attendance.db");

async function getDb() {
  const db = await dbPromise;

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS events (
      eventId TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      start TEXT NOT NULL,
      end TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId TEXT NOT NULL,
      eventId TEXT NOT NULL,
      scannedAt TEXT NOT NULL,
      UNIQUE (studentId, eventId)
    );

    CREATE TABLE IF NOT EXISTS students (
      studentId TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS session (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      studentId TEXT
    );
  `);

  return db;
}

// =====================================================
// EVENT FUNCTIONS
// =====================================================

export async function getAllEvents(): Promise<Event[]> {
  const database = await getDb();

  return database.getAllAsync<Event>(
    "SELECT eventId, title, start, end FROM events ORDER BY start ASC"
  );
}

export async function getEvent(
  eventId: string
): Promise<Event | null> {
  const database = await getDb();

  const row = await database.getFirstAsync<Event>(
    "SELECT eventId, title, start, end FROM events WHERE eventId = ?",
    eventId
  );

  return row ?? null;
}

export async function createEvent(
  event: Event
): Promise<void> {
  const database = await getDb();

  await database.runAsync(
    "INSERT OR REPLACE INTO events (eventId, title, start, end) VALUES (?, ?, ?, ?)",
    event.eventId,
    event.title,
    event.start,
    event.end
  );
}

export async function updateEvent(
  event: Event
): Promise<void> {
  const database = await getDb();

  await database.runAsync(
    `
    UPDATE events
    SET
      title = ?,
      start = ?,
      end = ?
    WHERE eventId = ?
    `,
    event.title,
    event.start,
    event.end,
    event.eventId
  );
}

export async function deleteEvent(
  eventId: string
): Promise<void> {
  const database = await getDb();

  await database.runAsync(
    "DELETE FROM events WHERE eventId = ?",
    eventId
  );
}

// =====================================================
// QR / ATTENDANCE FUNCTIONS
// =====================================================

export async function registerAttendance(
  data: string,
  studentId: string
): Promise<RegisterResult> {
  const database = await getDb();

  let payload: EventPayload;

  try {
    payload = JSON.parse(data) as EventPayload;
  } catch {
    return {
      success: false,
      message: "Invalid QR code.",
    };
  }

  if (
    !payload ||
    payload.v !== 1 ||
    !payload.event
  ) {
    return {
      success: false,
      message: "Invalid attendance QR code.",
    };
  }

  const eventId = payload.event;

  const event = await database.getFirstAsync<Event>(
    "SELECT eventId, title, start, end FROM events WHERE eventId = ?",
    eventId
  );

  if (!event) {
    return {
      success: false,
      message: "Event not found.",
    };
  }

  try {
    await database.runAsync(
      `
      INSERT INTO attendance
        (studentId, eventId, scannedAt)
      VALUES
        (?, ?, ?)
      `,
      studentId,
      eventId,
      new Date().toISOString()
    );

    return {
      success: true,
      message: `Attendance recorded for ${event.title}.`,
    };
  } catch {
    return {
      success: false,
      message: "Attendance already recorded for this event.",
    };
  }
}

export async function getAttendanceHistory(
  studentId: string
): Promise<AttendanceRecord[]> {
  const database = await getDb();

  return database.getAllAsync<AttendanceRecord>(
    `
    SELECT
      id,
      studentId,
      eventId,
      scannedAt
    FROM attendance
    WHERE studentId = ?
    ORDER BY scannedAt DESC
    `,
    studentId
  );
}

export async function getAllAttendance(): Promise<AttendanceRecord[]> {
  const database = await getDb();

  return database.getAllAsync<AttendanceRecord>(
    `
    SELECT
      id,
      studentId,
      eventId,
      scannedAt
    FROM attendance
    ORDER BY scannedAt DESC
    `
  );
}

// =====================================================
// SESSION FUNCTIONS
// =====================================================

export async function getCurrentStudentId(): Promise<string | null> {
  const database = await getDb();

  const row = await database.getFirstAsync<{
    studentId: string | null;
  }>(
    "SELECT studentId FROM session WHERE id = 1"
  );

  return row?.studentId ?? null;
}

export async function setCurrentStudent(
  studentId: string
): Promise<void> {
  const database = await getDb();

  await database.runAsync(
    "INSERT OR REPLACE INTO session (id, studentId) VALUES (1, ?)",
    studentId
  );
}

export async function clearSession(): Promise<void> {
  const database = await getDb();

  await database.runAsync(
    "DELETE FROM session WHERE id = 1"
  );
}

// =====================================================
// STUDENT FUNCTIONS
// =====================================================

export async function getAllStudents(): Promise<Student[]> {
  const database = await getDb();

  return database.getAllAsync<Student>(
    "SELECT studentId, name FROM students ORDER BY name"
  );
}

export async function getStudent(
  studentId: string
): Promise<Student | null> {
  const database = await getDb();

  const row = await database.getFirstAsync<Student>(
    "SELECT studentId, name FROM students WHERE studentId = ?",
    studentId
  );

  return row ?? null;
}

export async function createStudent(
  name: string
): Promise<Student> {
  const database = await getDb();

  const countRow = await database.getFirstAsync<{
    c: number;
  }>(
    "SELECT COUNT(*) AS c FROM students"
  );

  const next = (countRow?.c ?? 0) + 1;

  const studentId = `STUDENT-2026-${String(next).padStart(3, "0")}`;

  const trimmedName = name.trim();

  await database.runAsync(
    "INSERT OR IGNORE INTO students (studentId, name) VALUES (?, ?)",
    studentId,
    trimmedName
  );

  return {
    studentId,
    name: trimmedName,
  };
}

export async function updateStudentName(
  studentId: string,
  name: string
): Promise<void> {
  const database = await getDb();

  await database.runAsync(
    "UPDATE students SET name = ? WHERE studentId = ?",
    name.trim(),
    studentId
  );
}

export async function getAttendanceCount(
  studentId: string
): Promise<number> {
  const database = await getDb();

  const row = await database.getFirstAsync<{
    c: number;
  }>(
    "SELECT COUNT(*) AS c FROM attendance WHERE studentId = ?",
    studentId
  );

  return row?.c ?? 0;
}