import { ROTATION_HOUR, ROTATION_MINUTE } from "./config";
import { lastTradingDayOfWeek } from "./trading-day";
import { addDays, formatDate, mondayOf } from "./week";

const SHANGHAI_OFFSET_MS = 8 * 3600_000; // 中国无夏令时，固定 UTC+8

/** 上海时间的自然日 YYYY-MM-DD */
export function shanghaiDateStr(nowMs: number): string {
  return formatDate(new Date(nowMs + SHANGHAI_OFFSET_MS));
}

/** 某日上海时间 14:30 对应的 epoch 毫秒 */
export function rotationInstant(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return (
    Date.UTC(y, m - 1, d, ROTATION_HOUR, ROTATION_MINUTE) - SHANGHAI_OFFSET_MS
  );
}

export type NextRotation = {
  dateStr: string;
  atMs: number;
};

/**
 * 下一次轮动时刻：本周最后一个交易日 14:30；
 * 已过则看下周；整周无交易日顺延。
 */
export function findNextRotation(nowMs: number): NextRotation {
  let monday = mondayOf(shanghaiDateStr(nowMs));
  for (let i = 0; i < 60; i++) {
    const rotDay = lastTradingDayOfWeek(monday);
    if (rotDay) {
      const atMs = rotationInstant(rotDay);
      if (atMs > nowMs) return { dateStr: rotDay, atMs };
    }
    monday = addDays(monday, 7);
  }
  throw new Error("60 周内找不到轮动日，节假日数据可能异常");
}

const MAX_SLEEP_MS = 6 * 3600_000; // 分段睡眠，避免长 setTimeout 漂移

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type DaemonJob = (todayStr: string) => Promise<void>;

/** 常驻调度循环：到点执行 job，然后排下一周 */
export async function runDaemon(job: DaemonJob): Promise<never> {
  for (;;) {
    const next = findNextRotation(Date.now());
    console.log(
      `[scheduler] 下次轮动: ${next.dateStr} 14:30 (上海时间), ` +
        `${new Date(next.atMs).toISOString()}`
    );
    while (Date.now() < next.atMs) {
      await sleep(Math.min(next.atMs - Date.now(), MAX_SLEEP_MS));
    }
    try {
      await job(next.dateStr);
    } catch (err) {
      console.error("[scheduler] 轮动执行失败:", err);
    }
  }
}
