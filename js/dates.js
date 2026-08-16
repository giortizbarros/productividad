const WEEKDAYS_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const WEEKDAYS_LONG = [
  "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo",
];
const MONTHS_SHORT = [
  "ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic",
];

export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fromISODate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function startOfWeek(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function getWeekDates(monday) {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function isSameDate(a, b) {
  return toISODate(a) === toISODate(b);
}

export function weekdayShort(date) {
  return WEEKDAYS_SHORT[(date.getDay() + 6) % 7];
}

export function weekdayLong(date) {
  return WEEKDAYS_LONG[(date.getDay() + 6) % 7];
}

export function formatWeekRange(monday) {
  const sunday = addDays(monday, 6);
  const sameMonth = monday.getMonth() === sunday.getMonth();
  const sameYear = monday.getFullYear() === sunday.getFullYear();
  const startPart = `${monday.getDate()}${sameMonth ? "" : " " + MONTHS_SHORT[monday.getMonth()]}`;
  const endPart = `${sunday.getDate()} ${MONTHS_SHORT[sunday.getMonth()]}${sameYear ? "" : " " + sunday.getFullYear()}`;
  return `${startPart} – ${endPart} ${sunday.getFullYear()}`;
}

export function formatDayTitle(date) {
  return `${weekdayLong(date)} ${date.getDate()} de ${monthLong(date.getMonth())}`;
}

function monthLong(i) {
  const MONTHS_LONG = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];
  return MONTHS_LONG[i];
}

export function hourLabel(h) {
  return `${String(h).padStart(2, "0")}:00`;
}
