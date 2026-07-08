import { setDefaultResultOrder } from "node:dns";
import { stocks } from "stock-api";
import { mondayOf } from "./week";

// 部分网络环境下 IPv6 直连东财等数据源会断连（UND_ERR_SOCKET），强制 IPv4 优先
setDefaultResultOrder("ipv4first");

/** stock-api 归一化行情（未从包根导出，本地声明所需字段） */
export type Quote = {
  code: string;
  name: string;
  now: number;
  yesterday: number;
  percent: number;
};

type KlineRow = {
  date: string;
  close: number;
};

export type WeeklyBar = {
  /** 该周对齐键：周一日期 */
  weekKey: string;
  /** 数据源给出的日期（一般为该周最后交易日） */
  date: string;
  close: number;
};

export async function fetchQuotes(codes: string[]): Promise<Quote[]> {
  return stocks.auto.getStocks(codes);
}

/**
 * 数据源偶发限流/断连会返回不完整数据或报错（如 159949 的前复权周K
 * 仅东财可用，东财失败时 auto 会整体返回空）：结果不满足 isValid 时
 * 稍等重试，重试耗尽后返回最后一次结果交由调用方校验。
 */
export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  isValid: (v: T) => boolean,
  attempts = 3,
  delayMs = 2000
): Promise<T> {
  let last: T | undefined;
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, delayMs));
    try {
      last = await fn();
      lastErr = undefined;
      if (isValid(last)) return last;
    } catch (err) {
      lastErr = err;
    }
  }
  if (lastErr !== undefined) throw lastErr;
  return last as T;
}

/**
 * 拉取周 K 并归一化为 WeeklyBar（旧→新）。
 * 使用前复权：ETF 份额拆分/分红会使不复权序列断裂（如 515880 拆分当周价格腰斩），
 * 前复权以最新价为锚，历史收盘可直接与实时价比较。
 */
export async function fetchWeeklyBars(
  code: string,
  count: number
): Promise<WeeklyBar[]> {
  const klines: KlineRow[] = await stocks.auto.getKlines(code, {
    period: "week",
    count,
    adjust: "qfq",
  });
  return klines
    .filter((k) => Number.isFinite(k.close) && k.close > 0)
    .map((k) => ({ weekKey: mondayOf(k.date), date: k.date, close: k.close }));
}

/** 排除进行中的本周 bar，得到已完结周序列 */
export function completedBars(
  bars: WeeklyBar[],
  todayStr: string
): WeeklyBar[] {
  const currentWeek = mondayOf(todayStr);
  return bars.filter((b) => b.weekKey < currentWeek);
}
