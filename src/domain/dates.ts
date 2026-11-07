function parts(key: string): [number, number, number] {
  const [y, m, d] = key.split('-').map(Number);
  return [y, m - 1, d];
}
const utcMs = (key: string) => Date.UTC(...parts(key));
const toKey = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export function dateKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export function addDays(key: string, n: number): string {
  return toKey(utcMs(key) + n * 86400000);
}
export function daysBetween(a: string, b: string): number {
  return Math.round((utcMs(b) - utcMs(a)) / 86400000);
}
function weekday(key: string): number {
  return new Date(utcMs(key)).getUTCDay(); // 0 = Sunday
}
export function weekIdOf(key: string): string {
  const back = (weekday(key) + 6) % 7;
  return addDays(key, -back);
}
export const isWeekend = (key: string): boolean => [0, 6].includes(weekday(key));
export const isMonday = (key: string): boolean => weekday(key) === 1;
