import { alignWeeks, backtest } from "./backtest";
import { renderReport } from "./backtest-report";
import type { NamedResult } from "./backtest-report";
import { LOOKBACK_WEEKS, TARGETS } from "./config";
import type { Target } from "./config";
import { completedBars, fetchWeeklyBars, fetchWithRetry } from "./data";
import type { WeeklyBar } from "./data";
import { shanghaiDateStr } from "./scheduler";

const WEEKLY_COUNT = 800;

/** 回测对比的两个标的池：全部 5 只 vs 去掉成立较晚的科创芯片ETF 的 4 只 */
const POOLS: { label: string; targets: Target[] }[] = [
  { label: `5标的池（全部）`, targets: TARGETS },
  {
    label: `4标的池（不含科创芯片）`,
    targets: TARGETS.filter((t) => t.code !== "SH588170"),
  },
];

export type BacktestCliOptions = {
  start?: string;
  end?: string;
};

export async function runBacktest(opts: BacktestCliOptions): Promise<string> {
  const todayStr = shanghaiDateStr(Date.now());
  const barsByCode = new Map<string, WeeklyBar[]>();
  // 按标的串行拉取并重试，避免并发过多触发数据源限流
  for (const t of TARGETS) {
    const weekly = await fetchWithRetry(
      () => fetchWeeklyBars(t.code, WEEKLY_COUNT),
      (bars) => bars.length >= LOOKBACK_WEEKS + 2
    );
    barsByCode.set(t.code, completedBars(weekly, todayStr));
  }

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

  const strategies: NamedResult[] = [];
  for (const pool of POOLS) {
    const aligned = alignWeeks(
      barsByCode,
      pool.targets.map((t) => t.code)
    );
    const result = backtest(aligned, pool.targets, {
      lookback: LOOKBACK_WEEKS,
      start: opts.start,
      end: opts.end,
    });
    if (result) {
      strategies.push({ label: pool.label, targets: pool.targets, result });
    } else {
      console.log(`跳过【${pool.label}】：区间内数据不足`);
    }
  }

  if (strategies.length === 0) {
    throw new Error("指定区间内数据不足，无法回测");
  }
  return renderReport(strategies);
}
