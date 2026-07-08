import { allCombos, alignWeeks, backtestCombo } from "./backtest";
import { renderReport } from "./backtest-report";
import type { NamedResult } from "./backtest-report";
import { LOOKBACK_WEEKS, TARGETS } from "./config";
import { completedBars, fetchWeeklyBars } from "./data";
import type { WeeklyBar } from "./data";
import { shanghaiDateStr } from "./scheduler";

/** 一次拉全所有标的的周K，供全部组合复用 */
const KLINE_COUNT = 800;

export type BacktestCliOptions = {
  start?: string;
  end?: string;
};

export async function runBacktest(opts: BacktestCliOptions): Promise<string> {
  const todayStr = shanghaiDateStr(Date.now());
  const barsByCode = new Map<string, WeeklyBar[]>();
  await Promise.all(
    TARGETS.map(async (t) => {
      const bars = await fetchWeeklyBars(t.code, KLINE_COUNT);
      barsByCode.set(t.code, completedBars(bars, todayStr));
    })
  );

  for (const t of TARGETS) {
    const bars = barsByCode.get(t.code)!;
    if (bars.length < LOOKBACK_WEEKS + 2) {
      throw new Error(`${t.name}(${t.code}) 周K数据不足，无法回测`);
    }
    console.log(
      `${t.name}(${t.code}): ${bars.length} 周，${bars[0].date} ~ ${bars[bars.length - 1].date}`
    );
  }
  console.log("");

  const results: NamedResult[] = [];
  for (const combo of allCombos(TARGETS)) {
    const aligned = alignWeeks(
      barsByCode,
      combo.map((t) => t.code)
    );
    const result = backtestCombo(aligned, combo, {
      lookback: LOOKBACK_WEEKS,
      start: opts.start,
      end: opts.end,
    });
    if (result) {
      results.push({ targets: combo, result });
    } else {
      console.log(
        `跳过组合 ${combo.map((t) => t.name).join(" + ")}：区间内数据不足`
      );
    }
  }

  if (results.length === 0) {
    throw new Error("所有组合在指定区间内数据都不足");
  }
  return renderReport(results);
}
