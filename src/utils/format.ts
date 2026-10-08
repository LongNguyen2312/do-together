export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 100) * 10} m` : `${km.toFixed(1)} km`;
}

/** "HH:mm" for a moment `minutes` from now (negative for the past). */
export function clockIn(minutes: number, now = new Date()): string {
  const date = new Date(now.getTime() + minutes * 60 * 1000);
  return `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`;
}

/** "dd/MM • HH:mm" for a moment `minutes` from now, e.g. a past activity. */
export function dateTimeIn(minutes: number, now = new Date()): string {
  const date = new Date(now.getTime() + minutes * 60 * 1000);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month} • ${clockIn(minutes, now)}`;
}

/** "HH:mm" for today, "dd/MM • HH:mm" for other days. */
export function chatTime(epochMs: number, now = new Date()): string {
  const date = new Date(epochMs);
  const minutes = (epochMs - now.getTime()) / (60 * 1000);
  return date.toDateString() === now.toDateString()
    ? clockIn(minutes, now)
    : dateTimeIn(minutes, now);
}

/** 65000 -> "1:05". */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(Math.round(ms / 1000), 0);
  const minutes = Math.floor(totalSeconds / 60);
  return `${minutes}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

/** 1200 -> "1.2k"; smaller counts are left as they are. */
export function formatCount(count: number): string {
  if (count < 1000) {
    return String(count);
  }
  const thousands = count / 1000;
  return `${Number.isInteger(thousands) ? thousands : thousands.toFixed(1)}k`;
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/** Lowercase without Vietnamese marks, so "ca phe" finds "Cà phê". */
export function normalizeSearch(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim();
}
