// Date helpers. Dates are stored as ISO "YYYY-MM-DD" strings (local calendar day).
// Weekday index is Monday-based: 0 = пн … 6 = вс (matches habit.days).

export const RU_WEEKDAYS_SHORT = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];
export const RU_WEEKDAYS_FULL = [
  "понедельник",
  "вторник",
  "среда",
  "четверг",
  "пятница",
  "суббота",
  "воскресенье",
];
export const RU_MONTHS = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];
export const RU_MONTHS_NOM = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

// "25 мин" / "1 ч 30 мин" / "2 ч"
export function formatMinutes(min: number): string {
  const m = Math.max(0, Math.round(min));
  if (m < 60) return `${m} мин`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} ч ${r} мин` : `${h} ч`;
}

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO(): string {
  return toISO(new Date());
}

export function addDays(iso: string, n: number): string {
  const d = fromISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

// Monday-based weekday: 0 = пн … 6 = вс
export function weekdayMon0(iso: string): number {
  return (fromISO(iso).getDay() + 6) % 7;
}

export function startOfWeek(iso: string): string {
  return addDays(iso, -weekdayMon0(iso));
}

// 7 ISO dates пн..вс for the week containing `iso`.
export function weekDates(iso: string): string[] {
  const start = startOfWeek(iso);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function dayOfMonth(iso: string): number {
  return fromISO(iso).getDate();
}

export function formatWeekdayFull(iso: string): string {
  return RU_WEEKDAYS_FULL[weekdayMon0(iso)];
}

export function formatDayMonth(iso: string): string {
  const d = fromISO(iso);
  return `${d.getDate()} ${RU_MONTHS[d.getMonth()]}`;
}

export function monthLabel(year: number, month0: number): string {
  return `${RU_MONTHS_NOM[month0]} ${year}`;
}

// Cells (with leading blanks) for a month grid, Monday-first.
export function monthGrid(year: number, month0: number): (string | null)[] {
  const first = new Date(year, month0, 1);
  const lead = (first.getDay() + 6) % 7;
  const days = new Date(year, month0 + 1, 0).getDate();
  return [
    ...Array<null>(lead).fill(null),
    ...Array.from({ length: days }, (_, i) => toISO(new Date(year, month0, i + 1))),
  ];
}
