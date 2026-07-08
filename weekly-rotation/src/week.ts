/**
 * 日期与周对齐工具。
 * 所有日期以 YYYY-MM-DD 字符串表示上海时间的自然日，
 * 内部用 UTC 字段承载（避免运行环境时区干扰）。
 */

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(dateStr: string, n: number): string {
  const d = parseDate(dateStr);
  d.setUTCDate(d.getUTCDate() + n);
  return formatDate(d);
}

/** 星期几：0=周日 ... 6=周六 */
export function dayOfWeek(dateStr: string): number {
  return parseDate(dateStr).getUTCDay();
}

/** 所在周的周一（周对齐键，用于跨数据源对齐周K） */
export function mondayOf(dateStr: string): string {
  const dow = dayOfWeek(dateStr);
  return addDays(dateStr, -((dow + 6) % 7));
}
