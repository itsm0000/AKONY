/**
 * Export Limiter Service
 * 
 * Tracks daily export counts for free-tier users.
 * - Free tier: 3 exports per day
 * - Pro tier: unlimited
 * 
 * Storage: localStorage (anonymous) or user_preferences table (authenticated)
 */

const DAILY_LIMIT = 3;
const STORAGE_KEY = "akony_export_count";

interface ExportCount {
  count: number;
  date: string; // YYYY-MM-DD
  resetsAt: string; // ISO timestamp
}

function getTodayKey(): string {
  return new Date().toISOString().split("T")[0];
}

function getMidnightBaghdad(): Date {
  // Baghdad is UTC+3
  const now = new Date();
  const baghdad = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  baghdad.setHours(24, 0, 0, 0);
  return new Date(baghdad.getTime() - 3 * 60 * 60 * 1000);
}

export function getExportStatus(): ExportCount {
  if (typeof window === "undefined") {
    return { count: 0, date: getTodayKey(), resetsAt: getMidnightBaghdad().toISOString() };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: ExportCount = JSON.parse(stored);
      // Reset if it's a new day
      if (parsed.date !== getTodayKey()) {
        const fresh: ExportCount = {
          count: 0,
          date: getTodayKey(),
          resetsAt: getMidnightBaghdad().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
        return fresh;
      }
      return parsed;
    }
  } catch {
    // corrupted storage
  }

  const fresh: ExportCount = {
    count: 0,
    date: getTodayKey(),
    resetsAt: getMidnightBaghdad().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  return fresh;
}

export function canExport(): boolean {
  const status = getExportStatus();
  return status.count < DAILY_LIMIT;
}

export function getRemainingExports(): number {
  const status = getExportStatus();
  return Math.max(0, DAILY_LIMIT - status.count);
}

export function recordExport(): ExportCount {
  const status = getExportStatus();
  const updated: ExportCount = {
    count: status.count + 1,
    date: status.date,
    resetsAt: status.resetsAt,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function getDailyLimit(): number {
  return DAILY_LIMIT;
}
