import { stocks } from "stock-api";
import {
  fetchKlines,
  tradingDaysForMonths,
  type DailyBar,
} from "./kline-eastmoney";
import { normalizeCode, toStockApiCode } from "./normalize-code";
import { recommendThreshold, type RecommendResult } from "./recommend-threshold";
import { computeTrailingStop, type TrailingStopResult } from "./trailing-stop";
import { computeVolatility, type VolatilityStats } from "./volatility";

export type AnalyzeOptions = {
  thresholdPct: number;
  months: number;
};

export type AnalyzeResult = {
  code: string;
  name: string;
  now: number;
  yesterday: number;
  percent: number;
  source?: string;
  bars: DailyBar[];
  volatility: VolatilityStats;
  recommend: RecommendResult;
  trailing: TrailingStopResult;
  klineWarning?: string;
};

export async function analyzeStock(
  rawCode: string,
  options: AnalyzeOptions
): Promise<AnalyzeResult> {
  const code = normalizeCode(rawCode);
  const limit = tradingDaysForMonths(options.months);

  const apiCode = toStockApiCode(code);

  const [stock, bars] = await Promise.all([
    stocks.auto.getStock(apiCode),
    fetchKlines(code, limit).catch(() => [] as DailyBar[]),
  ]);

  if (!stock.name || stock.name === "-" || (stock.now === 0 && stock.yesterday === 0)) {
    throw new Error(`未找到股票行情: ${code}，请检查代码是否正确`);
  }

  let klineWarning: string | undefined;
  const insufficient = bars.length < 20;
  if (insufficient) {
    klineWarning = `K 线仅 ${bars.length} 条，波动统计与建议阈值可能不准确`;
  }

  const volatility = computeVolatility(bars);
  const recommend = recommendThreshold(code, stock.name, volatility, {
    fallback: insufficient,
  });

  const appliedThresholdPct =
    options.thresholdPct === 0 ? recommend.suggestedPct : options.thresholdPct;
  const trailing = computeTrailingStop(bars, stock.now, appliedThresholdPct);

  return {
    code,
    name: stock.name,
    now: stock.now,
    yesterday: stock.yesterday,
    percent: stock.percent,
    source: stock.source,
    bars,
    volatility,
    recommend,
    trailing,
    klineWarning,
  };
}
