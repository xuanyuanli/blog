import { BROWSER_HEADERS } from "./http-env";
import { parseKlineRow, type DailyBar } from "./kline-eastmoney";
import { toTencentSymbol } from "./normalize-code";

type TencentKlineResponse = {
  data?: Record<
    string,
    {
      qfqday?: string[][];
      day?: string[][];
    }
  >;
};

/** 腾讯财经 K 线（东财失败时的备用源，对齐 fetch_stock.py） */
export async function fetchTencentKlines(
  code: string,
  limit: number
): Promise<DailyBar[]> {
  const sym = toTencentSymbol(code);
  const days = Math.max(limit, 320);
  const param = `${sym},day,,,${days},qfq`;
  const url = `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${encodeURIComponent(param)}`;

  const res = await fetch(url, {
    headers: {
      ...BROWSER_HEADERS,
      Referer: "https://gu.qq.com/",
    },
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    throw new Error(`腾讯 K 线请求失败: HTTP ${res.status}`);
  }

  const json = (await res.json()) as TencentKlineResponse;
  const raw = json.data?.[sym]?.qfqday ?? json.data?.[sym]?.day ?? [];

  const bars: DailyBar[] = [];
  for (const item of raw) {
    if (item.length < 5) continue;
    const row = `${item[0]},${item[1]},${item[2]},${item[3]},${item[4]}`;
    const bar = parseKlineRow(row);
    if (bar) bars.push(bar);
  }

  if (bars.length > limit) {
    return bars.slice(-limit);
  }
  return bars;
}
