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
 * 仅部分源可用）：结果不满足 isValid 时稍等重试，重试耗尽后返回最后一次
 * 结果交由调用方校验。
 */
export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  isValid: (v: T) => boolean,
  attempts = 5,
  delayMs = 2500
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

function toWeeklyBars(klines: KlineRow[]): WeeklyBar[] {
  return klines
    .filter((k) => Number.isFinite(k.close) && k.close > 0)
    .map((k) => ({ weekKey: mondayOf(k.date), date: k.date, close: k.close }));
}

function toTencentApiCode(code: string): string {
  if (code.startsWith("SH") || code.startsWith("sh")) return `sh${code.slice(2)}`;
  if (code.startsWith("SZ") || code.startsWith("sz")) return `sz${code.slice(2)}`;
  return code.toLowerCase();
}

type TencentFqKlinePayload = {
  data?: Record<
    string,
    {
      qfqweek?: Array<Array<string | number>>;
      week?: Array<Array<string | number>>;
    }
  >;
};

/**
 * 腾讯 fqkline 对部分 ETF（如 159949）把前复权周K放在 `week` 而不是 `qfqweek`，
 * stock-api 按 `qfqweek` 取值会得到空数组。这里两种字段都认。
 */
export function parseTencentFqWeek(
  payload: TencentFqKlinePayload,
  apiCode: string
): KlineRow[] {
  const block = payload.data?.[apiCode];
  const rows = block?.qfqweek ?? block?.week ?? [];
  return rows
    .map((row) => ({
      date: String(row[0] ?? ""),
      close: Number(row[2]),
    }))
    .filter((k) => k.date && Number.isFinite(k.close) && k.close > 0);
}

async function fetchWeeklyBarsFromTencent(
  code: string,
  count: number
): Promise<WeeklyBar[]> {
  const apiCode = toTencentApiCode(code);
  const url = `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${apiCode},week,,,${count},qfq`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`腾讯周K HTTP ${response.status}`);
  }
  const payload = (await response.json()) as TencentFqKlinePayload;
  return toWeeklyBars(parseTencentFqWeek(payload, apiCode));
}

async function fetchWeeklyBarsFromProvider(
  provider: "auto" | "eastmoney" | "tencent",
  code: string,
  count: number
): Promise<WeeklyBar[]> {
  const api = stocks[provider];
  const klines: KlineRow[] = await api.getKlines(code, {
    period: "week",
    count,
    adjust: "qfq",
  });
  return toWeeklyBars(klines);
}

/**
 * 拉取周 K 并归一化为 WeeklyBar（旧→新）。
 * 使用前复权：ETF 份额拆分/分红会使不复权序列断裂（如 515880 拆分当周价格腰斩），
 * 前复权以最新价为锚，历史收盘可直接与实时价比较。
 *
 * 多源回退：auto → 东财 → 腾讯 fqkline（兼容 week/qfqweek）。
 * 创业板50ETF（159949）的前复权周K在 stock-api 的腾讯解析下经常为空，必须走直连回退。
 */
export async function fetchWeeklyBars(
  code: string,
  count: number
): Promise<WeeklyBar[]> {
  const sources: Array<{ name: string; run: () => Promise<WeeklyBar[]> }> = [
    { name: "auto", run: () => fetchWeeklyBarsFromProvider("auto", code, count) },
    {
      name: "eastmoney",
      run: () => fetchWeeklyBarsFromProvider("eastmoney", code, count),
    },
    { name: "tencent-fqkline", run: () => fetchWeeklyBarsFromTencent(code, count) },
  ];

  let lastErr: unknown;
  for (const source of sources) {
    try {
      const bars = await source.run();
      if (bars.length > 0) {
        if (source.name !== "auto") {
          console.warn(`${code} 周K改用 ${source.name}（${bars.length} 根）`);
        }
        return bars;
      }
    } catch (err) {
      lastErr = err;
    }
  }
  if (lastErr !== undefined) {
    console.warn(
      `${code} 周K全部数据源失败:`,
      lastErr instanceof Error ? lastErr.message : lastErr
    );
  }
  return [];
}

/** 排除进行中的本周 bar，得到已完结周序列 */
export function completedBars(
  bars: WeeklyBar[],
  todayStr: string
): WeeklyBar[] {
  const currentWeek = mondayOf(todayStr);
  return bars.filter((b) => b.weekKey < currentWeek);
}
