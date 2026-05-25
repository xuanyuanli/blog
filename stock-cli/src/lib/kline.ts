import { fetchEastmoneyKlines, type DailyBar } from "./kline-eastmoney";
import { fetchTencentKlines } from "./kline-tencent";

export type KlineSource = "eastmoney" | "tencent" | "none";

export type KlineFetchResult = {
  bars: DailyBar[];
  source: KlineSource;
  errors: string[];
};

const MIN_BARS = 20;

/** 东财优先，失败或不足时回退腾讯（与 fetch_stock.py 策略一致） */
export async function fetchKlines(
  code: string,
  limit: number
): Promise<KlineFetchResult> {
  const errors: string[] = [];

  try {
    const bars = await fetchEastmoneyKlines(code, limit);
    if (bars.length >= MIN_BARS) {
      return { bars, source: "eastmoney", errors };
    }
    errors.push(
      bars.length === 0 ? "东财 K 线为空" : `东财 K 线仅 ${bars.length} 条`
    );
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err));
  }

  try {
    const bars = await fetchTencentKlines(code, limit);
    if (bars.length >= MIN_BARS) {
      return { bars, source: "tencent", errors };
    }
    errors.push(
      bars.length === 0 ? "腾讯 K 线为空" : `腾讯 K 线仅 ${bars.length} 条`
    );
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err));
  }

  return { bars: [], source: "none", errors };
}

export type { DailyBar } from "./kline-eastmoney";
export { tradingDaysForMonths } from "./kline-eastmoney";
