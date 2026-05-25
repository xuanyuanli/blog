import { BROWSER_HEADERS } from "./http-env";
import { toEastmoneySecid } from "./normalize-code";

export type DailyBar = {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
};

type KlineResponse = {
  data?: {
    klines?: string[];
  };
  rc?: number;
};

const EM_UT = "fa5fd1943c7b386f172d6893dbfba10b";

/** 约 6 个月交易日 */
export function tradingDaysForMonths(months: number): number {
  return Math.round(months * 22);
}

export function parseKlineRow(row: string): DailyBar | null {
  const parts = row.split(",");
  if (parts.length < 5) return null;

  const open = Number(parts[1]);
  const close = Number(parts[2]);
  const high = Number(parts[3]);
  const low = Number(parts[4]);

  if ([open, close, high, low].some((n) => Number.isNaN(n) || n <= 0)) {
    return null;
  }

  return {
    date: parts[0],
    open,
    close,
    high,
    low,
  };
}

/** 东方财富 push2his；参数对齐 fetch_stock.py（beg=20200101，不用 lmt） */
export async function fetchEastmoneyKlines(
  code: string,
  limit: number
): Promise<DailyBar[]> {
  const secid = toEastmoneySecid(code);
  const params = new URLSearchParams({
    secid,
    fields1: "f1,f2,f3,f4,f5,f6",
    fields2: "f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61",
    klt: "101",
    fqt: "1",
    beg: "20200101",
    end: "20500101",
    ut: EM_UT,
  });
  const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?${params}`;

  const res = await fetch(url, {
    headers: BROWSER_HEADERS,
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    throw new Error(`东财 K 线请求失败: HTTP ${res.status}`);
  }

  const json = (await res.json()) as KlineResponse;
  if (json.rc !== undefined && json.rc !== 0) {
    throw new Error(`东财 K 线接口返回错误: rc=${json.rc}`);
  }

  const rows = json.data?.klines ?? [];
  const bars = rows
    .map(parseKlineRow)
    .filter((bar): bar is DailyBar => bar !== null);

  if (bars.length > limit) {
    return bars.slice(-limit);
  }
  return bars;
}
