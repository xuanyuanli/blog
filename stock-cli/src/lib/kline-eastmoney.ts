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
};

/** 约 6 个月交易日 */
export function tradingDaysForMonths(months: number): number {
  return Math.round(months * 22);
}

export async function fetchKlines(
  code: string,
  limit: number
): Promise<DailyBar[]> {
  const secid = toEastmoneySecid(code);
  const url =
    `https://push2his.eastmoney.com/api/qt/stock/kline/get` +
    `?secid=${encodeURIComponent(secid)}` +
    `&klt=101&fqt=1&beg=0&end=20500101&lmt=${limit}` +
    `&ut=fa5fd1943c7b386f172d6893dbfba10b` +
    `&fields1=f1&fields2=f51,f52,f53,f54,f55,f56,f57`;

  const res = await fetch(url, {
    headers: {
      Accept: "application/json,text/plain,*/*",
      Referer: "https://quote.eastmoney.com/",
    },
  });

  if (!res.ok) {
    throw new Error(`K 线请求失败: HTTP ${res.status}`);
  }

  const json = (await res.json()) as KlineResponse & { rc?: number };
  if (json.rc !== undefined && json.rc !== 0) {
    throw new Error(`K 线接口返回错误: rc=${json.rc}`);
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

function parseKlineRow(row: string): DailyBar | null {
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
