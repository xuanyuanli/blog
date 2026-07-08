import { isHoliday } from "chinese-days";
import { addDays, dayOfWeek, mondayOf } from "./week";

/**
 * A 股交易日：周一至周五 且 非法定节假日。
 * 注意调休补班的周末对 A 股来说不是交易日，所以先排除周末再查节假日。
 */
export function isTradingDay(dateStr: string): boolean {
  const dow = dayOfWeek(dateStr);
  if (dow === 0 || dow === 6) return false;
  return !isHoliday(dateStr);
}

/** 该日所在周（周一至周五）的最后一个交易日；整周无交易日返回 null */
export function lastTradingDayOfWeek(anyDateInWeek: string): string | null {
  const monday = mondayOf(anyDateInWeek);
  for (let i = 4; i >= 0; i--) {
    const d = addDays(monday, i);
    if (isTradingDay(d)) return d;
  }
  return null;
}
