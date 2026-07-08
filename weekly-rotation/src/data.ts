import { stocks } from "stock-api";
import { mondayOf } from "./week";

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
